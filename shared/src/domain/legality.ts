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
  // A color being globally locked by another player does not block this player
  // from also closing it: once someone closes a color, every other qualifying
  // player may close it too (right after, in the same round).
  const player = findPlayer(game, playerId);
  const row = findRow(player, color);
  if (row.locked) return false;
  const markCount = row.cells.filter((c) => c.marked).length;
  const rightmost = row.cells[row.cells.length - 1];
  if (!rightmost) return false;
  if (rightmost.marked) {
    return markCount >= MIN_LOCK_MARKS;
  }
  return markCount >= MIN_LOCK_MARKS;
}

export function gameShouldEnd(game: GameState): boolean {
  let lockedColors = 0;
  for (const c of Object.values(game.globalLocks)) if (c) lockedColors += 1;
  if (lockedColors >= 2) return true;
  for (const p of game.players) if (p.penalties >= MAX_PENALTIES) return true;
  return false;
}
