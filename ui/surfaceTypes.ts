import type { FrameSignal } from "../interaction/metrics";

export type VisualInput = {
  energy: number;
  chaos: number;
  hold: number;
  density: number;
  focusX: number;
  focusY: number;
  colorHue: number;
  keypressRate: number;
};

export function signalToVisualInput(signal: FrameSignal): VisualInput {
  const horizontalHue = signal.focusX * 220;
  const verticalShift = (0.5 - signal.focusY) * 120;
  const chaosShift = signal.variance * 80;
  const hue = clampHue(80 + horizontalHue + verticalShift + chaosShift);
  return {
    energy: signal.pointerSpeed,
    chaos: signal.variance,
    hold: signal.holdTime,
    density: signal.activityDensity,
    focusX: signal.focusX,
    focusY: signal.focusY,
    colorHue: hue,
    keypressRate: signal.keypressRate,
  };
}

function clampHue(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 360) {
    return 360;
  }
  return value;
}
