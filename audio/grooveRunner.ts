import { MusicDirective } from "../ai/conductor";
import { AudioEngine } from "./engine";
import { clamp01 } from "./liveHelpers";
import { chordRoot, chordTone } from "./scales";

export type GrooveState = {
  bpm: number;
  density: number;
  swing: number;
  fillChance: number;
  root: number;
  directive: MusicDirective;
  chordStep: number;
};

export function runGroove(
  context: AudioContext,
  engine: AudioEngine,
  state: GrooveState,
): GrooveState {
  const now = context.currentTime;
  const lookahead = 0.25;
  const secondsPerBeat = 60 / state.bpm;
  const stepDuration = secondsPerBeat / 4;
  let chordStep = state.chordStep;
  let stepTime = chordStep * stepDuration;

  while (stepTime < now + lookahead) {
    const t = stepTime;
    const isDownbeat = chordStep % 16 === 0;
    const isBackbeat = chordStep % 16 === 8;
    const isHat = chordStep % 2 === 0;
    const swingOffset = chordStep % 2 === 1 ? state.swing * stepDuration : 0;

    if (isDownbeat) {
      engine.trigger("kick", t, 0.9);
    } else if (chordStep % 16 === 4 && state.density > 0.4) {
      engine.trigger("kick", t, 0.7);
    }

    if (isBackbeat || (state.density > 0.6 && chordStep % 16 === 12)) {
      engine.trigger("snare", t + 0.01, 0.72);
    }

    if (isHat) {
      const hatVel = 0.3 + state.density * 0.5;
      engine.trigger("hat", t + swingOffset, clamp01(hatVel));
    }

    const chordBase = chordTone(
      chordRoot(state.root, Math.floor(chordStep / 16), state.directive.mood),
      0,
      state.directive.scale,
    );

    if (chordStep % 4 === 0) {
      const bassNote = chordBase + (chordStep % 32 === 16 ? -5 : 0);
      const vel = 0.5 + state.density * 0.3;
      engine.trigger("bass", t, vel, bassNote);
    }

    if (chordStep % 8 === 0 && state.density > 0.25) {
      const spread = 2 + state.directive.mappingAdjustments.pitchInfluence * 4;
      const leadNote = chordTone(chordBase, 4 + spread, state.directive.scale);
      engine.trigger("lead", t + 0.02, 0.4 + state.density * 0.35, leadNote);
    }

    if (Math.random() < state.fillChance && chordStep % 16 > 12) {
      engine.trigger("snare", t + 0.03, 0.5);
      engine.trigger("hat", t + 0.04, 0.55);
    }

    if (chordStep % 16 === 0 && state.density > 0.2) {
      engine.trigger("texture", t, 0.28 + state.density * 0.2);
    }

    chordStep += 1;
    stepTime = chordStep * stepDuration;
  }

  return { ...state, chordStep };
}
