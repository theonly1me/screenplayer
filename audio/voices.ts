import { MusicDirective } from "../ai/conductor";
import { Instrument } from "./instruments";
import { midiToFreq, noiseBuffer, scheduleEnvelope } from "./utils";

export type LeadMode = MusicDirective["instruments"]["lead"];
export type BassMode = MusicDirective["instruments"]["bass"];
export type TextureMode = MusicDirective["instruments"]["texture"];

export type LeadVoice = Instrument & { setMode: (mode: LeadMode) => void };
export type BassVoice = Instrument & { setMode: (mode: BassMode) => void };
export type TextureVoice = Instrument & {
  setMode: (mode: TextureMode) => void;
};

export function createLeadVoice(context: AudioContext): LeadVoice {
  let mode: LeadMode = "sine";
  const trigger = (time: number, velocity: number, note = 64): void => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const freq = midiToFreq(note);

    osc.frequency.setValueAtTime(freq, time);
    filter.type = "lowpass";

    if (mode === "fm") {
      const mod = context.createOscillator();
      const modGain = context.createGain();
      mod.type = "sine";
      mod.frequency.setValueAtTime(freq * 2, time);
      modGain.gain.setValueAtTime(freq * 0.4, time);
      mod.connect(modGain).connect(osc.frequency);
      mod.start(time);
      mod.stop(time + 0.8);
    }

    if (mode === "pluck") {
      osc.type = "sawtooth";
      filter.frequency.setValueAtTime(3200, time);
      filter.frequency.exponentialRampToValueAtTime(800, time + 0.25);
      scheduleEnvelope(gain, time, velocity, {
        attack: 0.01,
        decay: 0.12,
        sustain: 0.2,
        release: 0.4,
      });
    } else if (mode === "triangle") {
      osc.type = "triangle";
      filter.frequency.setValueAtTime(1800, time);
      filter.frequency.linearRampToValueAtTime(900, time + 0.35);
      scheduleEnvelope(gain, time, velocity, {
        attack: 0.01,
        decay: 0.16,
        sustain: 0.35,
        release: 0.5,
      });
    } else {
      osc.type = "sine";
      filter.frequency.setValueAtTime(2400, time);
      filter.frequency.linearRampToValueAtTime(1400, time + 0.4);
      scheduleEnvelope(gain, time, velocity, {
        attack: 0.015,
        decay: 0.2,
        sustain: 0.25,
        release: 0.55,
      });
    }

    osc.connect(filter).connect(gain).connect(context.destination);
    osc.start(time);
    osc.stop(time + 1.2);
  };

  const setMode = (next: LeadMode): void => {
    mode = next;
  };

  return { trigger, setMode };
}

export function createBassVoice(context: AudioContext): BassVoice {
  let mode: BassMode = "sub";
  const trigger = (time: number, velocity: number, note = 36): void => {
    const osc = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const freq = midiToFreq(note);

    if (mode === "square") {
      osc.type = "square";
    } else if (mode === "fm") {
      osc.type = "sawtooth";
      const mod = context.createOscillator();
      const modGain = context.createGain();
      mod.frequency.setValueAtTime(freq * 1.5, time);
      modGain.gain.setValueAtTime(freq * 0.25, time);
      mod.connect(modGain).connect(osc.frequency);
      mod.start(time);
      mod.stop(time + 0.9);
    } else {
      osc.type = "sine";
    }

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, time);
    filter.frequency.exponentialRampToValueAtTime(90, time + 0.55);

    scheduleEnvelope(gain, time, velocity * 0.8, {
      attack: 0.01,
      decay: 0.08,
      sustain: 0.5,
      release: 0.65,
    });

    osc.connect(filter).connect(gain).connect(context.destination);
    osc.start(time);
    osc.stop(time + 1);
  };

  const setMode = (next: BassMode): void => {
    mode = next;
  };

  return { trigger, setMode };
}

export function createTextureVoice(context: AudioContext): TextureVoice {
  let mode: TextureMode = "pad";
  const noise = noiseBuffer(context, 1.2);

  const trigger = (time: number, velocity: number): void => {
    if (mode === "noise") {
      const src = context.createBufferSource();
      src.buffer = noise;
      const hp = context.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.setValueAtTime(400, time);
      const gain = context.createGain();
      scheduleEnvelope(gain, time, velocity * 0.6, {
        attack: 0.01,
        decay: 0.18,
        sustain: 0.2,
        release: 0.4,
      });
      src.connect(hp).connect(gain).connect(context.destination);
      src.start(time);
      src.stop(time + 0.6);
      return;
    }

    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = mode === "grain" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(220, time);

    if (mode === "grain") {
      osc.frequency.exponentialRampToValueAtTime(160, time + 1.4);
    } else {
      osc.frequency.linearRampToValueAtTime(180, time + 1.4);
    }

    scheduleEnvelope(gain, time, velocity * 0.4, {
      attack: 0.15,
      decay: 0.4,
      sustain: 0.45,
      release: 1.2,
    });

    osc.connect(gain).connect(context.destination);
    osc.start(time);
    osc.stop(time + 2);
  };

  const setMode = (next: TextureMode): void => {
    mode = next;
  };

  return { trigger, setMode };
}
