import * as THREE from "three";

export function toWorldPosition(x: number, y: number): THREE.Vector3 {
  const px = (x - 0.5) * 2.4;
  const py = (0.5 - y) * 1.6;
  return new THREE.Vector3(px, py, 0);
}

export function createGrid(): THREE.LineSegments {
  const lines: number[] = [];
  const steps = 10;
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps - 0.5) * 2;
    lines.push(-1.5, t, 0);
    lines.push(1.5, t, 0);
    lines.push(t, -1.0, 0);
    lines.push(t, 1.0, 0);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  const material = new THREE.LineBasicMaterial({ color: 0x303245, transparent: true, opacity: 0.35 });
  return new THREE.LineSegments(geometry, material);
}
