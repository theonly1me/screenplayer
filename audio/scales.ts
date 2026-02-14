import { MusicDirective } from "../ai/conductor";

export type ScaleName = MusicDirective["scale"];
export type MoodName = MusicDirective["mood"];

const scaleSteps: Record<ScaleName, number[]> = {
  pentatonic: [0, 3, 5, 7, 10],
  minor: [0, 2, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
};

const moodProgressions: Record<MoodName, number[]> = {
  calm: [0, 3, 5, 4],
  playful: [0, 4, 5, 3],
  tense: [0, 2, 1, 5],
  driving: [0, 5, 3, 4],
};

export function degreeToMidi(
  root: number,
  degree: number,
  scale: ScaleName,
): number {
  const steps = scaleSteps[scale];
  const octave = Math.floor(degree / steps.length);
  const step = steps[degree % steps.length];
  return root + octave * 12 + step;
}

export function chordRoot(
  baseRoot: number,
  chordIndex: number,
  mood: MoodName,
): number {
  const offsets = moodProgressions[mood];
  const offset = offsets[chordIndex % offsets.length];
  return baseRoot + offset;
}

export function chordTone(
  root: number,
  degreeIndex: number,
  scale: ScaleName,
): number {
  return degreeToMidi(root, degreeIndex, scale);
}
