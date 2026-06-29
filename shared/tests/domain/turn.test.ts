import { describe, expect, it } from 'bun:test';
import { createGame } from '../../src/domain/createGame.ts';
import { advanceTurn } from '../../src/domain/turn.ts';
import type { GameState } from '../../src/types/game.ts';

const now = () => '2026-06-29T12:00:00.000Z';
let n = 0;
const id = () => `id-${++n}`;

function fresh(count: number): GameState {
  n = 0;
  return createGame(
    Array.from({ length: count }, (_, i) => ({ name: `P${i + 1}` })),
    { now, idGen: id },
  );
}

describe('advanceTurn', () => {
  it('advances to the next player by position', () => {
    const game = fresh(3);
    const [p1, p2] = game.players;
    if (!p1 || !p2) throw new Error();
    expect(game.activePlayerId).toBe(p1.id);
    const next = advanceTurn(game);
    expect(next.activePlayerId).toBe(p2.id);
  });

  it('wraps from the last player back to the first', () => {
    const game = fresh(3);
    const [p1, , p3] = game.players;
    if (!p1 || !p3) throw new Error();
    const atLast = { ...game, activePlayerId: p3.id };
    const next = advanceTurn(atLast);
    expect(next.activePlayerId).toBe(p1.id);
  });

  it('is a safe no-op for a single player (wraps to itself)', () => {
    const game = fresh(2);
    const first = game.players[0];
    if (!first) throw new Error();
    const single: GameState = { ...game, players: [first], activePlayerId: first.id };
    const next = advanceTurn(single);
    expect(next.activePlayerId).toBe(first.id);
  });

  it('returns the game unchanged when completed', () => {
    const game = { ...fresh(3), status: 'completed' as const, endedAt: now() };
    const next = advanceTurn(game);
    expect(next).toBe(game);
  });

  it('normalises a missing activePlayerId to players[0]', () => {
    const game = fresh(3);
    const first = game.players[0];
    if (!first) throw new Error();
    const { activePlayerId, ...rest } = game;
    const next = advanceTurn(rest as GameState);
    expect(next.activePlayerId).toBe(first.id);
  });

  it('normalises an unknown activePlayerId to players[0]', () => {
    const game = { ...fresh(3), activePlayerId: 'does-not-exist' };
    const first = game.players[0];
    if (!first) throw new Error();
    const next = advanceTurn(game);
    expect(next.activePlayerId).toBe(first.id);
  });

  it('is pure and does not append to the action log', () => {
    const game = fresh(3);
    const first = game.players[0];
    if (!first) throw new Error();
    const next = advanceTurn(game);
    expect(next).not.toBe(game);
    expect(next.actionLog).toEqual(game.actionLog);
    expect(game.activePlayerId).toBe(first.id); // input untouched
  });
});
