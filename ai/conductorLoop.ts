import { generateObject } from "ai";
import { z } from "zod";
import { MusicDirective, defaultDirective, interpolateDirective } from "./conductor";
import { InteractionSnapshot } from "../interaction/snapshot";

const MusicDirectiveSchema = z.object({
  bpm: z.number().min(60).max(160),
  scale: z.enum(["pentatonic", "minor", "dorian", "lydian"]),
  mood: z.enum(["calm", "playful", "tense", "driving"]),
  density: z.number().min(0).max(1),
  swing: z.number().min(0).max(0.5),
  instruments: z.object({
    lead: z.enum(["sine", "triangle", "fm", "pluck"]),
    bass: z.enum(["sub", "square", "fm"]),
    texture: z.enum(["noise", "pad", "grain"]),
  }),
  mappingAdjustments: z.object({
    pitchInfluence: z.number(),
    rhythmInfluence: z.number(),
    chaosInfluence: z.number(),
  }),
});

export type ConductorState = {
  current: MusicDirective;
  target: MusicDirective;
  previous: MusicDirective;
};

export type Conductor = {
  start: () => void;
  stop: () => void;
  latest: () => MusicDirective;
};

export function createConductor(getSnapshot: () => InteractionSnapshot): Conductor {
  let state: ConductorState = {
    current: defaultDirective,
    target: defaultDirective,
    previous: defaultDirective,
  };
  let tickId: ReturnType<typeof setInterval> | undefined;

  const latest = (): MusicDirective => state.current;

  const start = (): void => {
    if (tickId !== undefined) {
      return;
    }
    tickId = setInterval(async () => {
      const snapshot = getSnapshot();
      const next = await requestDirective(snapshot, state.target);
      state = {
        previous: state.target,
        target: next,
        current: interpolateDirective(state.current, next, 0.1),
      };
    }, 6000);
  };

  const stop = (): void => {
    if (tickId !== undefined) {
      clearInterval(tickId);
      tickId = undefined;
    }
  };

  return { start, stop, latest };
}

async function requestDirective(snapshot: InteractionSnapshot, previous: MusicDirective): Promise<MusicDirective> {
  const result = await generateObject({
    model: "gpt-4o-mini",
    schema: MusicDirectiveSchema,
    prompt: buildPrompt(snapshot, previous),
  });
  return result.object;
}

function buildPrompt(snapshot: InteractionSnapshot, previous: MusicDirective): string {
  return [
    "You control a generative audio system.",
    "You do not write melodies.",
    "You adjust behavior parameters.",
    "Favor smooth evolution.",
    "Avoid drastic changes.",
    "Respond ONLY with JSON.",
    "",
    `Previous directive: ${JSON.stringify(previous)}`,
    `Current snapshot: ${JSON.stringify(snapshot)}`,
  ].join("\n");
}
