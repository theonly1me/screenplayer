import * as THREE from "three";
import { FrameSignal } from "../interaction/metrics";
import { createEmoteSystem, EmoteSystem } from "./surfaceEmotes";
import { createParticleSystem, ParticleSystem } from "./surfaceParticles";
import { createRippleSystem, RippleSystem } from "./surfaceRipples";
import { createGrid } from "./surfaceUtils";
import { signalToVisualInput, VisualInput } from "./surfaceTypes";

type SurfaceState = {
  renderer: THREE.WebGLRenderer | undefined;
  scene: THREE.Scene | undefined;
  camera: THREE.PerspectiveCamera | undefined;
  particles: ParticleSystem | undefined;
  ripples: RippleSystem | undefined;
  emotes: EmoteSystem | undefined;
  lastTime: number | undefined;
  lastRippleAt: number | undefined;
  running: boolean;
  input: VisualInput;
  rafId: number | undefined;
};

export type ThreeSurface = {
  init: () => void;
  applySignal: (signal: FrameSignal) => void;
  burstAt: (x: number, y: number) => void;
  dispose: () => void;
};

export function createThreeSurface(
  canvas: HTMLCanvasElement | undefined,
): ThreeSurface {
  const state: SurfaceState = {
    renderer: undefined,
    scene: undefined,
    camera: undefined,
    particles: undefined,
    ripples: undefined,
    emotes: undefined,
    lastTime: undefined,
    lastRippleAt: undefined,
    running: false,
    rafId: undefined,
    input: {
      energy: 0,
      chaos: 0,
      hold: 0,
      density: 0,
      focusX: 0.5,
      focusY: 0.5,
      colorHue: 200,
      keypressRate: 0,
    },
  };

  const handleResize = (): void => {
    if (state.renderer === undefined || state.camera === undefined) {
      return;
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    state.renderer.setSize(width, height);
    state.camera.aspect = width / height;
    state.camera.updateProjectionMatrix();
  };

  const loop = (): void => {
    if (
      !state.running ||
      state.renderer === undefined ||
      state.scene === undefined ||
      state.camera === undefined
    ) {
      return;
    }
    const now = performance.now();
    const deltaMs = state.lastTime === undefined ? 16 : now - state.lastTime;
    state.lastTime = now;

    state.particles?.update(state.input, deltaMs);
    state.ripples?.update(deltaMs, state.input);
    state.emotes?.update(deltaMs);

    state.renderer.render(state.scene, state.camera);
  };

  const init = (): void => {
    if (state.running) {
      return;
    }
    if (canvas === undefined) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer = renderer;

    const scene = new THREE.Scene();
    state.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      20,
    );
    camera.position.z = 3.2;
    state.camera = camera;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.PointLight(0x88ccff, 1.2, 6);
    keyLight.position.set(0, 1.2, 2);
    scene.add(keyLight);
    const grid = createGrid();
    if (grid !== null) {
      scene.add(grid);
    }

    state.particles = createParticleSystem(scene);
    state.ripples = createRippleSystem(scene);
    state.emotes = createEmoteSystem(scene);

    window.addEventListener("resize", handleResize);
    state.lastTime = performance.now();
    const step = (): void => {
      loop();
      state.rafId = requestAnimationFrame(step);
    };
    state.rafId = requestAnimationFrame(step);
    state.running = true;
  };

  const applySignal = (signal: FrameSignal): void => {
    state.input = signalToVisualInput(signal);
    const boost = signal.pointerSpeed + signal.keypressRate * 0.5;
    const now = performance.now();
    const canRipple =
      boost > 0.22 &&
      (state.lastRippleAt === undefined || now - state.lastRippleAt > 90);
    if (canRipple) {
      state.ripples?.spawn(
        state.input.focusX,
        state.input.focusY,
        boost * 0.8,
        state.input.colorHue,
      );
      state.lastRippleAt = now;
    }
    if (signal.keypressRate > 0.05 || boost > 0.35) {
      state.emotes?.spawn(
        state.input.focusX,
        state.input.focusY,
        Math.min(0.8, boost),
      );
    }
  };

  const burstAt = (x: number, y: number): void => {
    state.ripples?.spawn(x, y, 0.6, state.input.colorHue);
    state.emotes?.spawn(x, y, 0.4);
  };

  const dispose = (): void => {
    window.removeEventListener("resize", handleResize);
    if (state.renderer !== undefined) {
      state.renderer.dispose();
    }
    if (state.rafId !== undefined) {
      cancelAnimationFrame(state.rafId);
    }
    state.particles?.dispose();
    state.ripples?.dispose();
    state.emotes?.dispose();
    state.renderer = undefined;
    state.scene = undefined;
    state.camera = undefined;
    state.particles = undefined;
    state.ripples = undefined;
    state.emotes = undefined;
    state.running = false;
    state.rafId = undefined;
  };

  return { init, applySignal, burstAt, dispose };
}
