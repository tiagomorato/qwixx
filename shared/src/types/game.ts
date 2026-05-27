import type { ActionLogEntry } from './action-log.ts';
import type { Color } from './board.ts';
import type { PlayerState } from './player.ts';

export type GameStatus = 'in-progress' | 'completed';

export type GameState = {
  id: string;
  status: GameStatus;
  startedAt: string;
  endedAt: string | null;
  players: PlayerState[];
  globalLocks: Record<Color, boolean>;
  actionLog: ActionLogEntry[];
};

export type HistoryFile = {
  version: 1;
  games: GameState[];
};
