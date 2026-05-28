import { describe, expect, it } from 'bun:test';
import { MAX_HISTORY, createGame } from '@qwixx/shared';
import { appendCompleted, readHistory } from '../../src/storage/historyRepo.ts';
import { setupDataDir } from '../helpers/testServer.ts';

describe('history capping', () => {
  it('keeps only the MAX_HISTORY most recent completed games and orders them newest-first', async () => {
    const env = setupDataDir();
    try {
      let n = 0;
      for (let i = 0; i < MAX_HISTORY + 5; i += 1) {
        const game = createGame([{ name: `P${i}` }], { idGen: () => `id-${++n}` });
        await appendCompleted({
          ...game,
          status: 'completed',
          endedAt: `2026-05-27T${String(i).padStart(2, '0')}:00:00.000Z`,
        });
      }
      const history = await readHistory();
      expect(history.games).toHaveLength(MAX_HISTORY);
      expect(history.games[0]?.players[0]?.name).toBe(`P${MAX_HISTORY + 4}`);
      expect(history.games.at(-1)?.players[0]?.name).toBe('P5');
    } finally {
      env.cleanup();
    }
  });
});
