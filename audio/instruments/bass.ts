import { Instrument, InstrumentFactory } from "./types";
import { midiToFreq } from "../utils";

export const createBass: InstrumentFactory = (
  context: AudioContext,
): Instrument => {
  return {
    trigger: (time, velocity, note) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(midiToFreq(note ?? 36), time);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(200, time);
      filter.frequency.linearRampToValueAtTime(80, time + 0.4);

      const peak = Math.max(0.05, Math.min(1, velocity)) * 0.6;
      gain.gain.setValueAtTime(peak, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);

      osc.connect(filter).connect(gain).connect(context.destination);
      osc.start(time);
      osc.stop(time + 0.8);
    },
  };
};
