import {
  type Color,
  type GameState,
  type NewPlayerInput,
  createGame,
  finalize as finalizeAction,
  gameShouldEnd,
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
    const next = markAction(game, playerId, color, cellIndex);
    set({ game: gameShouldEnd(next) ? finalizeAction(next) : next });
  },
  lockRow: (playerId, color) => {
    const game = get().game;
    if (!game) return;
    const next = lockAction(game, playerId, color);
    set({ game: gameShouldEnd(next) ? finalizeAction(next) : next });
  },
  takePenalty: (playerId) => {
    const game = get().game;
    if (!game) return;
    const next = penaltyAction(game, playerId);
    set({ game: gameShouldEnd(next) ? finalizeAction(next) : next });
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
