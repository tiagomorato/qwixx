import {
  type Color,
  type GameState,
  type NewPlayerInput,
  createGame,
  finalize as finalizeAction,
  lock as lockAction,
  mark as markAction,
  penalty as penaltyAction,
  totalScore,
  undo as undoAction,
} from '@qwixx/shared';
import { create } from 'zustand';

export type GameStoreState = {
  game: GameState | null;
  startGame: (players: NewPlayerInput[]) => void;
  hydrate: (game: GameState | null) => void;
  markCell: (playerId: string, color: Color, cellIndex: number) => void;
  lockRow: (playerId: string, color: Color) => void;
  takePenalty: (playerId: string) => void;
  undo: () => void;
  finalize: () => void;
  reset: () => void;
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  game: null,
  startGame: (players) => set({ game: createGame(players) }),
  hydrate: (game) => set({ game }),
  markCell: (playerId, color, cellIndex) => {
    const game = get().game;
    if (!game) return;
    // The game is no longer auto-finalized when an end condition is reached;
    // the player ends it manually via the "End game" button (see PlayScreen).
    set({ game: markAction(game, playerId, color, cellIndex) });
  },
  lockRow: (playerId, color) => {
    const game = get().game;
    if (!game) return;
    set({ game: lockAction(game, playerId, color) });
  },
  takePenalty: (playerId) => {
    const game = get().game;
    if (!game) return;
    set({ game: penaltyAction(game, playerId) });
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
