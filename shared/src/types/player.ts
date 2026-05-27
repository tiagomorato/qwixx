import type { RowState } from './board.ts';

export type PlayerPosition = 1 | 2 | 3 | 4 | 5 | 6;

export type PlayerState = {
  id: string;
  name: string;
  position: PlayerPosition;
  rows: RowState[];
  penalties: number;
};
