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
  positivePnl: boolean;
  hoverRemove: boolean;
  hoverLabel: boolean;
  hoverTP: boolean;
  hoverSL: boolean;
  hoverBE: boolean;
  hoverSend: boolean;
  hoverSplit: boolean;
  showSend: boolean;
  canSplit: boolean;
  canTP: boolean;
  canSL: boolean;
}

export interface IRendererData {
  lines: LineRendererData[];
  color: string;
  crosshair: CrosshairRendererData | null;
}
