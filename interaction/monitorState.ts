import { Direction } from "./monitorUtils";

export type PointerState = {
  x: number;
  y: number;
  isDown: boolean;
  timestamp: number;
};

export type MonitorState = {
  frameId?: number;
  pointer?: PointerState;
  previousDirection: Direction;
  lastSpeed: number;
  lastVariance: number;
  lastCurvature: number;
  activityTimestamps: number[];
  keypressTimestamps: number[];
  holdStart?: number;
};

export function createMonitorState(): MonitorState {
  return {
    previousDirection: undefined,
    lastSpeed: 0,
    lastVariance: 0,
    lastCurvature: 0,
    activityTimestamps: [],
    keypressTimestamps: [],
  };
}
