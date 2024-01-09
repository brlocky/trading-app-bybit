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
  buttonHeight,
  buttonWidth,
  centreLabelHeight,
  centreLabelInlinePadding,
  iconPadding,
  removeButtonWidth,
  showCentreLabelDistance,
} from './constants';
import { IRendererData, LineRendererData } from './irenderer-data';
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
  private _hoverLabel = false;
  private _hoverRemove = false;
  private _hoverTP = false;
  private _hoverSL = false;
  private _hoverBE = false;
  private _hoverSend = false;
  private _hoverSplit = false;
  private _draggingFromPrice: number | null = null;
  private _isDragging = false;
  private _hoveringID = '';

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
        if (this._isDragging || this._draggingID) {
          return;
        }
        if (this._hoverRemove) {
          this.removeLine(this._hoveringID);
        } else if (this._hoverTP) {
          this.addTP();
        } else if (this._hoverSL) {
          this.addSL();
        } else if (this._hoverBE) {
          this.addBE();
        } else if (this._hoverSplit) {
          this.addSplit(this._hoveringID);
        } else if (this._hoverSend) {
          this.addSend(this._hoveringID);
        }
        requestUpdate();
      }
    }, this);

    this._mouseHandlers.dragStarted().subscribe((mousePosition: MousePosition | null) => {
      if (mousePosition && this._draggingID && this._hoverLabel) {
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
        this._draggingID = null;
        this._hoveringID = '';
        this._draggingFromPrice = null;
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
    if (rendererData?.lines.some((l) => l.hoverRemove || l.hoverTP || l.hoverSL || l.hoverBE || l.hoverSplit || l.hoverSend)) {
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
          if (l.type !== 'ENTRY' && !l.isLive) {
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

  _isHoveringLabel(mousePosition: MousePosition | null, timescaleWidth: number, y: number, labelWidth: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > centreLabelHeight / 2) return false;

    const buttonCentreX = (timescaleWidth + labelWidth) * 0.5 - labelWidth * 0.5;
    return Math.abs(mousePosition.x - buttonCentreX) < labelWidth / 2;
  }

  _isHoveringRemoveButton(mousePosition: MousePosition | null, timescaleWidth: number, y: number, labelWidth: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > centreLabelHeight / 2) return false;

    const buttonCentreX = (timescaleWidth + labelWidth - removeButtonWidth) * 0.5;

    return Math.abs(mousePosition.x - buttonCentreX) < removeButtonWidth / 2;
  }

  _isHoveringTP(mousePosition: MousePosition | null, timescaleWidth: number, y: number, labelWidth: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > centreLabelHeight / 2) return false;

    const buttonCentreX = timescaleWidth / 2 - labelWidth / 2 - buttonWidth / 2 - iconPadding - buttonWidth - iconPadding;
    return Math.abs(mousePosition.x - buttonCentreX) < buttonWidth / 2;
  }

  _isHoveringSL(mousePosition: MousePosition | null, timescaleWidth: number, y: number, labelWidth: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > centreLabelHeight / 2) return false;

    const buttonCentreX = timescaleWidth / 2 - labelWidth / 2 - buttonWidth / 2 - iconPadding;

    return Math.abs(mousePosition.x - buttonCentreX) < buttonWidth / 2;
  }

  _isHoveringBE(mousePosition: MousePosition | null, timescaleWidth: number, y: number, labelWidth: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > centreLabelHeight / 2) return false;

    const buttonCentreX =
      timescaleWidth / 2 - labelWidth / 2 - buttonWidth / 2 - iconPadding - buttonWidth - iconPadding - buttonWidth - iconPadding;
    return Math.abs(mousePosition.x - buttonCentreX) < buttonWidth / 2;
  }

  _isHoveringSendButton(mousePosition: MousePosition | null, timescaleWidth: number, y: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > buttonHeight / 2) return false;
    const labelWidth = centreLabelInlinePadding * 2 + 'Send'.length * averageWidthPerCharacter;

    const buttonCentreX = timescaleWidth - labelWidth / 2;

    return Math.abs(mousePosition.x - buttonCentreX) < labelWidth / 2;
  }

  _calculdateTextWidth(textLength: number) {
    return centreLabelInlinePadding * 2 + removeButtonWidth + removeButtonWidth + textLength * averageWidthPerCharacter;
  }

  _isHoverButtons() {
    return this._hoverRemove || this._hoverTP || this._hoverSL || this._hoverBE || this._hoverSplit || this._hoverSend;
  }
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

    const calculatePnl = (entry: TradingLineInfo, line: TradingLineInfo): string => {
      // Determine the direction of the trade
      const isLongTrade = entry.side === 'Buy';

      let pnl = 0;
      if (line.type === 'ENTRY') {
        const price = this.getMarketPrice();
        if (price > 0 && entry.isLive) pnl = isLongTrade ? entry.qty * (price - entry.price) : entry.qty * (entry.price - price);
      } else {
        pnl = isLongTrade ? line.qty * (line.price - entry.price) : line.qty * (entry.price - line.price);
      }

      return pnl.toFixed(2);
    };

    const lines: LineRendererData[] = tradingLines.map((l, index) => {
      const price = Number(priceFormatter.format(l.price));
      const y = serie.priceToCoordinate(price) as number;
      if (mousePosition?.y && y) {
        const distance = Math.abs(mousePosition.y - y);
        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      }

      const entry = tradingLines.find((tl) => tl.type === 'ENTRY' && tl.isLive === l.isLive);
      const text = ` ${l.qty}@${l.price} `;
      const pnl = entry ? calculatePnl(entry, l) : '';
      return {
        y,
        text: text,
        hoverRemove: false,
        hoverLabel: false,
        hoverTP: false,
        hoverSL: false,
        hoverBE: false,
        hoverSend: false,
        hoverSplit: false,
        pnl: pnl,
        line: l,
        showSend: !l.isLive && l.type === 'ENTRY',
        price: price,
      };
    });

    if (!this._isDragging) {
      this._hoverLabel = this._hoverRemove = this._hoverSL = this._hoverTP = this._hoverBE = this._hoverSplit = this._hoverSend = false;
      if (closestIndex >= 0 && closestDistance < showCentreLabelDistance) {
        const timescaleWidth = this._chart?.timeScale().width() ?? 0;
        const a = lines[closestIndex];
        const text = a.text;
        const labelWidth = this._calculdateTextWidth(text.length);

        this._hoverRemove = this._isHoveringRemoveButton(mousePosition, timescaleWidth, a.y, labelWidth);

        if (a.line.type === 'ENTRY') {
          this._hoverTP = this._isHoveringTP(mousePosition, timescaleWidth, a.y, labelWidth);
          this._hoverSL = this._isHoveringSL(mousePosition, timescaleWidth, a.y, labelWidth);
          this._hoverBE = this._isHoveringBE(mousePosition, timescaleWidth, a.y, labelWidth);
          this._hoverSend = this._isHoveringSendButton(mousePosition, timescaleWidth, a.y);
        } else {
          this._hoverSplit = this._isHoveringSL(mousePosition, timescaleWidth, a.y, labelWidth);
        }

        if (!this._isHoverButtons()) {
          this._hoverLabel =
            this._isHoveringLine(mousePosition, timescaleWidth, a.y) ||
            this._isHoveringLabel(mousePosition, timescaleWidth, a.y, labelWidth);
        }

        lines[closestIndex] = {
          ...lines[closestIndex],
          hoverRemove: this._hoverRemove,
          hoverLabel: this._hoverLabel,
          hoverTP: this._hoverTP,
          hoverSL: this._hoverSL,
          hoverBE: this._hoverBE,
          hoverSend: this._hoverSend,
          hoverSplit: this._hoverSplit,
        };
        if (
          this._hoverRemove ||
          this._hoverLabel ||
          this._hoverTP ||
          this._hoverSL ||
          this._hoverBE ||
          this._hoverSplit ||
          this._hoverSend
        ) {
          this._hoveringID = a.line.id;
        } else {
          this._hoveringID = '';
        }
        if (this._hoverLabel && a.line.draggable && !this._isDragging) {
          this._draggingID = a.line.id;
        } else {
          this._draggingID = null;
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
