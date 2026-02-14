export type PointerSample = {
  x: number;
  y: number;
  isDown: boolean;
};

export type FrameSignal = {
  timestamp: number;
  pointerSpeed: number;
  curvature: number;
  activityDensity: number;
  focusX: number;
  focusY: number;
  holdTime: number;
  keypressRate: number;
  variance: number;
};

export type InteractionInput = {
  timestamp: number;
  pointer: PointerSample;
  keypressCount: number;
};

export type MetricsWindow = {
  windowMs: number;
  samples: FrameSignal[];
};

export const zeroSignal: FrameSignal = {
  timestamp: 0,
  pointerSpeed: 0,
  curvature: 0,
  activityDensity: 0,
  focusX: 0,
  focusY: 0,
  holdTime: 0,
  keypressRate: 0,
  variance: 0,
};

export const defaultWindow: MetricsWindow = {
  windowMs: 5000,
  samples: [],
};

export function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}
