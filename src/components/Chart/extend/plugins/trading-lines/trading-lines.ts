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
  private _draggingID: string | null = null;

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
      if (mousePosition && this._series && this._hoveringID) {
        if (this._hoverRemove) {
          this.removeLine(this._hoveringID);
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
      if (!this._hoverLabel && !this._hoverTP && !this._hoverSL) return;

      const line = this.getLine(this._hoveringID);
      if (line && mousePosition && this._hoveringID) {
        this._isDragging = true;
        this._draggingID = this._hoveringID;
        this._chart?.applyOptions({
          handleScroll: false,
          handleScale: false,
        });

        this._draggingFromPrice = this.getLinePrice(this._draggingID);

        if (this._hoverTP || this._hoverSL) {
          this._draggingID = null;
          const parentEntry = this.getLine(line.id);
          if (parentEntry) {
            const lineType = this._hoverTP ? 'TP' : 'SL';
            const totalFilled = this.lines().reduce(
              (total, l) => (l.parentId === parentEntry.id && l.type === lineType ? total + l.qty : total),
              0,
            );
            const newQty = Math.round(((line.qty - totalFilled) / parentEntry.qty) * parentEntry.qty * 100) / 100;
            if (newQty > 0) {
              const newMovingLine: TradingLineInfo = {
                ...line,
                id: 'moving-line',
                parentId: line.id,
                qty: newQty,
                type: this._hoverTP ? 'TP' : 'SL',
                side: line.side === 'Buy' ? 'Sell' : 'Buy',
                draggable: true,
                isLive: false,
                isServer: false,
                isPreview: true,
              };
              this.addLine(newMovingLine);
              this._draggingID = newMovingLine.id;
            }
          }
        }

        requestUpdate(); // Trigger an update to reflect the changes
      }
    }, this);

    this._mouseHandlers.dragging().subscribe((mousePosition: MousePosition | null) => {
      if (mousePosition && this._isDragging && this._draggingID) {
        this.updateLinePosition(this._draggingID, mousePosition);
        requestUpdate(); // Trigger an update to reflect the changes
      }
    }, this);

    this._mouseHandlers.dragEnded().subscribe(() => {
      if (this._isDragging) {
        if (this._draggingID) {
          if (this._hoverLabel) {
            this.lineDragEnded(this._draggingID, this._draggingFromPrice as number);
          }

          if (this._hoverTP || this._hoverSL) {
            this._hoverTP && this.addTP(this._draggingID);
            this._hoverSL && this.addSL(this._draggingID);
            this.removeLine(this._draggingID);
          }
        }

        this._isDragging = false;
        this._draggingID = null;
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
    } else if (rendererData?.lines.some((l) => l.hoverLabel && l.line.draggable)) {
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

  private updateLinePosition(lineId: string, newPosition: MousePosition): void {
    if (!this._series) return;

    const line = this.lines().find((l) => l.id === lineId);
    if (!line) return;

    const price = this._series.coordinateToPrice(newPosition.y);
    if (!price || Number(price) < 0) return;

    let validMove = true;
    const oldPrice = line.price;
    const formattedPrice = Number(this._series.priceFormatter().format(price));
    const lines2Update: TradingLineInfo[] = [{ ...line, price: formattedPrice }];

    // Dont allow TP or SL price to move across entry
    if (line.type === 'SL' || line.type === 'TP') {
      const parentEntry = this.lines().find((l) => l.id === line.parentId && l.type === 'ENTRY');
      if (
        parentEntry &&
        (lineId === 'moving-line' || !parentEntry.isLive) &&
        ((parentEntry.side === 'Buy' && line.type === 'TP' && price <= parentEntry.price) ||
          (parentEntry.side === 'Buy' && line.type === 'SL' && price >= parentEntry.price) ||
          (parentEntry.side === 'Sell' && line.type === 'TP' && price >= parentEntry.price) ||
          (parentEntry.side === 'Sell' && line.type === 'SL' && price <= parentEntry.price))
      ) {
        validMove = false;
      }
    }

    // Update related lines
    if (validMove && line.type === 'ENTRY' && line.isLive === false) {
      const priceDiff = formattedPrice - oldPrice;

      this.lines().forEach((l) => {
        if (l.parentId === line.id) {
          const newPrice = l.price + priceDiff;
          if (newPrice < 0) {
            validMove = false;
          } else {
            const newLine = { ...l, price: Number(this._series?.priceFormatter().format(newPrice)) };
            lines2Update.push(newLine);
          }
        }
      });
    }
    if (validMove) {
      lines2Update.forEach((l) => {
        this.updateLine(l.id, l);
      });
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

  _isHoveringBE(mousePosition: MousePosition | null, timescaleWidth: number, y: number, labelWidth: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > buttonHeight / 2) return false;

    const buttonCentreX = timescaleWidth / 2 - labelWidth / 2 - buttonWidth / 2 - iconPadding;
    return Math.abs(mousePosition.x - buttonCentreX) < buttonWidth / 2;
  }

  _isHoveringTP(mousePosition: MousePosition | null, timescaleWidth: number, y: number, labelWidth: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > buttonHeight / 2) return false;

    const buttonCentreX =
      timescaleWidth / 2 - labelWidth / 2 - buttonWidth / 2 - iconPadding - buttonWidth - iconPadding - buttonWidth - iconPadding;

    return Math.abs(mousePosition.x - buttonCentreX) < buttonWidth / 2;
  }

  _isHoveringSL(mousePosition: MousePosition | null, timescaleWidth: number, y: number, labelWidth: number): boolean {
    if (!mousePosition || !timescaleWidth) return false;

    const distanceY = Math.abs(mousePosition.y - y);
    if (distanceY > buttonHeight / 2) return false;
    const buttonCentreX = timescaleWidth / 2 - labelWidth / 2 - buttonWidth / 2 - iconPadding - buttonWidth - iconPadding;

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
    return centreLabelInlinePadding * 2 + 3 * removeButtonWidth + textLength * averageWidthPerCharacter;
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
        if (entry.isLive) pnl = isLongTrade ? entry.qty * (price - entry.price) : entry.qty * (entry.price - price);
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

      const entry = tradingLines.find((tl) => tl.type === 'ENTRY' && (tl.id === l.parentId || tl.id === l.id));
      const text = ` ${l.qty}@${l.price} `;
      const pnl = entry ? calculatePnl(entry, l) : '';
      const movingLine = tradingLines.find((tl) => tl.id === 'moving-line');
      const isDraggedLine = this._draggingID === 'moving-line' && movingLine && l.id === movingLine.parentId ? true : false;

      const isEntry = l.type === 'ENTRY';

      const childrenOrders = isEntry ? tradingLines.filter((t) => t.parentId === l.id) : [];
      const sumTPS = childrenOrders.reduce((total, l) => (l.id !== 'moving-line' && l.type === 'TP' ? total + l.qty : total), 0);
      const sumSLS = childrenOrders.reduce((total, l) => (l.id !== 'moving-line' && l.type === 'SL' ? total + l.qty : total), 0);

      const canTP = sumTPS < l.qty;
      const canSL = sumSLS < l.qty;
      return {
        y,
        text: text,
        hoverRemove: false,
        hoverLabel: false,
        hoverTP: isDraggedLine ? this._hoverTP : false,
        hoverSL: isDraggedLine ? this._hoverSL : false,
        hoverBE: false,
        hoverSend: false,
        hoverSplit: false,
        pnl: pnl,
        line: l,
        showSend: !l.isLive && l.type === 'ENTRY',
        price: price,
        canTP: canTP,
        canSL: canSL,
      };
    });

    if (!this._isDragging) {
      this._hoverLabel = this._hoverRemove = this._hoverSL = this._hoverTP = this._hoverBE = this._hoverSplit = this._hoverSend = false;
      if (closestIndex >= 0 && closestDistance < showCentreLabelDistance) {
        const timescaleWidth = this._chart?.timeScale().width() ?? 0;
        const closestLine = lines[closestIndex];
        const text = closestLine.text;
        const labelWidth = this._calculdateTextWidth(text.length);

        this._hoverRemove = this._isHoveringRemoveButton(mousePosition, timescaleWidth, closestLine.y, labelWidth);

        if (closestLine.line.type === 'ENTRY') {
          this._hoverTP = closestLine.canTP && this._isHoveringTP(mousePosition, timescaleWidth, closestLine.y, labelWidth);
          this._hoverSL = closestLine.canSL && this._isHoveringSL(mousePosition, timescaleWidth, closestLine.y, labelWidth);
          this._hoverBE = this._isHoveringBE(mousePosition, timescaleWidth, closestLine.y, labelWidth);
          this._hoverSend = !closestLine.line.isServer && this._isHoveringSendButton(mousePosition, timescaleWidth, closestLine.y);
        } else {
          this._hoverSplit = this._isHoveringBE(mousePosition, timescaleWidth, closestLine.y, labelWidth);
        }

        if (!this._isHoverButtons()) {
          this._hoverLabel =
            closestLine.line.draggable &&
            (this._isHoveringLine(mousePosition, timescaleWidth, closestLine.y) ||
              this._isHoveringLabel(mousePosition, timescaleWidth, closestLine.y, labelWidth));
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
          this._hoveringID = closestLine.line.id;
        } else {
          this._hoveringID = '';
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
