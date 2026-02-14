import { Instrument } from "./types";

export function createSilentInstrument(): Instrument {
  return {
    trigger: () => {
      // no-op placeholder
    },
  };
}
