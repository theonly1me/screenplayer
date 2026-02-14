# Agents Guide

Purpose: outline how an AI agent should steer Screenplayer without blocking real-time interaction.

Key rules

- Do not schedule notes; only set high-level parameters (bpm, swing, density, scale, mood, instrument mix, mappingAdjustments).
- Keep JSON output matching `MusicDirectiveSchema`. No prose.
- React to user behavior: high energy/rhythmIntent/chaos can justify quicker shifts; otherwise favor smooth changes.
- Respect bounds: bpm 60–160, swing 0–0.5, density 0–1.
- Mappings to favor: focusY↓ → darker/warmer; focusY↑ → brighter; focusX spread → harmonic motion; chaos → fills only if density < 0.8.
- If uncertain, bias toward previous directive but lean toward current snapshot trends.

Code quality guardrails

- Prefer factories over classes; keep files concise (target < 200 lines).
- Avoid `any` and `null`; use `undefined` and precise types.
- Keep optional fields minimal; require data or use explicit unions with `undefined`.
- Avoid shouting case in identifiers; use camelCase.
- Avoid type casts and non-null assertions; `as const` is acceptable when needed.

Runtime loop (every ~6s by default)

1. Read latest 5s snapshot from `interaction`.
2. Call model (default gpt-5-nano) with the conductor prompt and schema.
3. Interpolate toward target directive with adaptive lerp (faster when energy/rhythm/chaos are high).
4. Apply directive to sequencer + synthesis mappings; never block audio thread.

Cost/latency

- Prefer small, cheap models (gpt-5-nano) unless explicitly reconfigured.
- Streaming is optional; non-streamed JSON is acceptable because audio runs independently.
