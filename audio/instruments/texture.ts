import { Instrument, InstrumentFactory } from "./types";
import { noiseBuffer } from "../utils";

export const createTexture: InstrumentFactory = (context: AudioContext): Instrument => {
  const buffer = noiseBuffer(context, 2.0);
  const reverb = context.createConvolver();
  reverb.buffer = buffer;
  return {
    trigger: (time, velocity) => {
      const source = context.createBufferSource();
      source.buffer = buffer;

      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(600 + velocity * 800, time);
      filter.Q.value = 0.8;

      const gain = context.createGain();
      gain.gain.setValueAtTime(velocity * 0.3, time);
      gain.gain.linearRampToValueAtTime(0.0001, time + 1.2);

      source.connect(filter).connect(reverb).connect(gain).connect(context.destination);
      source.start(time);
      source.stop(time + 1.5);
    },
  };
};
