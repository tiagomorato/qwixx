import { describe, expect, it } from 'bun:test';
import { finalize } from '../../src/domain/actions.ts';
import { createGame } from '../../src/domain/createGame.ts';

const now = () => '2026-05-27T13:00:00.000Z';

describe('finalize', () => {
  it('marks the game completed and stamps endedAt', () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }], { now });
    const ended = finalize(game, () => '2026-05-27T14:00:00.000Z');
    expect(ended.status).toBe('completed');
    expect(ended.endedAt).toBe('2026-05-27T14:00:00.000Z');
  });

  it('is idempotent on an already-completed game', () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }], { now });
    const once = finalize(game, () => '2026-05-27T14:00:00.000Z');
    const twice = finalize(once, () => '2026-05-27T15:00:00.000Z');
    expect(twice.endedAt).toBe('2026-05-27T14:00:00.000Z');
  });
});
