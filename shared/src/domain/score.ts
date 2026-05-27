import type { RowState } from '../types/board.ts';
import { PENALTY_VALUE, SCORE } from '../types/constants.ts';
import type { PlayerState } from '../types/player.ts';

export function scoreForRow(row: RowState): number {
  let marks = 0;
  for (const cell of row.cells) if (cell.marked) marks += 1;
  if (row.locked) marks += 1;
  const value = SCORE[marks];
  if (value === undefined) {
    throw new Error(`Invalid mark count ${marks}; SCORE table only covers 0..${SCORE.length - 1}`);
  }
  return value;
}

export function totalScore(player: PlayerState): number {
  let total = 0;
  for (const row of player.rows) total += scoreForRow(row);
  total -= player.penalties * PENALTY_VALUE;
  return total;
}
