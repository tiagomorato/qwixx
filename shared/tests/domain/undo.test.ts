import { describe, expect, it } from 'bun:test';
import { lock, mark, penalty } from '../../src/domain/actions.ts';
import { createGame } from '../../src/domain/createGame.ts';
import { undo } from '../../src/domain/undo.ts';

const now = () => '2026-05-27T12:00:00.000Z';
let n = 0;
const id = () => `id-${++n}`;

function fresh() {
  n = 0;
  return createGame([{ name: 'A' }, { name: 'B' }], { now, idGen: id });
}

describe('undo', () => {
  it('is a no-op on an empty action log', () => {
    const game = fresh();
    expect(undo(game)).toEqual(game);
  });

  it('reverses the most recent mark', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    const marked = mark(game, p.id, 'red', 4, now);
    const reverted = undo(marked);
    const row = reverted.players.find((pl) => pl.id === p.id)?.rows.find((r) => r.color === 'red');
    expect(row?.cells[4]?.marked).toBe(false);
    expect(reverted.actionLog).toHaveLength(0);
  });

  it('reverses a penalty', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    const after = penalty(game, p.id, now);
    const reverted = undo(after);
    expect(reverted.players.find((pl) => pl.id === p.id)?.penalties).toBe(0);
    expect(reverted.actionLog).toHaveLength(0);
  });

  it('reverses a lock, clearing the rightmost mark and releasing the global lock', () => {
    let game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    for (let i = 0; i < 5; i += 1) game = mark(game, p.id, 'red', i, now);
    const locked = lock(game, p.id, 'red', now);
    expect(locked.globalLocks.red).toBe(true);
    const reverted = undo(locked);
    expect(reverted.globalLocks.red).toBe(false);
    const row = reverted.players.find((pl) => pl.id === p.id)?.rows.find((r) => r.color === 'red');
    expect(row?.locked).toBe(false);
    expect(row?.cells[10]?.marked).toBe(false);
    // The 5 prior marks remain
    for (let i = 0; i < 5; i += 1) expect(row?.cells[i]?.marked).toBe(true);
  });

  it('only reverses one entry', () => {
    let game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    game = mark(game, p.id, 'red', 0, now);
    game = mark(game, p.id, 'red', 1, now);
    game = mark(game, p.id, 'red', 2, now);
    const reverted = undo(game);
    const row = reverted.players.find((pl) => pl.id === p.id)?.rows.find((r) => r.color === 'red');
    expect(row?.cells[0]?.marked).toBe(true);
    expect(row?.cells[1]?.marked).toBe(true);
    expect(row?.cells[2]?.marked).toBe(false);
    expect(reverted.actionLog).toHaveLength(2);
  });
});
