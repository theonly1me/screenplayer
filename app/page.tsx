"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createInteractionMonitor, InteractionMonitor } from "../interaction/monitor";
import { InteractionSnapshot, snapshotFromSignals } from "../interaction/snapshot";
import { readInteractionEvents } from "../interaction/events";
import { createThreeSurface, ThreeSurface } from "../ui/threeSurface";

type OverlayMetrics = InteractionSnapshot & { hold: number; keypressRate: number };

export default function Home() {
  const monitor = useMemo<InteractionMonitor>(() => createInteractionMonitor(), []);
  const surfaceRef = useRef<ThreeSurface | undefined>(undefined);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | undefined>(undefined);
  const [started, setStarted] = useState(false);
  const [pendingEvents, setPendingEvents] = useState(0);

  const latest = useSyncExternalStore(
    (onStoreChange) => monitor.subscribe(() => onStoreChange()),
    () => ({
      signal: monitor.latestSignal(),
      snapshot: monitor.latestSnapshot(),
    }),
    () => ({ signal: undefined, snapshot: snapshotFromSignals([]) })
  );

  const overlay: OverlayMetrics | undefined =
    latest.signal === undefined
      ? undefined
      : {
          energy: latest.signal.pointerSpeed,
          chaos: latest.signal.variance,
          density: latest.signal.activityDensity,
          focusX: latest.signal.focusX,
          focusY: latest.signal.focusY,
          rhythmIntent: latest.signal.keypressRate,
          hold: latest.signal.holdTime,
          keypressRate: latest.signal.keypressRate,
        };
  const snapshot: InteractionSnapshot | undefined = latest.snapshot;

  useEffect(() => {
    if (canvasEl === undefined) {
      return;
    }
    const instance = createThreeSurface(canvasEl);
    instance.init();
    surfaceRef.current = instance;
    return () => {
      instance.dispose();
      surfaceRef.current = undefined;
    };
  }, [canvasEl]);
 
  useEffect(() => {
    const unsub = monitor.subscribe((signal) => {
      surfaceRef.current?.applySignal(signal);
    });
    return () => {
      unsub();
    };
  }, [monitor]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPendingEvents(readInteractionEvents().length);
    }, 400);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!started) {
      monitor.stop();
      return;
    }
    monitor.start();
    return () => {
      monitor.stop();
    };
  }, [monitor, started]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <canvas ref={(node) => setCanvasEl(node ?? undefined)} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-900 via-black to-purple-900 opacity-60" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Screenplayer</h1>
          <p className="text-sm text-zinc-200">
            Interact with the surface—pointer movement, presses, holds, and keys fuel both visuals and the upcoming AI conductor.
          </p>
        </header>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
            onClick={() => {
              setStarted(true);
              if (overlay !== undefined) {
                surfaceRef.current?.burstAt(overlay.focusX, overlay.focusY);
              }
            }}
          >
            {started ? "Running" : "Start capture"}
          </button>
          <button
            type="button"
            className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:border-white/60"
            onClick={() => {
              monitor.stop();
              setStarted(false);
            }}
          >
            Stop
          </button>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200">
            AI feedback queue: {pendingEvents}
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card title="Instant signal (per frame)">
            {overlay ? (
              <MetricList
                items={[
                  ["energy", overlay.energy],
                  ["chaos", overlay.chaos],
                  ["density", overlay.density],
                  ["focusX", overlay.focusX],
                  ["focusY", overlay.focusY],
                  ["hold", overlay.hold],
                  ["keypressRate", overlay.keypressRate],
                ]}
              />
            ) : (
              <Placeholder />
            )}
          </Card>

          <Card title="Snapshot (5s window)">
            {snapshot ? (
              <MetricList
                items={[
                  ["energy", snapshot.energy],
                  ["chaos", snapshot.chaos],
                  ["density", snapshot.density],
                  ["focusX", snapshot.focusX],
                  ["focusY", snapshot.focusY],
                  ["rhythmIntent", snapshot.rhythmIntent],
                ]}
              />
            ) : (
              <Placeholder />
            )}
          </Card>
        </section>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-zinc-200">
          Visual feedback: spark field reacts to speed and chaos, rings pulse on interaction, and tetra emotes pop on key impulses.
          AI queue counts raw interaction events for the conductor loop.
        </div>
      </main>
    </div>
  );
}

function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/30">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{props.title}</h2>
      </div>
      <div className="mt-3">{props.children}</div>
    </div>
  );
}

function MetricList(props: { items: Array<[string, number]> }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      {props.items.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
          <span className="text-zinc-300">{label}</span>
          <span className="font-mono text-white">{value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function Placeholder() {
  return <div className="text-sm text-zinc-400">No data yet. Hit &quot;Start capture&quot; then move / type.</div>;
}
