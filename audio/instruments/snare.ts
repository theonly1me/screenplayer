import { Instrument } from "./types";
import { createSilentInstrument } from "./silent";

export function createSnare(): Instrument {
  return createSilentInstrument();
}
