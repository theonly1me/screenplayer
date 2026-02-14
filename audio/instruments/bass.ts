import { Instrument } from "./types";
import { createSilentInstrument } from "./silent";

export function createBass(): Instrument {
  return createSilentInstrument();
}
