import { describe, expect, it } from 'bun:test';
import { mark } from '../../src/domain/actions.ts';
import { createGame } from '../../src/domain/createGame.ts';
import { winner } from '../../src/domain/winner.ts';

const now = () => '2026-05-27T12:00:00.000Z';
let n = 0;
const id = () => `id-${++n}`;

function fresh() {
  n = 0;
  return createGame([{ name: 'A' }, { name: 'B' }], { now, idGen: id });
}

describe('winner', () => {
  it('returns a single winner with the highest score', () => {
    let game = fresh();
    const a = game.players[0];
    const b = game.players[1];
    if (!a || !b) throw new Error();
    for (let i = 0; i < 3; i += 1) game = mark(game, a.id, 'red', i, now);
    const result = winner(game);
    expect(result.winners).toHaveLength(1);
    expect(result.winners[0]?.id).toBe(a.id);
    expect(result.topScore).toBe(6);
  });

  it('returns multiple players on tie', () => {
    const game = fresh();
    const result = winner(game);
    expect(result.winners.map((p) => p.name).sort()).toEqual(['A', 'B']);
    expect(result.topScore).toBe(0);
  });
});
