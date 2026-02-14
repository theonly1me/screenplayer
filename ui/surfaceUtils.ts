import * as THREE from "three";

const worldWidth = 3.6;
const worldHeight = 2.3;

export function toWorldPosition(x: number, y: number): THREE.Vector3 {
  const px = (x - 0.5) * worldWidth;
  const py = (0.5 - y) * worldHeight;
  return new THREE.Vector3(px, py, 0);
}

export function createGrid(): null {
  return null;
}
