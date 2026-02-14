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
  const count = 1400;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 7.2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 4.6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;

    velocities[i * 3] = (Math.random() - 0.5) * 0.0012;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0012;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0006;
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
    const energyBoost = 0.003 + input.energy * 0.014;
    const chaosJitter = input.chaos * 0.008;
    const pullX = (input.focusX - 0.5) * 0.0025;
    const pullY = (0.5 - input.focusY) * 0.0025;
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

      velocities[vxIndex] *= 0.994;
      velocities[vyIndex] *= 0.994;
      velocities[vzIndex] *= 0.994;

      const limitX = 3.6;
      const limitY = 2.3;
      if (positions[vxIndex] > limitX || positions[vxIndex] < -limitX) {
        velocities[vxIndex] *= -1;
      }
      if (positions[vyIndex] > limitY || positions[vyIndex] < -limitY) {
        velocities[vyIndex] *= -1;
      }
    }

    if (material instanceof THREE.PointsMaterial) {
      material.size = 0.012 + input.hold * 0.06 + input.density * 0.018;
      material.color.setHSL(
        input.colorHue / 360,
        0.55 + input.density * 0.25,
        0.55 + input.hold * 0.25,
      );
      material.opacity = 0.4 + input.density * 0.35 + input.energy * 0.15;
    }

    geometry.attributes.position.needsUpdate = true;
  };

  return { points, positions, velocities, update, dispose };
}
