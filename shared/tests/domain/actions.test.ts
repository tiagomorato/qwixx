import { describe, expect, it } from 'bun:test';
import { lock, mark, penalty } from '../../src/domain/actions.ts';
import { createGame } from '../../src/domain/createGame.ts';

const now = () => '2026-05-27T12:00:00.000Z';
let n = 0;
const id = () => `id-${++n}`;

function fresh() {
  n = 0;
  return createGame([{ name: 'A' }, { name: 'B' }], { now, idGen: id });
}

describe('mark', () => {
  it('sets the cell to marked and appends a mark entry', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    const next = mark(game, p.id, 'red', 2, now);
    const row = next.players.find((pl) => pl.id === p.id)?.rows.find((r) => r.color === 'red');
    expect(row?.cells[2]?.marked).toBe(true);
    expect(next.actionLog).toHaveLength(1);
    expect(next.actionLog[0]?.kind).toBe('mark');
  });

  it('throws on illegal marks', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    const after = mark(game, p.id, 'red', 5, now);
    expect(() => mark(after, p.id, 'red', 4, now)).toThrow();
  });

  it('does not mutate the input', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    const before = JSON.stringify(game);
    mark(game, p.id, 'red', 0, now);
    expect(JSON.stringify(game)).toBe(before);
  });
});

describe('lock', () => {
  it('sets row.locked and globalLocks[color] and appends a lock entry', () => {
    let game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    for (let i = 0; i < 5; i += 1) game = mark(game, p.id, 'red', i, now);
    const locked = lock(game, p.id, 'red', now);
    const row = locked.players.find((pl) => pl.id === p.id)?.rows.find((r) => r.color === 'red');
    expect(row?.locked).toBe(true);
    expect(row?.cells[10]?.marked).toBe(true);
    expect(locked.globalLocks.red).toBe(true);
    expect(locked.actionLog.at(-1)?.kind).toBe('lock');
  });

  it('throws if the player has fewer than 5 marks in the row', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    expect(() => lock(game, p.id, 'red', now)).toThrow();
  });

  it('lets a second player close a color already closed by another player', () => {
    let game = fresh();
    const a = game.players[0];
    const b = game.players[1];
    if (!a || !b) throw new Error();
    for (let i = 0; i < 5; i += 1) game = mark(game, a.id, 'red', i, now);
    for (let i = 0; i < 5; i += 1) game = mark(game, b.id, 'red', i, now);
    game = lock(game, a.id, 'red', now);
    // B can still close red right after A did.
    const after = lock(game, b.id, 'red', now);
    const aRow = after.players.find((pl) => pl.id === a.id)?.rows.find((r) => r.color === 'red');
    const bRow = after.players.find((pl) => pl.id === b.id)?.rows.find((r) => r.color === 'red');
    expect(aRow?.locked).toBe(true);
    expect(bRow?.locked).toBe(true);
    expect(after.globalLocks.red).toBe(true);
    expect(after.actionLog.filter((e) => e.kind === 'lock')).toHaveLength(2);
  });

  it('throws if the same player tries to close a row they already closed', () => {
    let game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    for (let i = 0; i < 5; i += 1) game = mark(game, p.id, 'red', i, now);
    const locked = lock(game, p.id, 'red', now);
    expect(() => lock(locked, p.id, 'red', now)).toThrow();
  });
});

describe('penalty', () => {
  it('increments the player penalty and appends a penalty entry', () => {
    const game = fresh();
    const p = game.players[0];
    if (!p) throw new Error();
    const next = penalty(game, p.id, now);
    expect(next.players.find((pl) => pl.id === p.id)?.penalties).toBe(1);
    expect(next.actionLog.at(-1)?.kind).toBe('penalty');
  });
});
