import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createGame } from '@qwixx/shared';
import type { GameState } from '@qwixx/shared';
import { appendCompleted } from '../../src/storage/historyRepo.ts';
import { dispatch, setupDataDir } from '../helpers/testServer.ts';

let env: ReturnType<typeof setupDataDir>;
beforeEach(() => {
  env = setupDataDir();
});
afterEach(() => env.cleanup());

function completed(name: string, idGen: () => string): GameState {
  const game = createGame([{ name }, { name: `${name}-opp` }], { idGen });
  return { ...game, status: 'completed', endedAt: '2026-05-27T18:00:00.000Z' };
}

describe('GET /api/history', () => {
  it('returns an empty list when no history file exists', async () => {
    const res = await dispatch(new Request('http://x/api/history'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ games: [] });
  });

  it('returns games most-recent first and caps at MAX_HISTORY (10)', async () => {
    let n = 0;
    const idGen = () => `id-${++n}`;
    for (let i = 0; i < 12; i += 1) {
      await appendCompleted(completed(`Player ${i}`, idGen));
    }
    const res = await dispatch(new Request('http://x/api/history'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { games: GameState[] };
    expect(body.games).toHaveLength(10);
    expect(body.games[0]?.players[0]?.name).toBe('Player 11');
    expect(body.games.at(-1)?.players[0]?.name).toBe('Player 2');
  });
});
