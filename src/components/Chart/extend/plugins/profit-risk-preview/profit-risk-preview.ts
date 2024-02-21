import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
  BarData,
  ISeriesApi,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  SeriesAttachedParameter,
  SeriesPrimitivePaneViewZOrder,
  SeriesType,
  Time,
} from 'lightweight-charts';
import { positionsBox, positionsLine } from '../../helpers/dimensions/positions';
import { PluginBase } from '../plugin-base';

const LABEL_HEIGHT = 20;
const LABEL_WIDTH = 40;
const LABEL_GAP_X = 5;
const LABEL_GAP_Y = 5;

interface IPnl {
  y: number;
  price: number;
  pnl: string;
}

interface IData {
  price: number;
  qty: number;
  visible: boolean;
  rightX: number;
  labels?: IPnl[];
}

class ProfitRiskCalculator {
  _data: IData | null = null;

  _calculatePnl(initialPrice: number, currentPrice: number, qty: number): string {
    return (Math.abs(currentPrice - initialPrice) * qty).toFixed(2);
  }

  update(data: IData, series: ISeriesApi<SeriesType>): void {
    this._data = data;
    this._data.labels = [];

    if (!this._data) return;

    const initialPrice = data.price;
    const initialY = series.priceToCoordinate(initialPrice);
    if (!initialY) return;

    for (let i = -20; i < 20; i++) {
      const currentY = initialY + (LABEL_GAP_X + LABEL_HEIGHT) * i;
      const currentPrice = series.coordinateToPrice(currentY);
      if (currentPrice) {
        const pnl = this._calculatePnl(data.price, currentPrice, this._data.qty);
        this._data.labels.push({
          y: currentY,
          price: currentPrice,
          pnl,
        });
      }
    }
  }
}

class PaneView extends ProfitRiskCalculator implements ISeriesPrimitivePaneView {
  renderer(): ISeriesPrimitivePaneRenderer | null {
    if (!this._data || !this._data.visible) return null;
    return new PaneRenderer(this._data);
  }

  zOrder(): SeriesPrimitivePaneViewZOrder {
    return 'top';
  }
}

class PaneRenderer implements ISeriesPrimitivePaneRenderer {
  _data: IData;

  constructor(data: IData) {
    this._data = data;
  }

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      if (!this._data.labels) return;
      const ctx = scope.context;

      const height = LABEL_HEIGHT;
      const width = LABEL_WIDTH;

      const xPos = positionsBox(this._data.rightX - width, this._data.rightX - 1, scope.horizontalPixelRatio);
      this._data.labels.forEach((label) => {
        const yPos = positionsLine(label.y, scope.verticalPixelRatio, height);

        ctx.fillStyle = 'lightblue';
        const roundedArray = [5, 0, 0, 5].map((i) => i * scope.horizontalPixelRatio);
        ctx.beginPath();
        ctx.roundRect(xPos.position, yPos.position, xPos.length, yPos.length, roundedArray);
        ctx.fill();

        // Draw text
        ctx.fillStyle = 'black'; // Set text color
        ctx.font = '12px Arial'; // Set font size and family
        ctx.fillText(
          '$' + label.pnl,
          xPos.position + LABEL_GAP_X * scope.horizontalPixelRatio,
          yPos.position + (LABEL_GAP_Y / 2 + height / 2) * scope.verticalPixelRatio,
        ); // Draw the text at a specific position
      });
    });
  }
}

const defaultOptions: IOptions = {
  color: '#000000',
  hoverColor: '#777777',
  limitToOne: true,
};

export interface IOptions {
  color: string;
  hoverColor: string;
  limitToOne: boolean;
}

export class ProfitRiskPreview extends PluginBase {
  private _options: IOptions;
  private _paneView: PaneView;
  private _visible: boolean;
  private _price: number;
  private _qty: number;

  constructor(options: Partial<IOptions>) {
    super();
    this._options = {
      ...defaultOptions,
      ...options,
    };

    this._paneView = new PaneView();
    this._price = 0;
    this._qty = 0;
    this._visible = false;
  }

  public attached(data: SeriesAttachedParameter<Time>) {
    super.attached(data);

    this.requestUpdate();
  }

  public dataUpdated(): void {
    if (!this.series) return;
    const data = this.series.data();
    if (data.length < 1) return;
    const currentCandle = data[data.length - 1] as BarData;
    this._price = currentCandle.close;
    this.updateAllViews();
    this.requestUpdate();
  }

  updateAllViews() {
    const data = {
      price: this._price,
      qty: this._qty,
      rightX: this.chart.timeScale().width(),
      visible: this._visible,
    };
    this._paneView.update(data, this.series);
  }

  priceAxisViews() {
    return [];
  }

  paneViews() {
    return [this._paneView];
  }

  currentLineColor() {
    return this._options.color;
  }

  currentHoverColor() {
    return this._options.hoverColor;
  }

  public updateVisibility(show: boolean) {
    this._visible = show;
    this.updateAllViews();
    this.requestUpdate();
  }

  public updateQty(qty: number) {
    this._qty = qty;
    this.updateAllViews();
    this.requestUpdate();
  }
}
