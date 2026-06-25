import { describe, expect, it } from 'bun:test';
import { createGame } from '@qwixx/shared';
import { broadcastCurrent, subscribe } from '../../src/realtime/hub.ts';

const decoder = new TextDecoder();

async function readFrame(reader: {
  read(): Promise<{ done: boolean; value?: Uint8Array | undefined }>;
}): Promise<string> {
  const { value } = await reader.read();
  return value ? decoder.decode(value) : '';
}

describe('realtime hub', () => {
  it('sends the initial state as the first frame on subscribe', async () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }]);
    const res = subscribe(game);
    expect(res.headers.get('content-type')).toBe('text/event-stream');

    const reader = (res.body as ReadableStream<Uint8Array>).getReader();
    const frame = await readFrame(reader);
    expect(frame).toBe(`data: ${JSON.stringify({ game })}\n\n`);
    await reader.cancel();
  });

  it('delivers broadcasts to every subscriber', async () => {
    const a = (subscribe(null).body as ReadableStream<Uint8Array>).getReader();
    const b = (subscribe(null).body as ReadableStream<Uint8Array>).getReader();
    // Drain the initial null frame from both.
    expect(await readFrame(a)).toBe(`data: ${JSON.stringify({ game: null })}\n\n`);
    expect(await readFrame(b)).toBe(`data: ${JSON.stringify({ game: null })}\n\n`);

    const game = createGame([{ name: 'A' }, { name: 'B' }]);
    broadcastCurrent(game);

    const expected = `data: ${JSON.stringify({ game })}\n\n`;
    expect(await readFrame(a)).toBe(expected);
    expect(await readFrame(b)).toBe(expected);
    await a.cancel();
    await b.cancel();
  });
});
