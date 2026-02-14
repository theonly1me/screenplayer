export type InteractionEventType = "pointerMove" | "pointerDown" | "pointerUp" | "keyPress";

export type InteractionEvent = {
  type: InteractionEventType;
  timestamp: number;
  x: number | undefined;
  y: number | undefined;
  key: string | undefined;
  speed: number | undefined;
  isDown: boolean | undefined;
};

const pendingEvents: InteractionEvent[] = [];
const maxEvents = 512;

export function pushInteractionEvent(event: InteractionEvent): void {
  pendingEvents.push(event);
  if (pendingEvents.length > maxEvents) {
    pendingEvents.shift();
  }
}

export function readInteractionEvents(): InteractionEvent[] {
  return pendingEvents.slice();
}

export function drainInteractionEvents(): InteractionEvent[] {
  const copy = pendingEvents.slice();
  pendingEvents.length = 0;
  return copy;
}
