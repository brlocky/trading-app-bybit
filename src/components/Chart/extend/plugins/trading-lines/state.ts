import { Delegate } from '../../helpers/delegate';

export interface TradingLineInfo {
  id: string;
  price: number;
}

export class TradingLinesState {
  private _lineAdded: Delegate<TradingLineInfo> = new Delegate();
  private _lineRemoved: Delegate<string> = new Delegate();
  private _lineChanged: Delegate<TradingLineInfo> = new Delegate();
  private _linesChanged: Delegate = new Delegate();
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

  lineRemoved(): Delegate<string> {
    return this._lineRemoved;
  }

  lineChanged(): Delegate<TradingLineInfo> {
    return this._lineChanged;
  }

  linesChanged(): Delegate {
    return this._linesChanged;
  }

  addLine(price: number): string {
    const id = this._getNewId();
    const line: TradingLineInfo = {
      price,
      id,
    };
    this._lines.set(id, line);
    this._lineAdded.fire(line);
    this._linesChanged.fire();
    return id;
  }

  updateLinePrice(id: string, newPrice: number): void {
    const existingLine = this._lines.get(id);

    if (existingLine) {
      existingLine.price = newPrice;
      this._lineChanged.fire(existingLine);
      this._linesChanged.fire();
    }
  }

  removeLine(id: string) {
    if (!this._lines.has(id)) return;
    this._lines.delete(id);
    this._lineRemoved.fire(id);
    this._linesChanged.fire();
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
