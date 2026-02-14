import { generateObject } from "ai";
import { z } from "zod";
import { InteractionSnapshot } from "../interaction/snapshot";
import {
  MusicDirective,
  defaultDirective,
  interpolateDirective,
} from "./conductor";

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

export function createConductor(
  getSnapshot: () => InteractionSnapshot,
  options?: { model?: string; intervalMs?: number; baseLerp?: number },
): Conductor {
  let state: ConductorState = {
    current: defaultDirective,
    target: defaultDirective,
    previous: defaultDirective,
  };
  let tickId: ReturnType<typeof setInterval> | undefined;
  let inFlight = false;

  const model = options?.model ?? "gpt-5-nano";
  const intervalMs = options?.intervalMs ?? 6000;
  const baseLerp = options?.baseLerp ?? 0.08;

  const latest = (): MusicDirective => state.current;

  const start = (): void => {
    if (tickId !== undefined) {
      return;
    }
    tickId = setInterval(async () => {
      if (inFlight) {
        return;
      }
      inFlight = true;
      const snapshot = getSnapshot();
      const next = await requestDirective(snapshot, state.target, model);
      const adaptiveLerp = computeLerp(baseLerp, snapshot);
      state = {
        previous: state.target,
        target: next,
        current: interpolateDirective(state.current, next, adaptiveLerp),
      };
      inFlight = false;
    }, intervalMs);
  };

  const stop = (): void => {
    if (tickId !== undefined) {
      clearInterval(tickId);
      tickId = undefined;
    }
  };

  return { start, stop, latest };
}

async function requestDirective(
  snapshot: InteractionSnapshot,
  previous: MusicDirective,
  model: string,
): Promise<MusicDirective> {
  const result = await generateObject({
    model,
    schema: MusicDirectiveSchema,
    prompt: buildPrompt(snapshot, previous),
  });
  return result.object;
}

function buildPrompt(
  snapshot: InteractionSnapshot,
  previous: MusicDirective,
): string {
  return [
    "You are the conductor of a generative audio system.",
    "You set system parameters only (tempo, swing, density, scale, mood, instrument choices, mapping adjustments).",
    "Never schedule notes or output prose; respond with JSON matching the schema.",
    "Behavior expectations:",
    "- React to user behavior: high energy or rhythmIntent can permit quicker shifts; low activity should glide slowly.",
    "- Keep changes smooth; avoid abrupt jumps unless chaos is high and density is low.",
    "- Keep bpm 60-160, swing 0-0.5, density 0-1.",
    "- Map tendencies: focusY lower -> darker/warmer; focusY higher -> brighter; focusX spread -> harmonic motion; chaos -> tasteful fills only when density < 0.8.",
    "- If uncertain, lean toward previous directive while following current snapshot trends.",
    "Respond ONLY with JSON.",
    "",
    `Previous directive: ${JSON.stringify(previous)}`,
    `Current snapshot: ${JSON.stringify(snapshot)}`,
  ].join("\n");
}

function computeLerp(base: number, snapshot: InteractionSnapshot): number {
  const energyBoost = snapshot.energy * 0.25;
  const rhythmBoost = snapshot.rhythmIntent * 0.15;
  const chaosBoost = snapshot.chaos * 0.15;
  const amount = base + energyBoost + rhythmBoost + chaosBoost;
  if (amount < 0) {
    return 0;
  }
  if (amount > 0.45) {
    return 0.45;
  }
  return amount;
}
