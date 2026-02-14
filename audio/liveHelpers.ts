import { InteractionSnapshot } from "../interaction/snapshot";

export const emptySnapshot: InteractionSnapshot = {
  energy: 0,
  chaos: 0,
  density: 0,
  focusX: 0.5,
  focusY: 0.5,
  rhythmIntent: 0,
};

export function keyToDegree(key: string | undefined): number {
  const row = "awsedftgyhujkolp";
  const index = key === undefined ? -1 : row.indexOf(key.toLowerCase());
  if (index === -1) {
    return Math.floor(Math.random() * 5);
  }
  return index % 7;
}

export function mix(current: number, target: number, weight: number): number {
  const clamped = weight < 0 ? 0 : weight > 1 ? 1 : weight;
  return current * (1 - clamped) + target * clamped;
}

export function clamp(min: number, max: number, value: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}
