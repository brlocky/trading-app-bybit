import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  MouseEventParams,
  SeriesType,
  SeriesPrimitivePaneViewZOrder,
  LineStyle,
  CandlestickData,
} from 'lightweight-charts';
import { PluginBase } from '../plugin-base';
import { positionsBox, positionsLine } from '../../helpers/dimensions/positions';

const LABEL_HEIGHT = 21;
const dragDropIcon = 'M2 12H14M2 6H14M2 18H14M16 4H22V20H16';
const dragDropIconPath = new Path2D(dragDropIcon);
const dragDropIconSize = 24; // Icon is 16x16

class TradingLineDataBase {
  _y = 0;
  _data: TradingLinesData;
  constructor(data: TradingLinesData) {
    this._data = data;
  }

  update(data: TradingLinesData, series: ISeriesApi<SeriesType>): void {
    this._data = data;
    if (!this._data.price) {
      this._y = -10000;
      return;
    }
    this._y = series.priceToCoordinate(this._data.price) ?? -10000;
  }
}

interface TradingLinesRendererData {
  visible: boolean;
  textColor: string;
  color: string;
  y: number;
  rightX: number;
  hoverColor: string;
  hovered: boolean;
}

interface TradingLinesData {
  visible: boolean;
  hovered?: boolean;
  price?: number;
  timeScaleWidth: number;
  crosshairLabelColor: string;
  crosshairColor: string;
  lineColor: string;
  hoverColor: string;
}

class TradingLinesLabelButton extends PluginBase {
  _paneViews: TradingLinesPaneView[];
  _data: TradingLinesData = {
    visible: false,
    hovered: false,
    timeScaleWidth: 0,
    crosshairLabelColor: '#000000',
    crosshairColor: '#ffffff',
    lineColor: '#000000',
    hoverColor: '#777777',
  };
  _source: TradingLines2;

  constructor(source: TradingLines2) {
    super();
    this._paneViews = [new TradingLinesPaneView(this._data)];
    this._source = source;
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
      lineColor: this._source.currentLineColor(),
      hoverColor: this._source.currentHoverColor(),
    };
    this.updateAllViews();
    this.requestUpdate();
  }

  hideAddLabel() {
    this._data.visible = false;
    this.updateAllViews();
    this.requestUpdate();
  }
}

class DragDropHandler extends PluginBase {
  _paneViews: TradingLinesPaneView[];
  _data: TradingLinesData = {
    visible: false,
    hovered: false,
    timeScaleWidth: 0,
    crosshairLabelColor: '#000000',
    crosshairColor: '#ffffff',
    lineColor: '#000000',
    hoverColor: '#777777',
  };
  _source: TradingLines2;

  // Store the initial position of the mouse when a drag starts
  private dragStartX = 0;

  // Flag to indicate if a drag is currently in progress
  private isDragging = false;
  private isHover = false;

  constructor(source: TradingLines2, chart: IChartApi) {
    super();
    this._paneViews = [
      new TradingLinesPaneView(this._data, (price) => {
        // Handle the click event here, using the calculated price
        console.log('xxx Clicked on price:', price);
      }),
    ];
    this._source = source;
    chart.subscribeCrosshairMove(this.handleCrosshairMove.bind(this));
    // chart.subscribeClick(this.handleChartClick.bind(this));
    // document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    // document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    // document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    // document.addEventListener('mouseover', this.handleMouseHover.bind(this));
    // document.addEventListener('mouseout', this.handleMouseOut.bind(this));
  }

  // Event handler for crosshair move
  private handleCrosshairMove(param: any) {
    // Handle crosshair movement, update UI as needed
    // console.log('handleCrosshairMove', param);
  }

  // Event handler for crosshair move
  private handleMouseHover(param: any) {
    this.isHover = true;
    console.log('handleMouseHover', param);
  }
  // Event handler for crosshair move
  private handleMouseOut(param: any) {
    this.isHover = false;
    console.log('handleMouseOut', param);
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
      lineColor: this._source.currentLineColor(),
      hoverColor: this._source.currentHoverColor(),
    };
    this.updateAllViews();
    this.requestUpdate();
  }

  hideAddLabel() {
    this._data.visible = false;
    this.updateAllViews();
    this.requestUpdate();
  }
}

class TradingLinesPaneView extends TradingLineDataBase implements ISeriesPrimitivePaneView {
  private _clickHandler;
  constructor(data: TradingLinesData, clickHandler?: (price: number) => void) {
    super(data);
    this._clickHandler = clickHandler;
  }

  onclick(x: number, y: number): void {
    // Your click handling logic here
    console.log('xxx button clicked xxxx', x, y);
    /* const price = this.priceFromCoordinate(y); */
    if (this._clickHandler) {
      this._clickHandler(69.69);
    }
  }

