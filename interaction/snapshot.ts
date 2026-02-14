import { clamp01, FrameSignal } from "./metrics";

export type InteractionSnapshot = {
  energy: number;
  chaos: number;
  density: number;
  focusX: number;
  focusY: number;
  rhythmIntent: number;
};

const zeroSnapshot: InteractionSnapshot = {
  energy: 0,
  chaos: 0,
  density: 0,
  focusX: 0.5,
  focusY: 0.5,
  rhythmIntent: 0,
};

function averagedSnapshot(accumulated: InteractionSnapshot, count: number): InteractionSnapshot {
  if (count === 0) {
    return zeroSnapshot;
  }
  return {
    energy: clamp01(accumulated.energy / count),
    chaos: clamp01(accumulated.chaos / count),
    density: clamp01(accumulated.density / count),
    focusX: clamp01(accumulated.focusX / count),
    focusY: clamp01(accumulated.focusY / count),
    rhythmIntent: clamp01(accumulated.rhythmIntent / count),
  };
}

export function snapshotFromSignals(signals: ReadonlyArray<FrameSignal>): InteractionSnapshot {
  if (signals.length === 0) {
    return zeroSnapshot;
  }

  const sums: InteractionSnapshot = {
    energy: 0,
    chaos: 0,
    density: 0,
    focusX: 0,
    focusY: 0,
    rhythmIntent: 0,
  };

  for (const signal of signals) {
    sums.energy += signal.pointerSpeed;
    sums.chaos += signal.variance;
    sums.density += signal.activityDensity;
    sums.focusX += signal.focusX;
    sums.focusY += signal.focusY;
    sums.rhythmIntent += signal.keypressRate;
  }

  return averagedSnapshot(sums, signals.length);
}
