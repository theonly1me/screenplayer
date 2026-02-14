import { Instrument } from "./types";
import { createSilentInstrument } from "./silent";

export function createKick(): Instrument {
  return createSilentInstrument();
}
