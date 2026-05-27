import type { COLORS } from './constants.ts';

export type Color = (typeof COLORS)[number];

export type CellState = {
  value: number;
  marked: boolean;
};

export type RowState = {
  color: Color;
  cells: CellState[];
  locked: boolean;
};
