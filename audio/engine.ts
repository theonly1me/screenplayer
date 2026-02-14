import type { Instrument } from "./instruments";

export type ScheduledEvent = {
  time: number;
  callback: () => void;
};

export type AudioEngine = {
  registerInstrument: (name: string, instrument: Instrument) => void;
  schedule: (event: ScheduledEvent) => void;
  start: () => void;
  stop: () => void;
  setLookahead: (ms: number) => void;
  trigger: (
    name: string,
    time: number,
    velocity: number,
    note?: number,
  ) => void;
  dispose: () => void;
};

export function createAudioEngine(context: AudioContext): AudioEngine {
  const queue: ScheduledEvent[] = [];
  let lookaheadMs = 25;
  let schedulerId: ReturnType<typeof setInterval> | undefined;
  let instruments: Record<string, Instrument> = {};

  const registerInstrument = (name: string, instrument: Instrument): void => {
    instruments[name] = instrument;
  };

  const schedule = (event: ScheduledEvent): void => {
    queue.push(event);
  };

  const flush = (): void => {
    const now = context.currentTime;
    const horizon = now + lookaheadMs / 1000;
    const remaining: ScheduledEvent[] = [];

    for (const event of queue) {
      if (event.time <= horizon) {
        event.callback();
      } else {
        remaining.push(event);
      }
    }

    queue.length = 0;
    queue.push(...remaining);
  };

  const start = (): void => {
    if (schedulerId !== undefined) {
      return;
    }
    schedulerId = setInterval(flush, lookaheadMs);
  };

  const stop = (): void => {
    if (schedulerId === undefined) {
      return;
    }
    clearInterval(schedulerId);
    schedulerId = undefined;
  };

  const setLookahead = (ms: number): void => {
    if (ms <= 0) {
      return;
    }
    lookaheadMs = ms;
    if (schedulerId !== undefined) {
      clearInterval(schedulerId);
      schedulerId = setInterval(flush, lookaheadMs);
    }
  };

  const trigger = (
    name: string,
    time: number,
    velocity: number,
    note?: number,
  ): void => {
    const instrument = instruments[name];
    if (instrument === undefined) {
      return;
    }
    instrument.trigger(time, velocity, note);
  };

  const dispose = (): void => {
    stop();
    queue.length = 0;
    instruments = {};
  };

  return {
    registerInstrument,
    schedule,
    start,
    stop,
    setLookahead,
    trigger,
    dispose,
  };
}
