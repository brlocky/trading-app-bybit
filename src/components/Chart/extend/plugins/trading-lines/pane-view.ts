import { ISeriesPrimitivePaneRenderer, ISeriesPrimitivePaneView, SeriesPrimitivePaneViewZOrder } from 'lightweight-charts';
import { IRendererData } from './irenderer-data';
import { PaneRenderer } from './pane-renderer';

export class TradingPricePaneView implements ISeriesPrimitivePaneView {
  _renderer: PaneRenderer;
  constructor() {
    this._renderer = new PaneRenderer();
  }

  zOrder(): SeriesPrimitivePaneViewZOrder {
    return 'top';
  }

  renderer(): ISeriesPrimitivePaneRenderer {
    return this._renderer;
  }

  update(data: IRendererData | null) {
    this._renderer.update(data);
  }
}
