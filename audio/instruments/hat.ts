import { Instrument, InstrumentFactory } from "./types";
import { noiseBuffer } from "../utils";

export const createHat: InstrumentFactory = (
  context: AudioContext,
): Instrument => {
  const buffer = noiseBuffer(context, 0.3);
  return {
    trigger: (time, velocity) => {
      const source = context.createBufferSource();
      source.buffer = buffer;

      const highpass = context.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.setValueAtTime(8000, time);

      const gain = context.createGain();
      gain.gain.setValueAtTime(Math.max(0.05, velocity * 0.5), time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);

      source.connect(highpass).connect(gain).connect(context.destination);
      source.start(time);
      source.stop(time + 0.2);
    },
  };
};
