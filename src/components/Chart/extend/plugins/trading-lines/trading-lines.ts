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
  iconPadding,
  removeButtonWidth,
  sendButtonWidth,
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

  private _lastMouseUpdate: MousePosition | null = null;
  private _currentCursor: string | null = null;

  private _draggingID: string | null = null;
  private _hoverRemove = false;
  private _hoverSend = false;
  private _draggingFromPrice: number | null = null;
  private _isDragging = false;

  constructor() {
    super();
    this._mouseHandlers = new MouseHandlers();
  }

  attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time>) {
    this._chart = chart;
    this._series = series;
    this._paneViews = [new TradingPricePaneView()];
    this._mouseHandlers.attached(chart, series);
    this._mouseHandlers.mouseMoved().subscribe((mouseUpdate: MousePosition | null) => {
      this._lastMouseUpdate = mouseUpdate;
      requestUpdate();
    }, this);
    this._mouseHandlers.clicked().subscribe((mousePosition: MousePosition | null) => {
      if (mousePosition && this._series) {
        if (this._isDragging || !this._hoveringID) {
          return;
        }
        if (this._hoverRemove) {
          this.removeLine(this._hoveringID);
          requestUpdate();
        } else if (this._hoverSend) {
          this.sendOrder();
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

    this._mouseHandlers.dragging().subscribe((mousePosition: MousePosition | null) => {
      if (mousePosition && this._draggingID && this._isDragging) {
        this.updateLinePosition(this._draggingID, mousePosition);
        requestUpdate(); // Trigger an update to reflect the changes
      }
    }, this);

    this._mouseHandlers.dragEnded().subscribe(() => {
      if (this._isDragging && this._draggingID) {
        this.lineDragEnded(this._draggingID, this._draggingFromPrice as number);
        this._isDragging = false;
        this._draggingFromPrice = null;
        this._chart?.applyOptions({
          handleScroll: true,
          handleScale: true,
        });
        requestUpdate(); // Trigger an update to reflect the changes
      }
    }, this);
  }

  detached() {
    this._mouseHandlers.mouseMoved().unsubscribeAll(this);
    this._mouseHandlers.clicked().unsubscribeAll(this);
    this._mouseHandlers.dragStarted().unsubscribeAll(this);
    this._mouseHandlers.dragging().unsubscribeAll(this);
    this._mouseHandlers.dragEnded().unsubscribeAll(this);
    this._mouseHandlers.detached();
    this._series = undefined;
  }

  paneViews(): readonly ISeriesPrimitivePaneView[] {
    return this._paneViews;
  }

  updateAllViews(): void {
    const lines = this.lines();
    const rendererData = this._calculateRendererData(lines, this._lastMouseUpdate);
    this._currentCursor = null;
    if (rendererData?.lines.some((l) => l.hoverRemove || l.hoverSend)) {
      this._currentCursor = 'pointer';
    } else if (rendererData?.lines.some((l) => l.hoverLabel)) {
      this._currentCursor = 'move';
    }
    this._paneViews.forEach((pv) => pv.update(rendererData));
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

    const formattedPrice = Number(this._series.priceFormatter().format(price));

    // Save old price before move
    if (this._isDragging && !this._draggingFromPrice) {
      this._draggingFromPrice = this.getLinePrice(lineID);
    }

    const existingLine = this.lines().find((l) => l.id === lineID);

    if (existingLine) {
      const oldPrice = existingLine.price;
      existingLine.price = formattedPrice;
      if (existingLine.type === 'ENTRY' && existingLine.isLive === false) {
        const priceDiff = existingLine.price - oldPrice;

        this.lines().forEach((l) => {
          if (l.type !== 'ENTRY') {
            const formattedPriceDiff = Number(this._series?.priceFormatter().format(l.price + priceDiff));
            l.price = formattedPriceDiff;
            this.updateLine(l.id, l);
          }
        });
      }
      this.updateLine(lineID, existingLine);
    }
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

    return mousePosition.xPositionRelativeToPriceScale >= 1 && mousePosition.x < timescaleWidth;
  }

  _isHoveringLabel(mousePosition: MousePosition | null, timescaleWidth: number, y: number, textLength: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > centreLabelHeight / 2) return false;

    const labelWidth = centreLabelInlinePadding * 2 + removeButtonWidth + textLength * averageWidthPerCharacter;
    const buttonCentreX = (timescaleWidth + labelWidth) * 0.5 - labelWidth * 0.5;
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

  _isHoveringSendButton(mousePosition: MousePosition | null, timescaleWidth: number, y: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > centreLabelHeight / 2) return false;

    const buttonCentreX = timescaleWidth - iconPadding - sendButtonWidth / 2;

    return Math.abs(mousePosition.x - buttonCentreX) < sendButtonWidth / 2;
  }

  private _hoveringID = '';

  /**
   * We are calculating this here instead of within a view
   * because the data is identical for both Renderers so lets
   * rather calculate it once here.
   */
  _calculateRendererData(tradingLines: TradingLineInfo[], mousePosition: MousePosition | null): IRendererData | null {
    if (!this._series) return null;
    const serie = this._series;
    const priceFormatter = serie.priceFormatter();

    const showCrosshair = mousePosition && !mousePosition.overTimeScale;
    const crosshairPrice = mousePosition && serie.coordinateToPrice(mousePosition.y);
    const crosshairPriceText = priceFormatter.format(crosshairPrice ?? 0);

    let closestDistance = Infinity;
    let closestIndex = -1;

    const entry = tradingLines.find((l) => l.type === 'ENTRY');

    const calculatePnl = (entry: TradingLineInfo, line: TradingLineInfo): string | null => {
      if (!entry || line.type === 'ENTRY') {
        return null;
      }

      // Determine the direction of the trade
      const isLongTrade = entry.side === 'Buy';

      // Calculate PnL based on the trade direction
      const pnl = isLongTrade ? line.qty * (line.price - entry.price) : line.qty * (entry.price - line.price);

      return pnl.toFixed(2);
    };

    const lines: (LineRendererData & { price: number; id: string })[] = tradingLines.map((l, index) => {
      const price = Number(priceFormatter.format(l.price));
      const y = serie.priceToCoordinate(price) as number;
      if (mousePosition?.y && y) {
        const distance = Math.abs(mousePosition.y - y);
        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      }

      let text = `#${l.type} qty@${l.qty}`;

      if (entry) {
        const pnl = calculatePnl(entry, l);
        if (pnl) {
          text += ' pnl@' + pnl;
        }
      }

      return {
        y,
        text: text,
        hoverRemove: false,
        hoverLabel: false,
        hoverSend: false,
        showSend: !l.isLive && l.type === 'ENTRY',
        price: price,
        id: l.id,
        draggable: l.draggable,
        isLive: l.isLive,
      };
    });

    this._hoveringID = '';
    if (!this._isDragging) {
      this._draggingID = null;
    }
    this._hoverRemove = this._hoverSend = false;
    if (closestIndex >= 0 && closestDistance < showCentreLabelDistance) {
      const timescaleWidth = this._chart?.timeScale().width() ?? 0;
      const a = lines[closestIndex];
      const text = a.text;

      this._hoverSend = a.showSend && this._isHoveringSendButton(mousePosition, timescaleWidth, a.y);
      this._hoverRemove = this._isHoveringRemoveButton(mousePosition, timescaleWidth, a.y, text.length);

      const hoverLabel = this._hoverSend
        ? false
        : a.draggable &&
          (this._isHoveringLine(mousePosition, timescaleWidth, a.y) ||
            this._isHoveringLabel(mousePosition, timescaleWidth, a.y, text.length));

      lines[closestIndex] = {
        ...lines[closestIndex],
        hoverRemove: this._hoverRemove,
        hoverLabel: hoverLabel,
        hoverSend: this._hoverSend,
      };
      if (this._hoverRemove || hoverLabel || this._hoverSend) {
        this._hoveringID = a.id;
        if (!this._isDragging) {
          this._draggingID = a.id;
        }
      }
    }
    return {
      lines: lines,
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
