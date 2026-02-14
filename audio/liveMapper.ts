import { drainInteractionEvents } from "../interaction/events";
import { createAudioEngine, AudioEngine } from "./engine";
import { createBass, createHat, createKick, createLead, createSnare, createTexture } from "./instruments";

export type LiveAudioMapper = {
  start: () => void;
  stop: () => void;
  engine: AudioEngine;
};

export function createLiveAudioMapper(context: AudioContext): LiveAudioMapper {
  const engine = createAudioEngine(context);
  const instruments = {
    kick: createKick(context),
    snare: createSnare(context),
    hat: createHat(context),
    bass: createBass(context),
    lead: createLead(context),
    texture: createTexture(context),
  };

  engine.registerInstrument("kick", instruments.kick);
  engine.registerInstrument("snare", instruments.snare);
  engine.registerInstrument("hat", instruments.hat);
  engine.registerInstrument("bass", instruments.bass);
  engine.registerInstrument("lead", instruments.lead);
  engine.registerInstrument("texture", instruments.texture);

  let pollId: ReturnType<typeof setInterval> | undefined;

  const start = (): void => {
    if (pollId !== undefined) {
      return;
    }
    engine.start();
    pollId = setInterval(() => {
      const events = drainInteractionEvents();
      const now = context.currentTime;
      for (const event of events) {
        if (event.type === "pointerDown") {
          engine.trigger("kick", now, 0.9);
        }
        if (event.type === "pointerUp") {
          engine.trigger("snare", now + 0.02, 0.6);
        }
        if (event.type === "pointerMove" && (event.speed ?? 0) > 0.1) {
          engine.trigger("hat", now, Math.min(0.4 + (event.speed ?? 0), 0.9));
        }
        if (event.type === "keyPress") {
          const note = keyToNote(event.key);
          engine.trigger("lead", now, 0.7, note);
        }
      }
    }, 25);
  };

  const stop = (): void => {
    if (pollId !== undefined) {
      clearInterval(pollId);
      pollId = undefined;
    }
    engine.stop();
  };

  return { start, stop, engine };
}

function keyToNote(key: string | undefined): number {
  if (key === undefined) {
    return 64;
  }
  const row = "awsedftgyhujkolp";
  const index = row.indexOf(key.toLowerCase());
  if (index === -1) {
    return 64;
  }
  return 60 + index;
}
