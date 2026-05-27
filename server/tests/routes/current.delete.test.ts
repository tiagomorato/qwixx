import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createGame } from '@qwixx/shared';
import { dispatch, setupDataDir } from '../helpers/testServer.ts';

let env: ReturnType<typeof setupDataDir>;
beforeEach(() => {
  env = setupDataDir();
});
afterEach(() => env.cleanup());

describe('DELETE /api/current', () => {
  it('returns 204 with no current game', async () => {
    const res = await dispatch(new Request('http://x/api/current', { method: 'DELETE' }));
    expect(res.status).toBe(204);
  });

  it('clears an existing current game', async () => {
    const game = createGame([{ name: 'A' }]);
    await dispatch(
      new Request('http://x/api/current', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ game }),
      }),
    );
    const del = await dispatch(new Request('http://x/api/current', { method: 'DELETE' }));
    expect(del.status).toBe(204);
    const get = await dispatch(new Request('http://x/api/current'));
    expect(await get.json()).toEqual({ game: null });
  });
});
