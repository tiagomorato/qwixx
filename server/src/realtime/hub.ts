import type { GameState } from '@qwixx/shared';

// In-memory pub/sub for live current-game updates over Server-Sent Events.
// Each connected client owns one ReadableStream controller registered here;
// broadcastCurrent fans a state change out to all of them.

const encoder = new TextEncoder();
const HEARTBEAT_MS = 20_000;

const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();

function frame(game: GameState | null): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ game })}\n\n`);
}

export function subscribe(initial: GameState | null): Response {
  let self: ReadableStreamDefaultController<Uint8Array>;
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      self = controller;
      clients.add(controller);
      // Send the current state right away so a freshly-connected client is in
      // sync even if it missed a change between its initial GET and this open.
      controller.enqueue(frame(initial));
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          // Controller closed between ticks; cancel() will clean up.
        }
      }, HEARTBEAT_MS);
    },
    cancel() {
      clearInterval(heartbeat);
      clients.delete(self);
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}

export function broadcastCurrent(game: GameState | null): void {
  const bytes = frame(game);
  for (const controller of [...clients]) {
    try {
      controller.enqueue(bytes);
    } catch {
      clients.delete(controller);
    }
  }
}
