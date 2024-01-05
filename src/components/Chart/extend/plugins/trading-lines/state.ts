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
  private _lineChanged: Delegate<TradingLineInfo> = new Delegate();
  private _linesChanged: Delegate = new Delegate();
  private _lineDragged: Delegate<TradingLinedDragInfo> = new Delegate();
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

  lineChanged(): Delegate<TradingLineInfo> {
    return this._lineChanged;
  }

  linesChanged(): Delegate {
    return this._linesChanged;
  }

  lineDragged(): Delegate<TradingLinedDragInfo> {
    return this._lineDragged;
  }

  addLine(price: number, qty: number, type: TradingLineType, side: TradingLineSide, draggable: boolean, isLive: boolean): string {
    const id = this._getNewId();
    const line: TradingLineInfo = {
      id,
      price,
      qty,
      type: type,
      side: side,
      draggable: draggable,
      isLive: isLive,
    };
    this._lines.set(id, line);
    this._lineAdded.fire(line);
    this._linesChanged.fire();
    return id;
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
      console.log('Line dragged => ', fromPrice, ' to ', existingLine?.price);
      const fromLine = { ...existingLine, price: fromPrice };
      this._lineDragged.fire({ from: fromLine, to: existingLine });

      if (existingLine.type === 'ENTRY' && existingLine.isLive === false) {
        const priceDiff = existingLine.price - fromPrice;
        this.lines().forEach((l) => {
          if (l.type !== 'ENTRY') {
            this.lineDragEnded(l.id, l.price - priceDiff);
          }
        });
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

  private _getNewId(): string {
    let id = Math.round(Math.random() * 1000000).toString(16);
    while (this._lines.has(id)) {
      id = Math.round(Math.random() * 1000000).toString(16);
    }
    return id;
  }
}
