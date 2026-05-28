import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createGame } from '@qwixx/shared';
import { dispatch, setupDataDir } from '../helpers/testServer.ts';

let env: ReturnType<typeof setupDataDir>;
beforeEach(() => {
  env = setupDataDir();
});
afterEach(() => env.cleanup());

function put(body: unknown): Promise<Response> {
  return dispatch(
    new Request('http://x/api/current', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('PUT /api/current', () => {
  it('creates a current game with status=in-progress', async () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }]);
    const res = await put({ game });
    expect(res.status).toBe(200);
    const back = (await res.json()) as { game: { id: string } };
    expect(back.game.id).toBe(game.id);
  });

  it('replaces a current game with the same id', async () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }]);
    await put({ game });
    const res = await put({ game: { ...game, players: [...game.players] } });
    expect(res.status).toBe(200);
  });

  it('returns 409 when a different game id is already in progress', async () => {
    const a = createGame([{ name: 'A' }, { name: 'B' }]);
    await put({ game: a });
    const b = createGame([{ name: 'C' }, { name: 'D' }]);
    const res = await put({ game: b });
    expect(res.status).toBe(409);
  });

  it('returns 400 on invalid payload', async () => {
    const res = await put({ game: { not: 'valid' } });
    expect(res.status).toBe(400);
  });
});
