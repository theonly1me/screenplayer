import { createLiveAudioMapper, LiveAudioMapper } from "./liveMapper";

export type AudioRig = {
  start: () => void;
  stop: () => void;
  dispose: () => void;
  updateSnapshot: (
    snapshot: import("../interaction/snapshot").InteractionSnapshot,
  ) => void;
  updateDirective: (
    directive: import("../ai/conductor").MusicDirective,
  ) => void;
  mapper: LiveAudioMapper;
};

export function createAudioRig(): AudioRig | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const context = new AudioContext({ latencyHint: "interactive" });
  const mapper = createLiveAudioMapper(context);

  const start = (): void => {
    void context.resume();
    mapper.start();
  };

  const stop = (): void => {
    mapper.stop();
  };

  const updateSnapshot = (
    snapshot: import("../interaction/snapshot").InteractionSnapshot,
  ): void => {
    mapper.updateSnapshot(snapshot);
  };

  const updateDirective = (
    directive: import("../ai/conductor").MusicDirective,
  ): void => {
    mapper.updateDirective(directive);
  };

  const dispose = (): void => {
    mapper.stop();
    void context.close();
  };

  return { start, stop, dispose, mapper, updateSnapshot, updateDirective };
}
