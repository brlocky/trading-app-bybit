interface CrosshairRendererData {
  y: number;
  text: string;
}

export interface LineRendererData {
  y: number;
  text: string;
  hoverRemove: boolean;
  hoverLabel: boolean;
}

interface CrosshairButtonData {
  hoverColor: string;
  crosshairLabelIcon: Path2D[];
  hovering: boolean;
}

export interface IRendererData {
  alertIcon: Path2D[];
  dragIcon: Path2D[];
  lines: LineRendererData[];
  button: CrosshairButtonData | null;
  color: string;
  crosshair: CrosshairRendererData | null;
}
