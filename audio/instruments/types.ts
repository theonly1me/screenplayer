export type InstrumentTrigger = {
  time: number;
  velocity: number;
  note?: number;
};

export type Instrument = {
  trigger: (time: number, velocity: number, note?: number) => void;
};
