import { Delegate } from '../../helpers/delegate';

export type TradingLineType = 'ENTRY' | 'SL' | 'TP';
export type TradingLineSide = 'Buy' | 'Sell';

export interface TradingLineInfo {
  id: string;
  parentId: string;
  price: number;
  qty: number;
  type: TradingLineType;
  side: TradingLineSide;
  draggable: boolean;
  isLive: boolean;
  isServer: boolean;
  isPreview?: boolean;
}

export interface TradingLinedDragInfo {
  from: TradingLineInfo;
  to: TradingLineInfo;
}

export class TradingLinesState {
  private _lineAdded: Delegate<TradingLineInfo> = new Delegate();
  private _lineRemoved: Delegate<TradingLineInfo> = new Delegate();
  private _addTP: Delegate<TradingLineInfo> = new Delegate();
  private _addSL: Delegate<TradingLineInfo> = new Delegate();
  private _addBE: Delegate<void> = new Delegate();
  private _addSplit: Delegate<TradingLineInfo> = new Delegate();
  private _addSend: Delegate<TradingLineInfo> = new Delegate();
  private _lineChanged: Delegate<TradingLineInfo> = new Delegate();
  private _linesChanged: Delegate = new Delegate();
  private _lineDragged: Delegate<TradingLinedDragInfo> = new Delegate();
  private _linesDragged: Delegate<TradingLinedDragInfo[]> = new Delegate();
  private _lines: Map<string, TradingLineInfo>;
  private _marketPrice = 0;

  constructor() {
    this._lines = new Map();
    this._linesChanged.subscribe(() => {
      this._updateLinesArray();
    }, this);
  }

  addLine(line: TradingLineInfo): void {
    this._lines.set(line.id, line);
    this._lineAdded.fire(line);
    this._linesChanged.fire();
  }

  setLines(lines: TradingLineInfo[]): void {
    lines.forEach((l) => {
      this._lines.set(l.id, l);
      this._lineAdded.fire(l);
    });
    this._linesChanged.fire();
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

  setMarketPrice(price: number): void {
    this._marketPrice = price;
  }

  addTP(id: string): void {
    const line = this._lines.get(id);
    if (line) {
      this._addTP.fire(line);
    }
  }

  addSL(id: string): void {
    const line = this._lines.get(id);
    if (line) {
      this._addSL.fire(line);
    }
  }

  addBE(): void {
    this._addBE.fire();
  }

  addSplit(id: string): void {
    if (!this._lines.has(id)) return;
    const line = this._lines.get(id);
    if (line) {
      this._addSplit.fire(line);
    }
  }

  addSend(id: string): void {
    if (!this._lines.has(id)) return;
    const line = this._lines.get(id);
    if (line) {
      this._addSend.fire(line);
    }
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

  tpAdded(): Delegate<TradingLineInfo> {
    return this._addTP;
  }

  slAdded(): Delegate<TradingLineInfo> {
    return this._addSL;
  }

  beAdded(): Delegate<void> {
    return this._addBE;
  }

  splitAdded(): Delegate<TradingLineInfo> {
    return this._addSplit;
  }

  sendAdded(): Delegate<TradingLineInfo> {
    return this._addSend;
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

  getLine(id: string): TradingLineInfo | null {
    return this._lines.get(id) || null;
  }

  getLinePrice(id: string): number {
    const existingLine = this._lines.get(id);

    if (existingLine) {
      return existingLine.price;
    }

    return 0;
  }

  getMarketPrice(): number {
    return this._marketPrice;
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
        this._lineDragged.fire({ from: fromLine, to: existingLine })
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
