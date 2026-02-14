# Screenplayer

Interaction-driven audiovisual instrument built with Next.js, Three.js, Web Audio, and an AI conductor.

## What It Does
- Turns pointer + keyboard activity into real-time synth + visuals.
- Three.js surface renders particles/ripples/emotes that mirror audio energy.
- AI conductor (GPT-5-nano by default) nudges tempo, density, swing, scale, and instrument mix based on 5s interaction snapshots.

## Quick Start
```bash
npm install
npm run dev
```
Open http://localhost:3000 and hit “Start capture” to begin audio + visuals.

## Scripts
- `npm run dev` – start Next dev server.
- `npm run lint` – eslint + prettier check.
- `npm run build` – Next production build.
- `npm start` – run built app.

## Architecture
- `interaction/*` – per-frame metrics, sliding snapshots, event buffer.
- `ui/*` – Three.js surface (particles, ripples, emotes) driven by interaction signals.
- `audio/*` – Web Audio instruments, live mapper reacting to events, audio rig bootstrap.
- `ai/*` – music directives + conductor loop (JSON schema, adaptive interpolation).
- `state/*` – shared directive/snapshot state helpers.

## AI Conductor
- Model: default `gpt-5-nano` (configurable).
- Cadence: ~6s interval with adaptive lerp (faster when energy/rhythm/chaos are high).
- Output: JSON `MusicDirectiveSchema` only; no note scheduling.

## Notes
- Uses npm (no pnpm/yarn/bun).
- No samples; all synthesis is deterministic Web Audio.
