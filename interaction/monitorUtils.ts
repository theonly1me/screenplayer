import { FrameSignal, PointerSample, clamp01 } from "./metrics";

export type Direction = { dx: number; dy: number } | undefined;

export function normalizePointer(event: PointerEvent): PointerSample {
  const width = typeof window === "undefined" ? 1 : window.innerWidth;
  const height = typeof window === "undefined" ? 1 : window.innerHeight;
  const x = clamp01(event.clientX / width);
  const y = clamp01(event.clientY / height);
  return {
    x,
    y,
    isDown: event.buttons > 0,
  };
}

export function computeHold(holdStart: number | undefined, now: number): number {
  if (holdStart === undefined) {
    return 0;
  }
  const heldMs = now - holdStart;
  return clamp01(heldMs / 1500);
}

export function computeActivityDensity(timestamps: number[], now: number, windowMs: number): { density: number; kept: number[] } {
  const kept = timestamps.filter((t) => now - t <= windowMs);
  const count = kept.length;
  const density = clamp01(count / 10);
  return { density, kept };
}

export function computeKeypressRate(timestamps: number[], now: number, windowMs: number): { rate: number; kept: number[] } {
  const kept = timestamps.filter((t) => now - t <= windowMs);
  const count = kept.length;
  const perSecond = count / (windowMs / 1000);
  const rate = clamp01(perSecond / 6);
  return { rate, kept };
}

export function updateVariance(samples: FrameSignal[], speed: number): number {
  const recentSpeeds = samples.slice(-10).map((s) => s.pointerSpeed);
  const withCurrent = [...recentSpeeds, speed];
  if (withCurrent.length === 0) {
    return 0;
  }
  const mean = withCurrent.reduce((sum, value) => sum + value, 0) / withCurrent.length;
  const variance = withCurrent.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / withCurrent.length;
  return clamp01(variance);
}

export function updateCurvature(previous: Direction, dx: number, dy: number): number {
  if (previous === undefined) {
    return 0;
  }
  const prevMag = Math.sqrt(previous.dx * previous.dx + previous.dy * previous.dy);
  const currentMag = Math.sqrt(dx * dx + dy * dy);
  if (prevMag === 0 || currentMag === 0) {
    return 0;
  }
  const dot = previous.dx * dx + previous.dy * dy;
  const cosTheta = clamp01(dot / (prevMag * currentMag));
  const angle = Math.acos(cosTheta);
  return clamp01(angle / Math.PI);
}

export function clampSpeed(speed: number): number {
  const scaled = speed * 1200;
  if (scaled < 0) {
    return 0;
  }
  if (scaled > 1) {
    return 1;
  }
  return scaled;
}
