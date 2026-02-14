import { createLiveAudioMapper, LiveAudioMapper } from "./liveMapper";

export type AudioRig = {
  start: () => void;
  stop: () => void;
  dispose: () => void;
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

  const dispose = (): void => {
    mapper.stop();
    void context.close();
  };

  return { start, stop, dispose, mapper };
}
