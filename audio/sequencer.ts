import { AudioEngine } from "./engine";

export type SequenceEvent = {
  instrument: string;
  time: number;
  velocity: number;
  note?: number;
};

export type SequencerConfig = {
  swing: number;
  subdivision: number;
};

export type Sequencer = {
  updateConfig: (next: SequencerConfig) => void;
  schedule: (event: SequenceEvent) => void;
};

export function createSequencer(
  engine: AudioEngine,
  config: SequencerConfig,
): Sequencer {
  let currentConfig = config;

  const updateConfig = (next: SequencerConfig): void => {
    currentConfig = next;
  };

  const schedule = (event: SequenceEvent): void => {
    const adjustedTime = applySwing(
      event.time,
      currentConfig.swing,
      event.time,
      currentConfig.subdivision,
    );
    engine.schedule({
      time: adjustedTime,
      callback: () =>
        engine.trigger(
          event.instrument,
          adjustedTime,
          event.velocity,
          event.note,
        ),
    });
  };

  return {
    updateConfig,
    schedule,
  };
}

function applySwing(
  time: number,
  swing: number,
  reference: number,
  subdivision: number,
): number {
  if (swing <= 0) {
    return time;
  }
  const step = 1 / subdivision;
  const position = Math.floor((time - reference) / step);
  const isOffbeat = position % 2 === 1;
  if (!isOffbeat) {
    return time;
  }
  return time + step * swing * 0.5;
}
