export type MusicDirective = {
  bpm: number;
  scale: "pentatonic" | "minor" | "dorian" | "lydian";
  mood: "calm" | "playful" | "tense" | "driving";
  density: number;
  swing: number;
  instruments: {
    lead: "sine" | "triangle" | "fm" | "pluck";
    bass: "sub" | "square" | "fm";
    texture: "noise" | "pad" | "grain";
  };
  mappingAdjustments: {
    pitchInfluence: number;
    rhythmInfluence: number;
    chaosInfluence: number;
  };
};

export const defaultDirective: MusicDirective = {
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
};

function lerp(current: number, target: number, amount: number): number {
  return current + (target - current) * amount;
}

export function interpolateDirective(current: MusicDirective, target: MusicDirective, amount: number): MusicDirective {
  const nextAmount = amount < 0 ? 0 : amount > 1 ? 1 : amount;
  return {
    bpm: lerp(current.bpm, target.bpm, nextAmount),
    scale: nextAmount >= 0.5 ? target.scale : current.scale,
    mood: nextAmount >= 0.5 ? target.mood : current.mood,
    density: lerp(current.density, target.density, nextAmount),
    swing: lerp(current.swing, target.swing, nextAmount),
    instruments: {
      lead: nextAmount >= 0.5 ? target.instruments.lead : current.instruments.lead,
      bass: nextAmount >= 0.5 ? target.instruments.bass : current.instruments.bass,
      texture: nextAmount >= 0.5 ? target.instruments.texture : current.instruments.texture,
    },
    mappingAdjustments: {
      pitchInfluence: lerp(current.mappingAdjustments.pitchInfluence, target.mappingAdjustments.pitchInfluence, nextAmount),
      rhythmInfluence: lerp(current.mappingAdjustments.rhythmInfluence, target.mappingAdjustments.rhythmInfluence, nextAmount),
      chaosInfluence: lerp(current.mappingAdjustments.chaosInfluence, target.mappingAdjustments.chaosInfluence, nextAmount),
    },
  };
}
