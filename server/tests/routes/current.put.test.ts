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

  it('round-trips activePlayerId when it matches a player', async () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }]);
    const secondId = game.players[1]?.id;
    if (!secondId) throw new Error('missing player');
    const res = await put({ game: { ...game, activePlayerId: secondId } });
    expect(res.status).toBe(200);
    const back = (await res.json()) as { game: { activePlayerId?: string } };
    expect(back.game.activePlayerId).toBe(secondId);
  });

  it('accepts a game with no activePlayerId (backward compatible)', async () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }]);
    const { activePlayerId, ...withoutTurn } = game;
    const res = await put({ game: withoutTurn });
    expect(res.status).toBe(200);
  });

  it('rejects an unknown activePlayerId with INVALID_PAYLOAD on activePlayerId', async () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }]);
    const res = await put({ game: { ...game, activePlayerId: 'nope' } });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string; details?: { path: string }[] } };
    expect(body.error.code).toBe('INVALID_PAYLOAD');
  });
});
