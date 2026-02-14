"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createInteractionMonitor,
  InteractionMonitor,
} from "../interaction/monitor";
import { InteractionSnapshot } from "../interaction/snapshot";
import { createThreeSurface, ThreeSurface } from "../ui/threeSurface";
import { createAudioRig, AudioRig } from "../audio/rig";
import { defaultDirective, MusicDirective } from "../ai/conductor";

export default function Home() {
  const monitor = useMemo<InteractionMonitor>(
    () => createInteractionMonitor(),
    [],
  );
  const surfaceRef = useRef<ThreeSurface | undefined>(undefined);
  const audioRigRef = useRef<AudioRig | undefined>(undefined);
  const lastCanvas = useRef<HTMLCanvasElement | undefined>(undefined);
  const snapshotRef = useRef<InteractionSnapshot | undefined>(undefined);
  const directiveRef = useRef<MusicDirective>(defaultDirective);
  const conductorTimer = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | undefined>(
    undefined,
  );

  const requestDirectiveUpdate = async (): Promise<void> => {
    const snap = snapshotRef.current;
    if (snap === undefined) {
      return;
    }
    try {
      const response = await fetch("/api/conductor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshot: snap,
          previous: directiveRef.current,
        }),
      });
      if (!response.ok) {
        return;
      }
      const directive: MusicDirective = await response.json();
      directiveRef.current = directive;
      audioRigRef.current?.updateDirective(directive);
    } catch (error) {
      console.error("directive fetch failed", error);
    }
  };

  useEffect(() => {
    if (canvasEl === undefined) {
      return undefined;
    }
    const surface = createThreeSurface(canvasEl);
    surface.init();
    surfaceRef.current = surface;
    return () => {
      surface.dispose();
      surfaceRef.current = undefined;
      audioRigRef.current?.dispose();
      audioRigRef.current = undefined;
      if (conductorTimer.current !== undefined) {
        clearInterval(conductorTimer.current);
        conductorTimer.current = undefined;
      }
    };
  }, [canvasEl]);

  useEffect(() => {
    const handleSignal = (): void => {
      const signal = monitor.latestSignal();
      if (signal === undefined) {
        return;
      }
      surfaceRef.current?.applySignal(signal);
      const snap = monitor.latestSnapshot();
      snapshotRef.current = snap;
      audioRigRef.current?.updateSnapshot(snap);
    };
    const unsubscribe = monitor.subscribe(handleSignal);
    monitor.start();
    return () => {
      unsubscribe();
      monitor.stop();
    };
  }, [monitor]);

  useEffect(() => {
    const startAudio = (): void => {
      if (audioRigRef.current === undefined) {
        audioRigRef.current = createAudioRig();
      }
      audioRigRef.current?.start();
      const snap = snapshotRef.current;
      if (snap !== undefined) {
        audioRigRef.current?.updateSnapshot(snap);
      }
      if (conductorTimer.current === undefined) {
        conductorTimer.current = setInterval(requestDirectiveUpdate, 6000);
      }
    };
    const handlePointer = (): void => startAudio();
    const handleKey = (): void => startAudio();
    window.addEventListener("pointerdown", handlePointer, { passive: true });
    window.addEventListener("keydown", handleKey, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointer);
      window.removeEventListener("keydown", handleKey);
      if (conductorTimer.current !== undefined) {
        clearInterval(conductorTimer.current);
        conductorTimer.current = undefined;
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-black">
      <canvas
        ref={(node) => {
          if (node === lastCanvas.current) {
            return;
          }
          lastCanvas.current = node ?? undefined;
          setCanvasEl(node ?? undefined);
        }}
        className="absolute inset-0 h-full w-full"
      />
      <div className="pointer-events-none absolute inset-0" />
      <main className="relative z-10 mx-auto flex min-h-screen w-full flex-col" />
    </div>
  );
}
