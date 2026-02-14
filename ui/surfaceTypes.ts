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
  const hue = Math.max(
    0,
    Math.min(360, 200 + signal.focusX * 140 - signal.focusY * 80),
  );
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
