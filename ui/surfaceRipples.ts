import * as THREE from "three";
import { VisualInput } from "./surfaceTypes";
import { toWorldPosition } from "./surfaceUtils";

type Ripple = {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
};

export type RippleSystem = {
  spawn: (x: number, y: number, magnitude: number, hue: number) => void;
  update: (deltaMs: number, input: VisualInput) => void;
  dispose: () => void;
};

export function createRippleSystem(scene: THREE.Scene): RippleSystem {
  let ripples: Ripple[] = [];

  const spawn = (x: number, y: number, magnitude: number, hue: number): void => {
    const ringGeo = new THREE.RingGeometry(0.01, 0.08, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue / 360, 0.7, 0.7),
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(ringGeo, ringMat);
    const pos = toWorldPosition(x, y);
    mesh.position.set(pos.x, pos.y, 0);
    scene.add(mesh);
    ripples.push({ mesh, life: magnitude, maxLife: magnitude + 0.8 });
  };

  const update = (deltaMs: number, input: VisualInput): void => {
    const next: Ripple[] = [];
    for (const ripple of ripples) {
      ripple.life -= deltaMs / 1200;
      const t = ripple.life / ripple.maxLife;
      if (ripple.life <= 0) {
        scene.remove(ripple.mesh);
        continue;
      }
      const scale = 1 + (1 - t) * 3;
      ripple.mesh.scale.set(scale, scale, 1);
      const material = ripple.mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = t * 0.8;
        material.color.setHSL(input.colorHue / 360, 0.7, 0.7);
      }
      next.push(ripple);
    }
    ripples = next;
  };

  const dispose = (): void => {
    for (const ripple of ripples) {
      scene.remove(ripple.mesh);
      ripple.mesh.geometry.dispose();
      const material = ripple.mesh.material;
      if (material instanceof THREE.Material) {
        material.dispose();
      }
    }
    ripples = [];
  };

  return { spawn, update, dispose };
}
