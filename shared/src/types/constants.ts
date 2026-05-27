export const COLORS = ['red', 'yellow', 'green', 'blue'] as const;
export const ASCENDING_COLORS = ['red', 'yellow'] as const;
export const DESCENDING_COLORS = ['green', 'blue'] as const;

export const MIN_LOCK_MARKS = 5;
export const MAX_PENALTIES = 4;
export const MAX_HISTORY = 10;
export const MAX_PLAYERS = 6;
export const MIN_PLAYERS = 1;
export const CELLS_PER_ROW = 11;
export const PENALTY_VALUE = 5;

export const SCORE: readonly number[] = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78] as const;
