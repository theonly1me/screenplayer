import { Instrument, InstrumentFactory } from "./types";

export const createKick: InstrumentFactory = (context: AudioContext): Instrument => {
  return {
    trigger: (time, velocity) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
      const peak = Math.max(0.05, Math.min(1, velocity));
      gain.gain.setValueAtTime(peak, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
      osc.connect(gain).connect(context.destination);
      osc.start(time);
      osc.stop(time + 0.4);
    },
  };
};
