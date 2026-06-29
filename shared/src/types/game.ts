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
  /**
   * Id of the player whose turn it is. Optional for backward compatibility with
   * games persisted before turn tracking existed; such games are normalised to
   * `players[0].id` on read. Synced across devices via the existing live-sync.
   */
  activePlayerId?: string | undefined;
};

export type HistoryFile = {
  version: 1;
  games: GameState[];
};
