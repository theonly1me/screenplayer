export function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function scheduleEnvelope(
  gain: GainNode,
  time: number,
  velocity: number,
  envelope: { attack: number; decay: number; sustain: number; release: number },
): void {
  const peak = Math.max(0, Math.min(1, velocity));
  const sustainLevel = Math.max(0, Math.min(1, envelope.sustain * peak));
  gain.gain.cancelScheduledValues(time);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(peak, time + envelope.attack);
  gain.gain.linearRampToValueAtTime(
    sustainLevel,
    time + envelope.attack + envelope.decay,
  );
  gain.gain.linearRampToValueAtTime(
    0,
    time + envelope.attack + envelope.decay + envelope.release,
  );
}

export function noiseBuffer(
  context: AudioContext,
  duration: number,
): AudioBuffer {
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}
