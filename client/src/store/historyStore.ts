import type { GameState } from '@qwixx/shared';
import { create } from 'zustand';
import { api } from '../api/client.ts';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export type HistoryStoreState = {
  games: GameState[];
  selectedId: string | null;
  loadState: LoadState;
  error: string | null;
  loadList: () => Promise<void>;
  selectGame: (id: string | null) => void;
};

export const useHistoryStore = create<HistoryStoreState>((set) => ({
  games: [],
  selectedId: null,
  loadState: 'idle',
  error: null,
  async loadList() {
    set({ loadState: 'loading', error: null });
    try {
      const games = await api.getHistory();
      set({ games, loadState: 'loaded' });
    } catch (err) {
      set({ loadState: 'error', error: (err as Error).message });
    }
  },
  selectGame: (selectedId) => set({ selectedId }),
}));
