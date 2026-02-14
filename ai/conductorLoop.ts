import { Output, generateText } from "ai";
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

  const model = options?.model ?? "openai/gpt-5-nano";
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
  const result = await generateText({
    model,
    prompt: buildPrompt(snapshot, previous),
    output: Output.object({ schema: MusicDirectiveSchema }),
    temperature: 0.55,
    presencePenalty: 0.2,
  });
  if (result.output !== undefined) {
    console.log("Result", result.output);
    return result.output;
  }
  const parsed = parseDirective(result.text);
  if (parsed !== undefined) {
    console.log("Result", parsed);
    return parsed;
  }
  return previous;
}

function buildPrompt(
  snapshot: InteractionSnapshot,
  previous: MusicDirective,
): string {
  return [
    "You control a live music system that is already playing.",
    "You only adjust high-level parameters: tempo, swing, density, scale, mood, instrument choices, mappingAdjustments.",
    "Do not propose notes, phrases, or commentary. Output JSON that matches MusicDirectiveSchema.",
    "Guidance:",
    "- React to behavior: if energy > 0.8 raise bpm by 8–18 and density >= 0.25; if energy < 0.25 ease bpm toward 70–90.",
    "- If chaos > 0.6 increase swing by 0.05–0.12 and raise chaosInfluence; if chaos < 0.2 lower swing below 0.08.",
    "- Keep evolution smooth; avoid drastic jumps unless chaos is high and density is low.",
    "- Map tendencies: focusY low -> darker/warmer; focusY high -> brighter; wider focusX -> more harmonic motion; chaos -> tasteful fills only if density < 0.8.",
    "- Keep bpm 60-160, swing 0-0.5, density 0-1.",
    "- Instruments influence timbre only; the audio engine handles sequencing.",
    "- Favor coherent, song-like flow rather than random parameter swings.",
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

function parseDirective(text: string): MusicDirective | undefined {
  try {
    const raw = JSON.parse(text);
    const checked = MusicDirectiveSchema.safeParse(raw);
    if (checked.success) {
      return checked.data;
    }
  } catch (error) {
    console.error("directive parse error", error);
  }
  return undefined;
}
