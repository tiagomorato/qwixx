import type { ActionLogEntry } from '../types/action-log.ts';
import type { Color } from '../types/board.ts';
import { MAX_PENALTIES } from '../types/constants.ts';
import type { GameState } from '../types/game.ts';
import type { PlayerState } from '../types/player.ts';
import { isCellMarkable, isRowLockable } from './legality.ts';

function defaultNow(): string {
  return new Date().toISOString();
}

function mapPlayer(
  game: GameState,
  playerId: string,
  mapper: (player: PlayerState) => PlayerState,
): GameState {
  return {
    ...game,
    players: game.players.map((p) => (p.id === playerId ? mapper(p) : p)),
  };
}

function mapRow(
  player: PlayerState,
  color: Color,
  mapper: (row: PlayerState['rows'][number]) => PlayerState['rows'][number],
): PlayerState {
  return {
    ...player,
    rows: player.rows.map((r) => (r.color === color ? mapper(r) : r)),
  };
}

export function mark(
  game: GameState,
  playerId: string,
  color: Color,
  cellIndex: number,
  now: () => string = defaultNow,
): GameState {
  if (!isCellMarkable(game, playerId, color, cellIndex)) {
    throw new Error(`illegal mark: player=${playerId} color=${color} cellIndex=${cellIndex}`);
  }
  const entry: ActionLogEntry = {
    kind: 'mark',
    playerId,
    color,
    cellIndex,
    at: now(),
  };
  const updated = mapPlayer(game, playerId, (p) =>
    mapRow(p, color, (r) => ({
      ...r,
      cells: r.cells.map((c, i) => (i === cellIndex ? { ...c, marked: true } : c)),
    })),
  );
  return { ...updated, actionLog: [...updated.actionLog, entry] };
}

export function lock(
  game: GameState,
  playerId: string,
  color: Color,
  now: () => string = defaultNow,
): GameState {
  if (!isRowLockable(game, playerId, color)) {
    throw new Error(`illegal lock: player=${playerId} color=${color}`);
  }
  const entry: ActionLogEntry = { kind: 'lock', playerId, color, at: now() };
  const updated = mapPlayer(game, playerId, (p) =>
    mapRow(p, color, (r) => {
      const cells = r.cells.map((c, i, arr) => (i === arr.length - 1 ? { ...c, marked: true } : c));
      return { ...r, cells, locked: true };
    }),
  );
  return {
    ...updated,
    globalLocks: { ...updated.globalLocks, [color]: true },
    actionLog: [...updated.actionLog, entry],
  };
}

export function penalty(
  game: GameState,
  playerId: string,
  now: () => string = defaultNow,
): GameState {
  if (game.status === 'completed') {
    throw new Error('cannot take penalty on completed game');
  }
  const target = game.players.find((p) => p.id === playerId);
  if (!target) throw new Error(`unknown playerId ${playerId}`);
  if (target.penalties >= MAX_PENALTIES) {
    throw new Error(`penalty cap reached for player ${playerId}`);
  }
  const entry: ActionLogEntry = { kind: 'penalty', playerId, at: now() };
  const updated = mapPlayer(game, playerId, (p) => ({ ...p, penalties: p.penalties + 1 }));
  return { ...updated, actionLog: [...updated.actionLog, entry] };
}

export function finalize(game: GameState, now: () => string = defaultNow): GameState {
  if (game.status === 'completed') return game;
  return { ...game, status: 'completed', endedAt: now() };
}
