import { defaultDirective, type MusicDirective } from "../ai/conductor";
import type { InteractionSnapshot } from "../interaction/snapshot";

export type MusicState = {
  currentDirective: MusicDirective;
  targetDirective: MusicDirective;
  lastSnapshot: InteractionSnapshot | undefined;
};

export function createMusicState(
  initialDirective?: MusicDirective,
): MusicState {
  const base = initialDirective ?? defaultDirective;
  return {
    currentDirective: base,
    targetDirective: base,
    lastSnapshot: undefined,
  };
}

export function setTargetDirective(
  state: MusicState,
  directive: MusicDirective,
): MusicState {
  return {
    ...state,
    targetDirective: directive,
  };
}

export function applySnapshot(
  state: MusicState,
  snapshot: InteractionSnapshot,
): MusicState {
  return {
    ...state,
    lastSnapshot: snapshot,
  };
}
