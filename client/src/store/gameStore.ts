import {
  type Color,
  type GameState,
  type NewPlayerInput,
  advanceTurn as advanceTurnAction,
  createGame,
  finalize as finalizeAction,
  lock as lockAction,
  mark as markAction,
  penalty as penaltyAction,
  totalScore,
  undo as undoAction,
} from '@qwixx/shared';
import { create } from 'zustand';
import { pulse } from '../lib/haptics.ts';

export type GameStoreState = {
  game: GameState | null;
  startGame: (players: NewPlayerInput[]) => void;
  hydrate: (game: GameState | null) => void;
  markCell: (playerId: string, color: Color, cellIndex: number) => void;
  lockRow: (playerId: string, color: Color) => void;
  takePenalty: (playerId: string) => void;
  advanceTurn: () => void;
  undo: () => void;
  finalize: () => void;
  reset: () => void;
};

/**
 * Ensure a hydrated game has a valid `activePlayerId`. Games persisted before
 * turn tracking (or with a stale id) are normalised to the first player so the
 * turn highlight always has a target. Returns the same object when already
 * valid, so the persistence subscriber's identity checks keep working.
 */
function normalizeActivePlayer(game: GameState | null): GameState | null {
  if (!game || game.players.length === 0) return game;
  const valid =
    game.activePlayerId != null && game.players.some((p) => p.id === game.activePlayerId);
  if (valid) return game;
  return { ...game, activePlayerId: game.players[0]?.id };
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  game: null,
  startGame: (players) => set({ game: createGame(players) }),
  hydrate: (game) => set({ game: normalizeActivePlayer(game) }),
  markCell: (playerId, color, cellIndex) => {
    const game = get().game;
    if (!game) return;
    // The game is no longer auto-finalized when an end condition is reached;
    // the player ends it manually via the "End game" button (see PlayScreen).
    set({ game: markAction(game, playerId, color, cellIndex) });
    pulse();
  },
  lockRow: (playerId, color) => {
    const game = get().game;
    if (!game) return;
    set({ game: lockAction(game, playerId, color) });
    pulse();
  },
  takePenalty: (playerId) => {
    const game = get().game;
    if (!game) return;
    set({ game: penaltyAction(game, playerId) });
    pulse();
  },
  advanceTurn: () => {
    const game = get().game;
    if (!game) return;
    if (game.status === 'completed') return;
    const next = advanceTurnAction(game);
    if (next === game) return;
    set({ game: next });
  },
  undo: () => {
    const game = get().game;
    if (!game) return;
    if (game.status === 'completed') return;
    if (game.actionLog.length === 0) return;
    set({ game: undoAction(game) });
  },
  finalize: () => {
    const game = get().game;
    if (!game) return;
    set({ game: finalizeAction(game) });
  },
  reset: () => set({ game: null }),
}));

export function selectTotalScore(state: GameStoreState, playerId: string): number {
  const player = state.game?.players.find((p) => p.id === playerId);
  return player ? totalScore(player) : 0;
}
