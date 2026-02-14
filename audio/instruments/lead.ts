import { Instrument, InstrumentFactory } from "./types";
import { midiToFreq } from "../utils";

export const createLead: InstrumentFactory = (
  context: AudioContext,
): Instrument => {
  return {
    trigger: (time, velocity, note) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(midiToFreq(note ?? 64), time);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1800, time);
      filter.frequency.linearRampToValueAtTime(1200, time + 0.25);

      const peak = Math.max(0.05, Math.min(1, velocity));
      gain.gain.setValueAtTime(peak, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

      osc.connect(filter).connect(gain).connect(context.destination);
      osc.start(time);
      osc.stop(time + 0.5);
    },
  };
};
