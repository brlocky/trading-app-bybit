import {
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  ISeriesPrimitivePaneView,
  PrimitiveHoveredItem,
  SeriesAttachedParameter,
  SeriesType,
  Time,
} from 'lightweight-charts';
import {
  averageWidthPerCharacter,
  buttonWidth,
  centreLabelHeight,
  centreLabelInlinePadding,
  clockIconPaths,
  clockPlusIconPaths,
  dragButtonWidth,
  dragIconPaths,
  dragIconViewBoxSize,
  removeButtonWidth,
  showCentreLabelDistance,
} from './constants';
import { LineRendererData, IRendererData } from './irenderer-data';
import { MouseHandlers, MousePosition } from './mouse';
import { TradingPricePaneView } from './pane-view';
import { TradingLineInfo, TradingLinesState } from './state';

export class TradingLines extends TradingLinesState implements ISeriesPrimitive<Time> {
  private _chart: IChartApi | undefined = undefined;
  private _series: ISeriesApi<SeriesType> | undefined = undefined;
  private _mouseHandlers: MouseHandlers;

  private _paneViews: TradingPricePaneView[] = [];
  private _pricePaneViews: TradingPricePaneView[] = [];

  private _lastMouseUpdate: MousePosition | null = null;
  private _currentCursor: string | null = null;

  private _symbolName = '';

  private _draggingID: string | null = null;
  private _isDragging = false;

  constructor() {
    super();
    this._mouseHandlers = new MouseHandlers();
  }

  attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time>) {
    this._chart = chart;
    this._series = series;
    this._paneViews = [new TradingPricePaneView(false)];
    this._pricePaneViews = [new TradingPricePaneView(true)];
    this._mouseHandlers.attached(chart, series);
    this._mouseHandlers.mouseMoved().subscribe((mouseUpdate: MousePosition | null) => {
      this._lastMouseUpdate = mouseUpdate;
      requestUpdate();
    }, this);
    this._mouseHandlers.clicked().subscribe((mousePosition: MousePosition | null) => {
      if (mousePosition && this._series) {
        if (this._hoveringID && !this._isDragging) {
          this.removeLine(this._hoveringID);
          requestUpdate();
        }
      }
    }, this);

    this._mouseHandlers.dragStarted().subscribe((mousePosition: MousePosition | null) => {
      if (mousePosition && this._draggingID) {
        this._isDragging = true;
        this._chart?.applyOptions({
          handleScroll: false,
          handleScale: false,
        });
      }
    }, this);

    this._mouseHandlers.dragged().subscribe((mousePosition: MousePosition | null) => {
      if (mousePosition && this._draggingID && this._isDragging) {
        this.updateLinePosition(this._draggingID, mousePosition);
        requestUpdate(); // Trigger an update to reflect the changes
      }
    }, this);

    this._mouseHandlers.dragEnded().subscribe(() => {
      if (this._isDragging) {
        this._isDragging = false;
        this._chart?.applyOptions({
          handleScroll: true,
          handleScale: true,
        });
      }
    }, this);
  }

  detached() {
    this._mouseHandlers.mouseMoved().unsubscribeAll(this);
    this._mouseHandlers.clicked().unsubscribeAll(this);
    this._mouseHandlers.dragStarted().unsubscribeAll(this);
    this._mouseHandlers.dragged().unsubscribeAll(this);
    this._mouseHandlers.dragEnded().unsubscribeAll(this);
    this._mouseHandlers.detached();
    this._series = undefined;
  }

  paneViews(): readonly ISeriesPrimitivePaneView[] {
    return this._paneViews;
  }

  priceAxisPaneViews(): readonly ISeriesPrimitivePaneView[] {
    return this._pricePaneViews;
  }

  updateAllViews(): void {
    const lines = this.lines();
    const rendererData = this._calculateRendererData(lines, this._lastMouseUpdate);
    this._currentCursor = null;
    if (rendererData?.button?.hovering || rendererData?.lines.some((l) => l.hoverRemove)) {
      this._currentCursor = 'pointer';
    } else if (rendererData?.lines.some((l) => l.hoverLabel)) {
      this._currentCursor = 'move';
    }
    this._paneViews.forEach((pv) => pv.update(rendererData));
    this._pricePaneViews.forEach((pv) => pv.update(rendererData));
  }

  hitTest(): PrimitiveHoveredItem | null {
    if (!this._currentCursor) return null;
    return {
      cursorStyle: this._currentCursor,
      externalId: 'trading-lines-primitive',
      zOrder: 'top',
    };
  }

  // Add a method to update the position of the line
  private updateLinePosition(lineID: string, newPosition: MousePosition): void {
    // Find the line with the given ID and update its position based on the newPosition
    // You may need to calculate the new price based on the y-coordinate of newPosition
    if (!this._series) return;
    const price = this._series.coordinateToPrice(newPosition.y);
    if (!price) return;
    this.updateLinePrice(lineID, price);
  }

  setSymbolName(name: string) {
    this._symbolName = name;
  }

  _isHovering(mousePosition: MousePosition | null): boolean {
    return Boolean(
      mousePosition && mousePosition.xPositionRelativeToPriceScale >= 1 && mousePosition.xPositionRelativeToPriceScale < buttonWidth,
    );
  }

  _isHoveringLine(mousePosition: MousePosition | null, timescaleWidth: number, y: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > 2) return false;

    return true;
  }

  _isHoveringLabel(mousePosition: MousePosition | null, timescaleWidth: number, y: number, textLength: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > centreLabelHeight / 2) return false;

    const labelWidth = centreLabelInlinePadding * 2 + removeButtonWidth + textLength * averageWidthPerCharacter;
    const buttonCentreX = (timescaleWidth + labelWidth) * 0.5 - labelWidth * 0.5;
    console.log('timescaleWidth', timescaleWidth);
    console.log('center', Math.abs(mousePosition.x - buttonCentreX));
    console.log('dist', labelWidth / 2);
    return Math.abs(mousePosition.x - buttonCentreX) < labelWidth / 2;
  }

  _isHoveringRemoveButton(mousePosition: MousePosition | null, timescaleWidth: number, y: number, textLength: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > centreLabelHeight / 2) return false;

    const labelWidth = centreLabelInlinePadding * 2 + removeButtonWidth + textLength * averageWidthPerCharacter;
    const buttonCentreX = (timescaleWidth + labelWidth - removeButtonWidth) * 0.5;

    return Math.abs(mousePosition.x - buttonCentreX) < removeButtonWidth / 2;
  }

  private _hoveringID = '';

  /**
   * We are calculating this here instead of within a view
   * because the data is identical for both Renderers so lets
   * rather calculate it once here.
   */
  _calculateRendererData(tradingLines: TradingLineInfo[], mousePosition: MousePosition | null): IRendererData | null {
    if (!this._series) return null;
    const priceFormatter = this._series.priceFormatter();

    const showCrosshair = mousePosition && !mousePosition.overTimeScale;
    const showButton = showCrosshair;
    const crosshairPrice = mousePosition && this._series.coordinateToPrice(mousePosition.y);
    const crosshairPriceText = priceFormatter.format(crosshairPrice ?? -100);

    let closestDistance = Infinity;
    let closestIndex = -1;

    const lines: (LineRendererData & { price: number; id: string })[] = tradingLines.map((l, index) => {
      const y = this._series?.priceToCoordinate(l.price) ?? -100;
      if (mousePosition?.y && y >= 0) {
        const distance = Math.abs(mousePosition.y - y);
        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      }
      const text = `${this._symbolName} crossing ${this._series?.priceFormatter().format(l.price)}`;

      return {
        y,
        text: text,
        hoverRemove: false,
        hoverLabel: false,
        price: l.price,
        id: l.id,
      };
    });
    this._hoveringID = '';
    if (!this._isDragging) {
      this._draggingID = null;
    }
    if (closestIndex >= 0 && closestDistance < showCentreLabelDistance) {
      const timescaleWidth = this._chart?.timeScale().width() ?? 0;
      const a = lines[closestIndex];
      const text = a.text;
      const hoverRemove = this._isHoveringRemoveButton(mousePosition, timescaleWidth, a.y, text.length);
      const hoverLabel =
        this._isHoveringLine(mousePosition, timescaleWidth, a.y) || this._isHoveringLabel(mousePosition, timescaleWidth, a.y, text.length);
      lines[closestIndex] = {
        ...lines[closestIndex],
        hoverRemove,
        hoverLabel,
      };
      if (hoverRemove) {
        this._hoveringID = a.id;
      } else if (!this._isDragging && hoverLabel) this._draggingID = a.id;
    }
    return {
      alertIcon: clockIconPaths,
      dragIcon: dragIconPaths,
      lines: lines,
      button: showButton
        ? {
            hovering: this._isHovering(mousePosition),
            hoverColor: '#50535E',
            crosshairLabelIcon: clockPlusIconPaths,
          }
        : null,
      color: '#131722',
      crosshair: showCrosshair
        ? {
            y: mousePosition.y,
            text: crosshairPriceText,
          }
        : null,
    };
  }
}
