export interface FillObj {
  isEnabled?: boolean;
  fillType?: number;
  color?: { value?: string; alpha?: number; a?: number };
  gradient?: {
    colorStops?: Array<{ color?: { value?: string }; position?: number }>;
    from?: { x?: number; y?: number };
    to?: { x?: number; y?: number };
  };
}

export interface BorderObj {
  isEnabled?: boolean;
  color?: { value?: string };
  thickness?: number;
  position?: string;
}

export interface ShadowObj {
  isEnabled?: boolean;
  color?: { value?: string };
  offsetX?: number;
  offsetY?: number;
  blurRadius?: number;
  spread?: number;
}
