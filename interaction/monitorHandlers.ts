import { MetricsWindow } from "./metrics";
import { pushInteractionEvent } from "./events";
import { clampSpeed, normalizePointer, updateCurvature, updateVariance } from "./monitorUtils";
import { MonitorState } from "./monitorState";

export function createMonitorHandlers(state: MonitorState, metricsWindow: MetricsWindow) {
  const handlePointerMove = (event: PointerEvent): void => {
    const now = performance.now();
    const normalized = normalizePointer(event);
    const prev = state.pointer;

    if (prev !== undefined) {
      const dx = normalized.x - prev.x;
      const dy = normalized.y - prev.y;
      const dtMs = now - prev.timestamp;
      if (dtMs > 0) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = distance / dtMs;
        state.lastSpeed = clampSpeed(speed);
        state.lastVariance = updateVariance(metricsWindow.samples, state.lastSpeed);
        state.lastCurvature = updateCurvature(state.previousDirection, dx, dy);
        state.previousDirection = { dx, dy };
      }
    }

    state.pointer = { ...normalized, timestamp: now };
    state.activityTimestamps.push(now);
    pushInteractionEvent({
      type: "pointerMove",
      timestamp: now,
      x: normalized.x,
      y: normalized.y,
      speed: state.lastSpeed,
      isDown: normalized.isDown,
      key: undefined,
    });
  };

  const handlePointerDown = (): void => {
    const now = performance.now();
    state.holdStart = now;
    state.activityTimestamps.push(now);
    pushInteractionEvent({
      type: "pointerDown",
      timestamp: now,
      x: state.pointer?.x,
      y: state.pointer?.y,
      isDown: true,
      speed: state.lastSpeed,
      key: undefined,
    });
  };

  const handlePointerUp = (): void => {
    const now = performance.now();
    state.holdStart = undefined;
    state.activityTimestamps.push(now);
    pushInteractionEvent({
      type: "pointerUp",
      timestamp: now,
      x: state.pointer?.x,
      y: state.pointer?.y,
      isDown: false,
      speed: state.lastSpeed,
      key: undefined,
    });
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    const now = performance.now();
    state.keypressTimestamps.push(now);
    pushInteractionEvent({
      type: "keyPress",
      timestamp: now,
      x: state.pointer?.x,
      y: state.pointer?.y,
      key: event.key,
      speed: undefined,
      isDown: state.pointer?.isDown,
    });
  };

  return { handlePointerMove, handlePointerDown, handlePointerUp, handleKeydown };
}
