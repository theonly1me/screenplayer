import { Instrument, InstrumentFactory } from "./types";
import { noiseBuffer } from "../utils";

export const createSnare: InstrumentFactory = (
  context: AudioContext,
): Instrument => {
  const buffer = noiseBuffer(context, 0.5);
  return {
    trigger: (time, velocity) => {
      const noise = context.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = context.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.setValueAtTime(1000 + velocity * 3000, time);

      const noiseGain = context.createGain();
      noiseGain.gain.setValueAtTime(velocity * 0.6, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);

      const tone = context.createOscillator();
      tone.type = "triangle";
      tone.frequency.setValueAtTime(180, time);
      tone.frequency.exponentialRampToValueAtTime(100, time + 0.2);

      const toneGain = context.createGain();
      toneGain.gain.setValueAtTime(velocity * 0.3, time);
      toneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);

      noise
        .connect(noiseFilter)
        .connect(noiseGain)
        .connect(context.destination);
      tone.connect(toneGain).connect(context.destination);

      noise.start(time);
      noise.stop(time + 0.3);
      tone.start(time);
      tone.stop(time + 0.3);
    },
  };
};
