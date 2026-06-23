import type { Color, RowState } from '../types/board.ts';
import { MAX_PENALTIES, MIN_LOCK_MARKS } from '../types/constants.ts';
import type { GameState } from '../types/game.ts';
import type { PlayerState } from '../types/player.ts';

function findPlayer(game: GameState, playerId: string): PlayerState {
  const p = game.players.find((pl) => pl.id === playerId);
  if (!p) throw new Error(`unknown playerId ${playerId}`);
  return p;
}

function findRow(player: PlayerState, color: Color): RowState {
  const r = player.rows.find((row) => row.color === color);
  if (!r) throw new Error(`unknown color ${color}`);
  return r;
}

export function isCellMarkable(
  game: GameState,
  playerId: string,
  color: Color,
  cellIndex: number,
): boolean {
  if (game.status === 'completed') return false;
  if (game.globalLocks[color]) return false;
  const player = findPlayer(game, playerId);
  const row = findRow(player, color);
  const cell = row.cells[cellIndex];
  if (!cell) return false;
  if (cell.marked) return false;
  if (row.locked) return false;
  for (let i = cellIndex + 1; i < row.cells.length; i += 1) {
    const next = row.cells[i];
    if (next?.marked) return false;
  }
  return true;
}

export function isRowLockable(game: GameState, playerId: string, color: Color): boolean {
  if (game.status === 'completed') return false;
  const player = findPlayer(game, playerId);
  const row = findRow(player, color);
  if (row.locked) return false;
  const markCount = row.cells.filter((c) => c.marked).length;
  if (markCount < MIN_LOCK_MARKS) return false;
  // Once another player closes a color, this player keeps a one-time chance to
  // also close it — but only until their very next scoring action. The moment
  // they do anything else (mark a cell, take a penalty, lock another color) the
  // window is gone and the color is grayed out for them.
  if (game.globalLocks[color]) {
    return hasOpenLockOpportunity(game, playerId, color);
  }
  return true;
}

/**
 * True when another player has closed `color` and `playerId` has not yet taken
 * any scoring action since that close — i.e. their single chance to also close
 * the color is still open. Derived from the action log so it survives undo.
 */
function hasOpenLockOpportunity(game: GameState, playerId: string, color: Color): boolean {
  const log = game.actionLog;
  let lockIndex = -1;
  for (let i = 0; i < log.length; i += 1) {
    const entry = log[i];
    if (entry?.kind === 'lock' && entry.color === color && entry.playerId !== playerId) {
      lockIndex = i;
      break;
    }
  }
  if (lockIndex === -1) return false;
  for (let i = lockIndex + 1; i < log.length; i += 1) {
    if (log[i]?.playerId === playerId) return false;
  }
  return true;
}

export function gameShouldEnd(game: GameState): boolean {
  let lockedColors = 0;
  for (const c of Object.values(game.globalLocks)) if (c) lockedColors += 1;
  if (lockedColors >= 2) return true;
  for (const p of game.players) if (p.penalties >= MAX_PENALTIES) return true;
  return false;
}
