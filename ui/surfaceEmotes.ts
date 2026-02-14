import * as THREE from "three";
import { toWorldPosition } from "./surfaceUtils";

type Emote = {
  sprite: THREE.Sprite;
  life: number;
  maxLife: number;
  hue: number;
};

const EMOJIS = ["✨", "🎵", "🎧", "💫", "🌟", "🔥", "🎶"];

export type EmoteSystem = {
  spawn: (x: number, y: number, intensity: number) => void;
  update: (deltaMs: number) => void;
  dispose: () => void;
};

export function createEmoteSystem(scene: THREE.Scene): EmoteSystem {
  let emotes: Emote[] = [];

  const spawn = (x: number, y: number, intensity: number): void => {
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const hue = Math.random() * 360;
    const texture = makeEmojiTexture(emoji, hue);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    const base = 0.16 + intensity * 0.22;
    sprite.scale.set(base, base, 1);
    const pos = toWorldPosition(Math.random(), Math.random());
    sprite.position.set(pos.x, pos.y, 0.25);
    scene.add(sprite);
    emotes.push({
      sprite,
      life: 1.4,
      maxLife: 1.4,
      hue,
    });
  };

  const update = (deltaMs: number): void => {
    const next: Emote[] = [];
    for (const emote of emotes) {
      emote.life -= deltaMs / 1000;
      if (emote.life <= 0) {
        scene.remove(emote.sprite);
        emote.sprite.material.dispose();
        emote.sprite.material.map?.dispose();
        continue;
      }
      const t = emote.life / emote.maxLife;
      emote.sprite.material.opacity = t * 0.95;
      const shrink = 0.4 + t * 0.6;
      emote.sprite.scale.setScalar(0.08 + shrink * 0.28);
      emote.sprite.position.z = 0.2 + (1 - t) * 0.45;
      next.push(emote);
    }
    emotes = next;
  };

  const dispose = (): void => {
    for (const emote of emotes) {
      scene.remove(emote.sprite);
      emote.sprite.material.dispose();
      emote.sprite.material.map?.dispose();
    }
    emotes = [];
  };

  return { spawn, update, dispose };
}

function makeEmojiTexture(char: string, hue: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx !== null) {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#ffffff00";
    ctx.fillRect(0, 0, size, size);
    ctx.font = "96px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `hsl(${hue},75%,55%)`;
    ctx.fillText(char, size / 2, size / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
