import * as THREE from "three";
import { VisualInput } from "./surfaceTypes";
import { toWorldPosition } from "./surfaceUtils";

type Emote = {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  spin: number;
};

export type EmoteSystem = {
  spawn: (x: number, y: number, intensity: number, hue: number) => void;
  update: (deltaMs: number, input: VisualInput) => void;
  dispose: () => void;
};

export function createEmoteSystem(scene: THREE.Scene): EmoteSystem {
  let emotes: Emote[] = [];

  const spawn = (x: number, y: number, intensity: number, hue: number): void => {
    const geo = new THREE.TetrahedronGeometry(0.05 + intensity * 0.08);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue / 360, 0.8, 0.6),
      emissive: new THREE.Color().setHSL(hue / 360, 0.6, 0.4 + intensity * 0.2),
      metalness: 0.1,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const pos = toWorldPosition(x, y);
    mesh.position.set(pos.x, pos.y, 0.2);
    scene.add(mesh);
    emotes.push({ mesh, life: 1.2, maxLife: 1.2, spin: 0.003 + intensity * 0.01 });
  };

  const update = (deltaMs: number, input: VisualInput): void => {
    const next: Emote[] = [];
    for (const emote of emotes) {
      emote.life -= deltaMs / 1000;
      if (emote.life <= 0) {
        scene.remove(emote.mesh);
        continue;
      }
      const t = emote.life / emote.maxLife;
      emote.mesh.rotation.x += emote.spin * deltaMs;
      emote.mesh.rotation.y += emote.spin * 1.4 * deltaMs;
      const material = emote.mesh.material;
      if (material instanceof THREE.MeshStandardMaterial) {
        material.opacity = t;
        material.emissiveIntensity = 0.6 + (1 - t) * 0.8;
        material.color.setHSL(input.colorHue / 360, 0.8, 0.6);
      }
      emote.mesh.position.z = 0.2 + (1 - t) * 0.4;
      next.push(emote);
    }
    emotes = next;
  };

  const dispose = (): void => {
    for (const emote of emotes) {
      scene.remove(emote.mesh);
      emote.mesh.geometry.dispose();
      const material = emote.mesh.material;
      if (material instanceof THREE.Material) {
        material.dispose();
      }
    }
    emotes = [];
  };

  return { spawn, update, dispose };
}
