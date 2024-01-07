import { Delegate } from '../../helpers/delegate';

type TradingLineType = 'ENTRY' | 'SL' | 'TP';
type TradingLineSide = 'Buy' | 'Sell' | 'None';

export interface TradingLineInfo {
  id: string;
  price: number;
  qty: number;
  type: TradingLineType;
  side: TradingLineSide;
  draggable: boolean;
  isLive: boolean;
}

export interface TradingLinedDragInfo {
  from: TradingLineInfo;
  to: TradingLineInfo;
}

export class TradingLinesState {
  private _lineAdded: Delegate<TradingLineInfo> = new Delegate();
  private _lineRemoved: Delegate<TradingLineInfo> = new Delegate();
  private _orderSent: Delegate<void> = new Delegate();
  private _lineChanged: Delegate<TradingLineInfo> = new Delegate();
  private _linesChanged: Delegate = new Delegate();
  private _lineDragged: Delegate<TradingLinedDragInfo> = new Delegate();
  private _linesDragged: Delegate<TradingLinedDragInfo[]> = new Delegate();
  private _lines: Map<string, TradingLineInfo>;

  constructor() {
    this._lines = new Map();
    this._linesChanged.subscribe(() => {
      this._updateLinesArray();
    }, this);
  }

  destroy() {
    // TODO: add more destroying 💥
    this._linesChanged.unsubscribeAll(this);
  }

  lineAdded(): Delegate<TradingLineInfo> {
    return this._lineAdded;
  }

  lineRemoved(): Delegate<TradingLineInfo> {
    return this._lineRemoved;
  }

  orderSent(): Delegate<void> {
    return this._orderSent;
  }

  lineChanged(): Delegate<TradingLineInfo> {
    return this._lineChanged;
  }

  linesChanged(): Delegate {
    return this._linesChanged;
  }

  linesDragged(): Delegate<TradingLinedDragInfo[]> {
    return this._linesDragged;
  }

  lineDragged(): Delegate<TradingLinedDragInfo> {
    return this._lineDragged;
  }

  addLine(line: TradingLineInfo): void {
    this._lines.set(line.id, line);
    this._lineAdded.fire(line);
    this._linesChanged.fire();
  }

  sendOrder(): void {
    this._orderSent.fire();
  }

  updateLine(id: string, line: TradingLineInfo): void {
    const existingLine = this._lines.get(id);

    if (existingLine) {
      const newLine = { ...existingLine, ...line };
      this._lines.set(id, newLine);
      this._lineChanged.fire(existingLine);
      this._linesChanged.fire();
    }
  }

  truncate() {
    const isLength = !!this._lines.size;
    this._lines = new Map();

    if (isLength) {
      this._linesChanged.fire();
    }
  }

  updateLinePrice(id: string, newPrice: number): void {
    const existingLine = this._lines.get(id);

    if (existingLine && existingLine.price !== newPrice) {
      existingLine.price = newPrice;
      this._lineChanged.fire(existingLine);
      this._linesChanged.fire();
    }
  }

  updateLines(lines: TradingLineInfo[]): void {
    this._lines = new Map();
    lines.map((l) => {
      this._lines.set(l.id, l);
    });

    this._linesChanged.fire();
  }

  getLinePrice(id: string): number {
    const existingLine = this._lines.get(id);

    if (existingLine) {
      return existingLine.price;
    }

    return 0;
  }

  lineDragEnded(id: string, fromPrice: number): void {
    const existingLine = this._lines.get(id);
    if (existingLine) {
      const fromLine = { ...existingLine, price: fromPrice };
      const dragsInfo = [{ from: fromLine, to: existingLine }];
      const priceDiff = existingLine.price - fromPrice;

      const formatPrice = (price: number, formatNumber: number) => {
        return Number(price.toFixed(formatNumber.toString().split('.')[1]?.length || 0));
      };
      if (existingLine.type === 'ENTRY' && existingLine.isLive === false) {
        this.lines().forEach((l) => {
          if (l.type !== 'ENTRY') {
            const f = { ...l, price: formatPrice(l.price - priceDiff, l.price) };
            dragsInfo.push({ from: f, to: l });
          }
        });
        this._linesDragged.fire(dragsInfo);
      } else {
        this._lineDragged.fire({ from: fromLine, to: existingLine });
      }
    }
  }

  removeLine(id: string) {
    if (!this._lines.has(id)) return;
    const line = this._lines.get(id);
    this._lines.delete(id);
    if (line) {
      this._lineRemoved.fire(line);
      this._linesChanged.fire();
    }
  }

  lines() {
    return this._linessArray;
  }

  _linessArray: TradingLineInfo[] = [];
  _updateLinesArray() {
    this._linessArray = Array.from(this._lines.values()).sort((a, b) => {
      return b.price - a.price;
    });
  }
}
