export * from './types/constants.ts';
export type { Color, CellState, RowState } from './types/board.ts';
export type { PlayerState, PlayerPosition } from './types/player.ts';
export type {
  ActionLogEntry,
  MarkAction,
  LockAction,
  PenaltyAction,
} from './types/action-log.ts';
export type { GameState, GameStatus, HistoryFile } from './types/game.ts';

export { createGame } from './domain/createGame.ts';
export type { CreateGameOptions, NewPlayerInput } from './domain/createGame.ts';
export { scoreForRow, totalScore } from './domain/score.ts';
export { isCellMarkable, isRowLockable, gameShouldEnd } from './domain/legality.ts';
export { mark, lock, penalty, finalize } from './domain/actions.ts';
export { undo } from './domain/undo.ts';
export { winner } from './domain/winner.ts';
export type { WinnerResult } from './domain/winner.ts';
export { formatDateTime } from './format/datetime.ts';