  renderer(): ISeriesPrimitivePaneRenderer | null {
    const color = this._data.crosshairColor;
    return new TradingLingesPaneRenderer({
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

class TradingLingesPaneRenderer implements ISeriesPrimitivePaneRenderer {
  _data: TradingLinesRendererData;

  constructor(data: TradingLinesRendererData) {
    this._data = data;
  }

  onclick(x: number, y: number): void {
    console.log('Clicked on the rendered area');
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

const defaultOptions: TradingLinesOptions = {
  color: '#000000',
  hoverColor: '#777777',
  limitToOne: true,
};

export interface TradingLinesOptions {
  color: string;
  hoverColor: string;
  limitToOne: boolean;
}

export class TradingLines2 {
  private _chart: IChartApi | undefined;
  private _series: ISeriesApi<SeriesType> | undefined;
  private _options: TradingLinesOptions;
  private _labelButtonPrimitive: TradingLinesLabelButton;
  private _isDragging: boolean;

  constructor(chart: IChartApi, series: ISeriesApi<SeriesType>, options: Partial<TradingLinesOptions>) {
    this._chart = chart;
    this._series = series;
    this._options = {
      ...defaultOptions,
      ...options,
    };

    this._labelButtonPrimitive = new DragDropHandler(this, this._chart);
    this._series.attachPrimitive(this._labelButtonPrimitive);

    // document.addEventListener('mouseover', this.handleMouseHover.bind(this._labelButtonPrimitive));
    // document.addEventListener('mouseout', this.handleMouseOut.bind(this._labelButtonPrimitive));

    const data = this._series.data() as CandlestickData[];
    const len = data.length;
    const price = data[len - 1].close;
    this._labelButtonPrimitive.showAddLabel(price, true);
    this._series.createPriceLine({
      price,
      color: this._options.color,
      lineStyle: LineStyle.Dashed,
    });

    // this._chart.subscribeClick(this._clickHandler);
    // this._chart.subscribeCrosshairMove(this._moveHandler);

    this._isDragging = false;

    // this._labelButtonPrimitive = new UserPriceLinesLabelButton(this);
    // series.attachPrimitive(this._labelButtonPrimitive);
    this._setCrosshairMode();
  }

  // Event handler for crosshair move
  private handleMouseHover(param: any) {
    console.log('handleMouseHover', param);
  }
  // Event handler for crosshair move
  private handleMouseOut(param: any) {
    console.log('handleMouseOut', param);
  }

  currentLineColor() {
    return this._options.color;
  }

  currentHoverColor() {
    return this._options.hoverColor;
  }

  // We need to disable magnet mode for this to work nicely
  _setCrosshairMode() {
    if (!this._chart) {
      throw new Error('Unable to change crosshair mode because the chart instance is undefined');
    }
    this._chart.applyOptions({
      crosshair: {
        mode: CrosshairMode.Normal,
      },
    });
  }

  private _clickHandler = (param: MouseEventParams) => this._onClick(param);
  private _moveHandler = (param: MouseEventParams) => this._onMouseMove(param);

  remove() {
    if (this._chart) {
      this._chart.unsubscribeClick(this._clickHandler);
      this._chart.unsubscribeCrosshairMove(this._moveHandler);
    }
    if (this._series && this._labelButtonPrimitive) {
      this._series.detachPrimitive(this._labelButtonPrimitive);
    }
    this._chart = undefined;
    this._series = undefined;
  }

  private _onClick(param: MouseEventParams) {
    const price = this._getMousePrice(param);
    const xDistance = this._distanceFromRightScale(param);
    if (price === null || xDistance === null || xDistance > LABEL_HEIGHT || !this._series) return;

    console.log('click', price);
    this._isDragging = !this._isDragging;

    if (!this._chart) return;
    /* const someLabel = new DragDropHandler(this, this._chart);
    this._series.attachPrimitive(someLabel);
    someLabel.showAddLabel(price, true);
    this._series.createPriceLine({
      price,
      color: this._options.color,
      lineStyle: LineStyle.Dashed,
    }); */
  }

  private _onMouseMove(param: MouseEventParams) {
    const price = this._getMousePrice(param);
    const xDistance = this._distanceFromRightScale(param);
    if (price === null || xDistance === null || xDistance > LABEL_HEIGHT * 2) {
      // this._labelButtonPrimitive.hideAddLabel();
      return;
    }
    if (this._isDragging) this._labelButtonPrimitive.showAddLabel(price, xDistance < LABEL_HEIGHT);
  }

  private _getMousePrice(param: MouseEventParams) {
    if (!param.point || !this._series) return null;
    const price = this._series.coordinateToPrice(param.point.y);
    return price;
  }

  private _distanceFromRightScale(param: MouseEventParams) {
    if (!param.point || !this._chart) return null;
    const timeScaleWidth = this._chart.timeScale().width();
    return Math.abs(timeScaleWidth - param.point.x);
  }
}
