import type { GameState } from '../types/game.ts';

/**
 * Advance the active player to the next one by `position` order, wrapping from
 * the last player back to the first.
 *
 * Pure and immutable, matching the `mark`/`lock`/`penalty` style. Does NOT
 * append to `actionLog` — whose turn it is is presentation/flow state, not a
 * scoring action.
 *
 * Edge cases:
 * - `status === 'completed'` → returns the game unchanged.
 * - empty `players` → returns the game unchanged.
 * - missing/unknown `activePlayerId` → normalises to `players[0]` (the first by
 *   position), so a legacy or corrupted game recovers a valid active player.
 * - single player → wraps to itself (safe no-op on the id).
 */
export function advanceTurn(game: GameState): GameState {
  if (game.status === 'completed') return game;
  if (game.players.length === 0) return game;
  const ordered = [...game.players].sort((a, b) => a.position - b.position);
  // -1 when the id is missing/unknown; the +1 below then lands on index 0.
  const currentIndex = ordered.findIndex((p) => p.id === game.activePlayerId);
  const nextIndex = (currentIndex + 1) % ordered.length;
  return { ...game, activePlayerId: ordered[nextIndex]?.id };
}
