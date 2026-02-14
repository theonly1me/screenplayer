import * as THREE from "three";
import { VisualInput } from "./surfaceTypes";

export type ParticleSystem = {
  points: THREE.Points;
  positions: Float32Array;
  velocities: Float32Array;
  update: (input: VisualInput, deltaMs: number) => void;
  dispose: () => void;
};

export function createParticleSystem(scene: THREE.Scene): ParticleSystem {
  const count = 800;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 2.5;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

    velocities[i * 3] = (Math.random() - 0.5) * 0.001;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0004;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.02,
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const dispose = (): void => {
    scene.remove(points);
    geometry.dispose();
    material.dispose();
  };

  const update = (input: VisualInput, deltaMs: number): void => {
    const energyBoost = 0.002 + input.energy * 0.01;
    const chaosJitter = input.chaos * 0.006;
    const pullX = (input.focusX - 0.5) * 0.002;
    const pullY = (0.5 - input.focusY) * 0.002;
    const countPoints = positions.length / 3;

    for (let i = 0; i < countPoints; i += 1) {
      const vxIndex = i * 3;
      const vyIndex = vxIndex + 1;
      const vzIndex = vxIndex + 2;

      velocities[vxIndex] += (Math.random() - 0.5) * chaosJitter + pullX;
      velocities[vyIndex] += (Math.random() - 0.5) * chaosJitter + pullY;
      velocities[vzIndex] += (Math.random() - 0.5) * chaosJitter * 0.2;

      positions[vxIndex] += velocities[vxIndex] * deltaMs * energyBoost;
      positions[vyIndex] += velocities[vyIndex] * deltaMs * energyBoost;
      positions[vzIndex] += velocities[vzIndex] * deltaMs * energyBoost;

      velocities[vxIndex] *= 0.995;
      velocities[vyIndex] *= 0.995;
      velocities[vzIndex] *= 0.995;

      const limitX = 1.6;
      const limitY = 1.1;
      if (positions[vxIndex] > limitX || positions[vxIndex] < -limitX) {
        velocities[vxIndex] *= -1;
      }
      if (positions[vyIndex] > limitY || positions[vyIndex] < -limitY) {
        velocities[vyIndex] *= -1;
      }
    }

    if (material instanceof THREE.PointsMaterial) {
      material.size = 0.015 + input.hold * 0.05 + input.density * 0.015;
      material.color.setHSL(input.colorHue / 360, 0.7, 0.65 + input.hold * 0.1);
      material.opacity = 0.5 + input.density * 0.3;
    }

    geometry.attributes.position.needsUpdate = true;
  };

  return { points, positions, velocities, update, dispose };
}
