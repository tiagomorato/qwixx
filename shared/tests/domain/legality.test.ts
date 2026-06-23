import { describe, expect, it } from 'bun:test';
import { lock, mark } from '../../src/domain/actions.ts';
import { createGame } from '../../src/domain/createGame.ts';
import { gameShouldEnd, isCellMarkable, isRowLockable } from '../../src/domain/legality.ts';
import type { GameState } from '../../src/types/game.ts';

const now = () => '2026-05-27T12:00:00.000Z';
let n = 0;
const id = () => `id-${++n}`;

function fresh(): GameState {
  n = 0;
  return createGame([{ name: 'A' }, { name: 'B' }], { now, idGen: id });
}

describe('isCellMarkable', () => {
  it('returns true for an unmarked cell with no later marks', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    expect(isCellMarkable(game, p.id, 'red', 0)).toBe(true);
  });

  it('returns false for an already-marked cell', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    const next = mark(game, p.id, 'red', 3, now);
    expect(isCellMarkable(next, p.id, 'red', 3)).toBe(false);
  });

  it('returns false for a cell to the left of an already-marked cell in same row', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    const next = mark(game, p.id, 'red', 5, now);
    expect(isCellMarkable(next, p.id, 'red', 4)).toBe(false);
    expect(isCellMarkable(next, p.id, 'red', 6)).toBe(true);
  });

  it('returns false when the color is globally locked', () => {
    const game = fresh();
    const locked: GameState = { ...game, globalLocks: { ...game.globalLocks, red: true } };
    const p = locked.players[0];
    if (!p) throw new Error();
    expect(isCellMarkable(locked, p.id, 'red', 0)).toBe(false);
  });

  it('returns false for an unknown cell index', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    expect(isCellMarkable(game, p.id, 'red', 99)).toBe(false);
  });
});

describe('isRowLockable', () => {
  function with5Marks(game: GameState, playerId: string): GameState {
    let g = game;
    for (let i = 0; i < 5; i += 1) g = mark(g, playerId, 'red', i, now);
    return g;
  }

  it('returns false when there are fewer than 5 marks', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    expect(isRowLockable(game, p.id, 'red')).toBe(false);
  });

  it('returns true when there are at least 5 marks and color not globally locked', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    const ready = with5Marks(game, p.id);
    expect(isRowLockable(ready, p.id, 'red')).toBe(true);
  });

  it('still returns true right after another player closes the color', () => {
    const game = fresh();
    const a = game.players[0];
    const b = game.players[1];
    if (!a || !b) throw new Error();
    // Player A closes red; player B has 5 marks and has not acted since, so B
    // still gets their one-time chance to close it too.
    const ready = with5Marks(with5Marks(game, a.id), b.id);
    const closed = lock(ready, a.id, 'red', now);
    expect(closed.globalLocks.red).toBe(true);
    expect(isRowLockable(closed, b.id, 'red')).toBe(true);
  });

  it('grays out the color once the player acts on something else', () => {
    const game = fresh();
    const a = game.players[0];
    const b = game.players[1];
    if (!a || !b) throw new Error();
    const ready = with5Marks(with5Marks(game, a.id), b.id);
    const closed = lock(ready, a.id, 'red', now);
    // B passes up the chance and ticks a different color instead.
    const afterOtherMark = mark(closed, b.id, 'yellow', 0, now);
    expect(isRowLockable(afterOtherMark, b.id, 'red')).toBe(false);
  });

  it('keeps each player’s chance independent', () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }, { name: 'C' }], { now, idGen: id });
    const [a, b, c] = game.players;
    if (!a || !b || !c) throw new Error();
    let g = with5Marks(with5Marks(with5Marks(game, a.id), b.id), c.id);
    g = lock(g, a.id, 'red', now);
    // B acts elsewhere and loses the chance; C has not acted and keeps it.
    g = mark(g, b.id, 'yellow', 0, now);
    expect(isRowLockable(g, b.id, 'red')).toBe(false);
    expect(isRowLockable(g, c.id, 'red')).toBe(true);
  });

  it('returns false when the player has already locked the row', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    const ready = with5Marks(game, p.id);
    const lockedRow: GameState = {
      ...ready,
      players: ready.players.map((pl) =>
        pl.id === p.id
          ? { ...pl, rows: pl.rows.map((r) => (r.color === 'red' ? { ...r, locked: true } : r)) }
          : pl,
      ),
    };
    expect(isRowLockable(lockedRow, p.id, 'red')).toBe(false);
  });
});

describe('gameShouldEnd', () => {
  it('is true when 2 or more colors are globally locked', () => {
    const game = fresh();
    const locked: GameState = {
      ...game,
      globalLocks: { ...game.globalLocks, red: true, green: true },
    };
    expect(gameShouldEnd(locked)).toBe(true);
  });

  it('is true when any player has 4 penalties', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    const penalized: GameState = {
      ...game,
      players: game.players.map((pl) => (pl.id === p.id ? { ...pl, penalties: 4 } : pl)),
    };
    expect(gameShouldEnd(penalized)).toBe(true);
  });

  it('is false for a fresh game', () => {
    expect(gameShouldEnd(fresh())).toBe(false);
  });
});
