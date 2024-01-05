interface CrosshairRendererData {
  y: number;
  text: string;
}

export interface LineRendererData {
  y: number;
  text: string;
  hoverRemove: boolean;
  hoverLabel: boolean;
  isLive: boolean;
  draggable: boolean;
}

export interface IRendererData {
  lines: LineRendererData[];
  color: string;
  crosshair: CrosshairRendererData | null;
}
