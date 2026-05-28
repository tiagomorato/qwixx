import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createGame } from '@qwixx/shared';
import { appendCompleted } from '../../src/storage/historyRepo.ts';
import { dispatch, setupDataDir } from '../helpers/testServer.ts';

let env: ReturnType<typeof setupDataDir>;
beforeEach(() => {
  env = setupDataDir();
});
afterEach(() => env.cleanup());

describe('GET /api/history/:id', () => {
  it('returns 404 for a missing game id', async () => {
    const res = await dispatch(new Request('http://x/api/history/missing-id'));
    expect(res.status).toBe(404);
  });

  it('returns 200 with the matching game', async () => {
    const game = createGame([{ name: 'Z' }, { name: 'Y' }]);
    const completed = {
      ...game,
      status: 'completed' as const,
      endedAt: '2026-05-27T18:00:00.000Z',
    };
    await appendCompleted(completed);
    const res = await dispatch(new Request(`http://x/api/history/${game.id}`));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { game: { id: string } };
    expect(body.game.id).toBe(game.id);
  });
});
