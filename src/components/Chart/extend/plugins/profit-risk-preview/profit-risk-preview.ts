import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
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

const LABEL_HEIGHT = 21;
const dragDropIcon = 'M2 12H14M2 6H14M2 18H14M16 4H22V20H16';
const dragDropIconPath = new Path2D(dragDropIcon);
const dragDropIconSize = 24; // Icon is 16x16

class DataBase {
  _y = 0;
  _data: IData;
  constructor(data: IData) {
    this._data = data;
  }

  update(data: IData, series: ISeriesApi<SeriesType>): void {
    this._data = data;

    if (!this._data.price) {
      this._y = -10000;
      return;
    }
    this._y = series.priceToCoordinate(this._data.price) ?? -10000;
    console.log(this._y);
  }
}

interface IRendererData {
  visible: boolean;
  textColor: string;
  color: string;
  y: number;
  rightX: number;
  hoverColor: string;
  hovered: boolean;
}

interface IData {
  visible: boolean;
  hovered?: boolean;
  price?: number;
  timeScaleWidth: number;
  crosshairLabelColor: string;
  crosshairColor: string;
  lineColor: string;
  hoverColor: string;
}

class PaneView extends DataBase implements ISeriesPrimitivePaneView {
  constructor(data: IData) {
    super(data);
  }

  renderer(): ISeriesPrimitivePaneRenderer | null {
    const color = this._data.crosshairColor;
    return new PaneRenderer({
      visible: this._data.visible,
      y: this._y,
      color,
      textColor: this._data.crosshairLabelColor,
      rightX: this._data.timeScaleWidth,
      hoverColor: this._data.hoverColor,
      hovered: this._data.hovered ?? false,
    });
  }

  zOrder(): SeriesPrimitivePaneViewZOrder {
    return 'top';
  }
}

class PaneRenderer implements ISeriesPrimitivePaneRenderer {
  _data: IRendererData;

  constructor(data: IRendererData) {
    this._data = data;
  }

  draw(target: CanvasRenderingTarget2D) {
    if (!this._data.visible) return;
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;

      const height = LABEL_HEIGHT;
      const width = height + 1;

      const xPos = positionsBox(this._data.rightX - width, this._data.rightX - 1, scope.horizontalPixelRatio);
      const yPos = positionsLine(this._data.y, scope.verticalPixelRatio, height);

      ctx.fillStyle = this._data.color;
      const roundedArray = [5, 0, 0, 5].map((i) => i * scope.horizontalPixelRatio);
      ctx.beginPath();
      ctx.roundRect(xPos.position, yPos.position, xPos.length, yPos.length, roundedArray);
      ctx.fill();

      if (this._data.hovered) {
        ctx.fillStyle = this._data.hoverColor;
        ctx.beginPath();
        ctx.roundRect(xPos.position, yPos.position, xPos.length, yPos.length, roundedArray);
        ctx.fill();
      }

      ctx.translate(xPos.position + 3 * scope.horizontalPixelRatio, yPos.position + 3 * scope.verticalPixelRatio);
      ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);
      const iconScaling = 15 / dragDropIconSize;
      ctx.scale(iconScaling, iconScaling);
      ctx.strokeStyle = this._data.textColor;
      ctx.lineWidth = 1;
      ctx.stroke(dragDropIconPath);
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
  private _paneViews: PaneView[];
  private _data: IData = {
    visible: false,
    hovered: false,
    timeScaleWidth: 0,
    crosshairLabelColor: '#000000',
    crosshairColor: '#ffffff',
    lineColor: '#000000',
    hoverColor: '#777777',
  };

  constructor(options: Partial<IOptions>) {
    super();
    this._options = {
      ...defaultOptions,
      ...options,
    };

    this._paneViews = [new PaneView(this._data)];
  }

  updateAllViews() {
    this._paneViews.forEach((pw) => pw.update(this._data, this.series));
  }

  priceAxisViews() {
    return [];
  }

  paneViews() {
    return this._paneViews;
  }

  showAddLabel(price: number, hovered: boolean) {
    const crosshairColor = this.chart.options().crosshair.horzLine.labelBackgroundColor;
    this._data = {
      visible: true,
      price,
      hovered,
      timeScaleWidth: this.chart.timeScale().width(),
      crosshairColor,
      crosshairLabelColor: '#FFFFFF',
      lineColor: this.currentLineColor(),
      hoverColor: this.currentHoverColor(),
    };
    this.updateAllViews();
    this.requestUpdate();
  }

  hideAddLabel() {
    this._data.visible = false;
    this.updateAllViews();
    this.requestUpdate();
  }

  public attached(data: SeriesAttachedParameter<Time>) {
    super.attached(data);

    this.requestUpdate();
  }

  currentLineColor() {
    return this._options.color;
  }

  currentHoverColor() {
    return this._options.hoverColor;
  }
}
