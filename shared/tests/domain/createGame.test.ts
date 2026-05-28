import { describe, expect, it } from 'bun:test';
import { createGame } from '../../src/domain/createGame.ts';

const fixedNow = () => '2026-05-27T12:00:00.000Z';
let counter = 0;
const seq = () => `id-${++counter}`;

describe('createGame', () => {
  it('creates a game with the requested number of players', () => {
    const game = createGame([{ name: 'Alice' }, { name: 'Bob' }, { name: 'Cara' }], {
      now: fixedNow,
      idGen: seq,
    });
    expect(game.players).toHaveLength(3);
    expect(game.players[0]?.name).toBe('Alice');
    expect(game.players[2]?.position).toBe(3);
  });

  it('trims player names and rejects empty names', () => {
    const game = createGame([{ name: '  Dee  ' }, { name: 'Eli' }], { now: fixedNow, idGen: seq });
    expect(game.players[0]?.name).toBe('Dee');
    expect(() => createGame([{ name: '   ' }, { name: 'B' }])).toThrow();
  });

  it('enforces 2..6 player count', () => {
    expect(() => createGame([])).toThrow();
    expect(() => createGame([{ name: 'Solo' }])).toThrow();
    expect(() => createGame(Array.from({ length: 7 }, (_, i) => ({ name: `P${i}` })))).toThrow();
    expect(createGame([{ name: 'A' }, { name: 'B' }]).players).toHaveLength(2);
    expect(
      createGame(Array.from({ length: 6 }, (_, i) => ({ name: `P${i}` }))).players,
    ).toHaveLength(6);
  });

  it('initializes red/yellow rows as 2..12 ascending and green/blue as 12..2 descending', () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }], { now: fixedNow, idGen: seq });
    const player = game.players[0];
    if (!player) throw new Error('missing player');
    const red = player.rows.find((r) => r.color === 'red');
    const blue = player.rows.find((r) => r.color === 'blue');
    expect(red?.cells.map((c) => c.value)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(blue?.cells.map((c) => c.value)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    expect(red?.cells.every((c) => !c.marked)).toBe(true);
  });

  it('starts in-progress with empty action log and no global locks', () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }], { now: fixedNow, idGen: seq });
    expect(game.status).toBe('in-progress');
    expect(game.endedAt).toBeNull();
    expect(game.startedAt).toBe('2026-05-27T12:00:00.000Z');
    expect(game.actionLog).toEqual([]);
    expect(game.globalLocks).toEqual({ red: false, yellow: false, green: false, blue: false });
  });

  it('produces unique player ids', () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }, { name: 'C' }], {
      idGen: seq,
      now: fixedNow,
    });
    const ids = new Set(game.players.map((p) => p.id));
    expect(ids.size).toBe(game.players.length);
  });
});
