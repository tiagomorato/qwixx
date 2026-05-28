import { describe, expect, it } from 'bun:test';
import { createGame } from '../../src/domain/createGame.ts';
import { scoreForRow, totalScore } from '../../src/domain/score.ts';
import type { RowState } from '../../src/types/board.ts';

function rowWithMarks(count: number, locked = false): RowState {
  const cells = Array.from({ length: 11 }, (_, i) => ({ value: i + 2, marked: i < count }));
  return { color: 'red', cells, locked };
}

describe('scoreForRow', () => {
  it('returns 0 for an empty row', () => {
    expect(scoreForRow(rowWithMarks(0))).toBe(0);
  });

  it('follows the triangular table for 1..11 marks', () => {
    const expected = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66];
    for (let i = 0; i <= 11; i += 1) {
      expect(scoreForRow(rowWithMarks(i))).toBe(expected[i] ?? 0);
    }
  });

  it('treats the lock as an additional mark', () => {
    // 5 cells marked + locked => 6 marks -> 21
    expect(scoreForRow(rowWithMarks(5, true))).toBe(21);
    // 11 cells marked + locked => 12 marks -> 78
    expect(scoreForRow(rowWithMarks(11, true))).toBe(78);
  });
});

describe('totalScore', () => {
  it('sums row scores and subtracts 5 per penalty', () => {
    const game = createGame([{ name: 'A' }, { name: 'B' }]);
    const player = game.players[0];
    if (!player) throw new Error('player');
    expect(totalScore(player)).toBe(0);
    const withMarks = {
      ...player,
      rows: player.rows.map((r, i) =>
        i === 0 ? { ...r, cells: r.cells.map((c, ci) => ({ ...c, marked: ci < 3 })) } : r,
      ),
      penalties: 1,
    };
    // row 0: 3 marks = 6, others = 0, penalties: -5 => 1
    expect(totalScore(withMarks)).toBe(1);
  });
});
