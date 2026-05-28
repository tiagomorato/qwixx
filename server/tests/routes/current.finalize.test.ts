import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createGame } from '@qwixx/shared';
import type { GameState } from '@qwixx/shared';
import { dispatch, setupDataDir } from '../helpers/testServer.ts';

let env: ReturnType<typeof setupDataDir>;
beforeEach(() => {
  env = setupDataDir();
});
afterEach(() => env.cleanup());

async function putGame(game: GameState): Promise<void> {
  await dispatch(
    new Request('http://x/api/current', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ game }),
    }),
  );
}

describe('POST /api/current/finalize', () => {
  it('returns 409 when no current game', async () => {
    const res = await dispatch(new Request('http://x/api/current/finalize', { method: 'POST' }));
    expect(res.status).toBe(409);
  });

  it('returns 409 when game has not reached an end condition', async () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }]);
    await putGame(game);
    const res = await dispatch(new Request('http://x/api/current/finalize', { method: 'POST' }));
    expect(res.status).toBe(409);
  });

  it('moves a finishable game to history, deletes current, returns it', async () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }]);
    const ended: GameState = {
      ...game,
      globalLocks: { red: true, yellow: true, green: false, blue: false },
    };
    await putGame(ended);
    const fin = await dispatch(new Request('http://x/api/current/finalize', { method: 'POST' }));
    expect(fin.status).toBe(200);
    const back = (await fin.json()) as { game: GameState };
    expect(back.game.status).toBe('completed');
    expect(back.game.endedAt).not.toBeNull();
    const current = await dispatch(new Request('http://x/api/current'));
    expect(await current.json()).toEqual({ game: null });
    const history = await dispatch(new Request('http://x/api/history'));
    const hist = (await history.json()) as { games: GameState[] };
    expect(hist.games[0]?.id).toBe(game.id);
  });
});
