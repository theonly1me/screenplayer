import { Instrument } from "./types";
import { createSilentInstrument } from "./silent";

export function createLead(): Instrument {
  return createSilentInstrument();
}
