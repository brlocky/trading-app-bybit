import { TradingLineInfo } from './state';

interface CrosshairRendererData {
  y: number;
  text: string;
}

export interface LineRendererData {
  y: number;
  text: string;
  line: TradingLineInfo;
  pnl: string;
  hoverRemove: boolean;
  hoverLabel: boolean;
  hoverTP: boolean;
  hoverSL: boolean;
  hoverBE: boolean;
  hoverSplit: boolean;
  showSend: boolean;
}

export interface IRendererData {
  lines: LineRendererData[];
  color: string;
  crosshair: CrosshairRendererData | null;
}
