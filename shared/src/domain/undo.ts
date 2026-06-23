import type { GameState } from '../types/game.ts';
import type { PlayerState } from '../types/player.ts';

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

export function undo(game: GameState): GameState {
  const last = game.actionLog.at(-1);
  if (!last) return game;
  const trimmedLog = game.actionLog.slice(0, -1);

  if (last.kind === 'mark') {
    return mapPlayer({ ...game, actionLog: trimmedLog }, last.playerId, (p) => ({
      ...p,
      rows: p.rows.map((r) =>
        r.color === last.color
          ? {
              ...r,
              cells: r.cells.map((c, i) => (i === last.cellIndex ? { ...c, marked: false } : c)),
            }
          : r,
      ),
    }));
  }

  if (last.kind === 'penalty') {
    return mapPlayer({ ...game, actionLog: trimmedLog }, last.playerId, (p) => ({
      ...p,
      penalties: Math.max(0, p.penalties - 1),
    }));
  }

  // lock: clear the rightmost cell mark and unlock this player's row. Only
  // release the global lock if no other player still has that color closed,
  // since multiple players can close the same color.
  const cleared = mapPlayer({ ...game, actionLog: trimmedLog }, last.playerId, (p) => ({
    ...p,
    rows: p.rows.map((r) =>
      r.color === last.color
        ? {
            ...r,
            cells: r.cells.map((c, i, arr) => (i === arr.length - 1 ? { ...c, marked: false } : c)),
            locked: false,
          }
        : r,
    ),
  }));
  const stillLockedByOther = cleared.players.some((p) =>
    p.rows.some((r) => r.color === last.color && r.locked),
  );
  return {
    ...cleared,
    globalLocks: { ...cleared.globalLocks, [last.color]: stillLockedByOther },
  };
}
