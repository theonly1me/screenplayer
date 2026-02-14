import { drainInteractionEvents } from "../interaction/events";
import { InteractionSnapshot } from "../interaction/snapshot";
import { MusicDirective } from "../ai/conductor";
import { createAudioEngine, AudioEngine } from "./engine";
import { createHat, createKick, createSnare } from "./instruments";
import { clamp, clamp01, emptySnapshot, keyToDegree, mix } from "./liveHelpers";
import { chordTone } from "./scales";
import { runGroove } from "./grooveRunner";
import {
  BassVoice,
  LeadVoice,
  TextureVoice,
  createBassVoice,
  createLeadVoice,
  createTextureVoice,
} from "./voices";

export type LiveAudioMapper = {
  start: () => void;
  stop: () => void;
  updateSnapshot: (snapshot: InteractionSnapshot) => void;
  updateDirective: (directive: MusicDirective) => void;
  engine: AudioEngine;
};

type MapperState = {
  snapshot: InteractionSnapshot;
  directive: MusicDirective;
  bpm: number;
  density: number;
  swing: number;
  fillChance: number;
  root: number;
  chordStep: number;
};

export function createLiveAudioMapper(context: AudioContext): LiveAudioMapper {
  const engine = createAudioEngine(context);
  const kick = createKick(context);
  const snare = createSnare(context);
  const hat = createHat(context);
  const lead: LeadVoice = createLeadVoice(context);
  const bass: BassVoice = createBassVoice(context);
  const texture: TextureVoice = createTextureVoice(context);

  engine.registerInstrument("kick", kick);
  engine.registerInstrument("snare", snare);
  engine.registerInstrument("hat", hat);
  engine.registerInstrument("lead", lead);
  engine.registerInstrument("bass", bass);
  engine.registerInstrument("texture", texture);

  let pollId: ReturnType<typeof setInterval> | undefined;
  let grooveId: ReturnType<typeof setInterval> | undefined;
  let state: MapperState = {
    snapshot: emptySnapshot,
    directive: {
      bpm: 96,
      scale: "pentatonic",
      mood: "playful",
      density: 0.4,
      swing: 0.08,
      instruments: {
        lead: "sine",
        bass: "sub",
        texture: "pad",
      },
      mappingAdjustments: {
        pitchInfluence: 0.5,
        rhythmInfluence: 0.5,
        chaosInfluence: 0.5,
      },
    },
    bpm: 96,
    density: 0.4,
    swing: 0.08,
    fillChance: 0.12,
    root: 48,
    chordStep: 0,
  };

  const start = (): void => {
    if (pollId !== undefined) {
      return;
    }
    engine.start();
    pollId = setInterval(handleInteractionFills, 35);
    grooveId = setInterval(scheduleGroove, 45);
  };

  const stop = (): void => {
    if (pollId !== undefined) {
      clearInterval(pollId);
      pollId = undefined;
    }
    if (grooveId !== undefined) {
      clearInterval(grooveId);
      grooveId = undefined;
    }
    engine.stop();
  };

  const updateSnapshot = (snapshot: InteractionSnapshot): void => {
    state = { ...state, snapshot };
  };

  const updateDirective = (directive: MusicDirective): void => {
    state = { ...state, directive };
    lead.setMode(directive.instruments.lead);
    bass.setMode(directive.instruments.bass);
    texture.setMode(directive.instruments.texture);
  };

  const derivedParams = (): void => {
    const { snapshot, directive } = state;
    const energyTempo = 78 + snapshot.energy * 70;
    const mixedBpm = mix(directive.bpm, energyTempo, 0.35);
    const dynamicDensity = mix(directive.density, snapshot.density, 0.5);
    const swingVariance = snapshot.chaos * 0.12;
    const mixedSwing = mix(directive.swing, swingVariance, 0.4);
    const chaosFill =
      0.05 +
      directive.mappingAdjustments.chaosInfluence * 0.35 +
      snapshot.chaos * 0.15;
    const baseRoot = 44 + Math.round((1 - snapshot.focusY) * 10);
    const rootSpread =
      (snapshot.focusX - 0.5) * 6 * directive.mappingAdjustments.pitchInfluence;

    state = {
      ...state,
      bpm: clamp(60, 160, mixedBpm),
      density: clamp01(dynamicDensity),
      swing: clamp(0, 0.2, mixedSwing),
      fillChance: clamp01(chaosFill),
      root: baseRoot + Math.round(rootSpread),
    };
  };

  const handleInteractionFills = (): void => {
    const events = drainInteractionEvents();
    const now = context.currentTime;
    for (const event of events) {
      if (event.type === "pointerDown") {
        const vel = clamp01(0.45 + (event.speed ?? 0) * 0.8);
        engine.trigger("kick", now, vel);
        if (state.snapshot.chaos > 0.4) {
          engine.trigger("snare", now + 0.04, 0.4 + state.snapshot.chaos * 0.3);
        }
      }
      if (event.type === "keyPress") {
        const degree = keyToDegree(event.key);
        const note = chordTone(state.root, degree, state.directive.scale);
        const velocity = 0.55 + state.snapshot.energy * 0.35;
        const shouldPad = (state.chordStep + degree) % 4 === 0;
        if (shouldPad) {
          engine.trigger("texture", now, 0.25 + state.snapshot.density * 0.2);
        } else {
          engine.trigger("lead", now, velocity, note);
        }
      }
    }
  };

  const scheduleGroove = (): void => {
    derivedParams();
    const groove = runGroove(context, engine, state);
    state = { ...state, ...groove };
  };

  return { start, stop, updateSnapshot, updateDirective, engine };
}
