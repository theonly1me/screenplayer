import { Instrument } from "./types";
import { createSilentInstrument } from "./silent";

export function createHat(): Instrument {
  return createSilentInstrument();
}
