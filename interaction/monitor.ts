import { defaultWindow, FrameSignal, MetricsWindow } from "./metrics";
import { snapshotFromSignals, InteractionSnapshot } from "./snapshot";
import { computeActivityDensity, computeHold, computeKeypressRate } from "./monitorUtils";
import { createMonitorHandlers } from "./monitorHandlers";
import { createMonitorState } from "./monitorState";

type Listener = (signal: FrameSignal) => void;

type MonitorOptions = {
  windowMs?: number;
};

export type InteractionMonitor = {
  start: () => void;
  stop: () => void;
  subscribe: (listener: Listener) => () => void;
  latestSnapshot: () => InteractionSnapshot;
  latestSignal: () => FrameSignal | undefined;
};

export function createInteractionMonitor(options?: MonitorOptions): InteractionMonitor {
  const windowMs = options?.windowMs ?? defaultWindow.windowMs;
  const metricsWindow: MetricsWindow = { windowMs, samples: [] };
  const listeners: Listener[] = [];
  const state = createMonitorState();
  let lastSignal: FrameSignal | undefined;

  const emit = (signal: FrameSignal): void => {
    lastSignal = signal;
    metricsWindow.samples.push(signal);
    metricsWindow.samples = metricsWindow.samples.filter((sample) => signal.timestamp - sample.timestamp <= metricsWindow.windowMs);
    for (const listener of listeners) {
      listener(signal);
    }
  };

  const pushSignal = (now: number): void => {
    const focusX = state.pointer?.x ?? 0.5;
    const focusY = state.pointer?.y ?? 0.5;
    const activity = computeActivityDensity(state.activityTimestamps, now, 500);
    state.activityTimestamps = activity.kept;
    const keys = computeKeypressRate(state.keypressTimestamps, now, 2000);
    state.keypressTimestamps = keys.kept;
    const holdTime = computeHold(state.holdStart, now);

    emit({
      timestamp: now,
      pointerSpeed: state.lastSpeed,
      curvature: state.lastCurvature,
      activityDensity: activity.density,
      focusX,
      focusY,
      holdTime,
      keypressRate: keys.rate,
      variance: state.lastVariance,
    });
  };

  const tick = (timestamp: number): void => {
    pushSignal(timestamp);
    if (typeof window !== "undefined") {
      state.frameId = window.requestAnimationFrame(tick);
    }
  };

  const { handlePointerMove, handlePointerDown, handlePointerUp, handleKeydown } = createMonitorHandlers(state, metricsWindow);

  const start = (): void => {
    if (state.frameId !== undefined) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("keydown", handleKeydown, { passive: true });
    state.frameId = window.requestAnimationFrame(tick);
  };

  const stop = (): void => {
    if (typeof window !== "undefined") {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("keydown", handleKeydown);
    }
    if (state.frameId !== undefined && typeof window !== "undefined") {
      window.cancelAnimationFrame(state.frameId);
    }
    state.frameId = undefined;
    state.pointer = undefined;
    state.previousDirection = undefined;
    state.lastSpeed = 0;
    state.lastVariance = 0;
    state.lastCurvature = 0;
    state.activityTimestamps = [];
    state.keypressTimestamps = [];
    state.holdStart = undefined;
    metricsWindow.samples = [];
  };

  const subscribe = (listener: Listener): (() => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    };
  };

  const latestSnapshot = (): InteractionSnapshot => snapshotFromSignals(metricsWindow.samples);
  const latestSignal = (): FrameSignal | undefined => lastSignal;

  return {
    start,
    stop,
    subscribe,
    latestSnapshot,
    latestSignal,
  };
}
