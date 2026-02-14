import { NextRequest } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";

import { z } from "zod";
import { generateText, Output } from "ai";

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

type MusicDirective = z.infer<typeof MusicDirectiveSchema>;

const SnapshotSchema = z.object({
  energy: z.number(),
  chaos: z.number(),
  density: z.number(),
  focusX: z.number(),
  focusY: z.number(),
  rhythmIntent: z.number(),
});

const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const snapResult = SnapshotSchema.safeParse(body.snapshot);
  const prevResult = MusicDirectiveSchema.safeParse(body.previous);
  if (!snapResult.success || !prevResult.success) {
    return new Response("bad input", { status: 400 });
  }
  const prompt = buildPrompt(snapResult.data, prevResult.data);
  const result = await generateText({
    model: openai("gpt-5-nano"),
    prompt,
    output: Output.object({ schema: MusicDirectiveSchema }),
  });

  if (result.output) {
    return Response.json(result.output);
  }

  const parsed = safeParseDirective(result.text);
  if (!parsed) {
    return Response.json(prevResult.data);
  }
  return Response.json(parsed);
}

function buildPrompt(
  snapshot: z.infer<typeof SnapshotSchema>,
  previous: MusicDirective,
): string {
  return [
    "You control a live music system that is already playing.",
    "You only adjust high-level parameters: tempo, swing, density, scale, mood, instrument choices, mappingAdjustments.",
    "Do not propose notes, phrases, or commentary. Output JSON that matches MusicDirectiveSchema.",
    "Guidance:",
    "- React to behavior: high energy or rhythmIntent allows quicker changes; low activity should drift slowly.",
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

function safeParseDirective(text: string): MusicDirective | undefined {
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
