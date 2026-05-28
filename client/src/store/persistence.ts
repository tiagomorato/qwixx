import type { GameState } from '@qwixx/shared';
import { ApiCallError, api } from '../api/client.ts';
import { useGameStore } from './gameStore.ts';

const DEBOUNCE_MS = 250;

export type PersistenceStatus = 'idle' | 'saving' | 'saved' | 'offline';

type Listener = (status: PersistenceStatus) => void;
const listeners = new Set<Listener>();
let status: PersistenceStatus = 'idle';

function setStatus(next: PersistenceStatus): void {
  status = next;
  for (const l of listeners) l(status);
}

export function getPersistenceStatus(): PersistenceStatus {
  return status;
}

export function onPersistenceStatusChange(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

let timer: ReturnType<typeof setTimeout> | null = null;
let inflight: Promise<unknown> | null = null;
let pending: GameState | null = null;

async function flush(): Promise<void> {
  const target = pending;
  pending = null;
  if (!target) return;
  setStatus('saving');
  try {
    if (target.status === 'completed') {
      // Sync the full final state to the server before finalizing. Without
      // this, a previous debounced PUT may have left an incomplete game on
      // the server (e.g. only 3 of 4 penalties), causing gameShouldEnd to
      // return false and the finalize to 409.
      await api.putCurrent(target).catch(() => undefined);
      await api.finalizeCurrent().catch((err) => {
        if (err instanceof ApiCallError && err.code === 'CONFLICT') return;
        throw err;
      });
      sessionStorage.setItem('qwixx-finalized', JSON.stringify(target));
    } else {
      await api.putCurrent(target);
    }
    setStatus('saved');
  } catch (err) {
    console.error('[persistence] save failed', err);
    setStatus('offline');
  } finally {
    inflight = null;
    if (pending) scheduleFlush();
  }
}

function scheduleFlush(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    if (inflight) return;
    inflight = flush();
  }, DEBOUNCE_MS);
}

export function startPersistence(): () => void {
  return useGameStore.subscribe((state, prev) => {
    if (state.game === prev.game) return;
    if (state.game === null) {
      pending = null;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      void api.deleteCurrent().catch((err) => {
        console.error('[persistence] delete failed', err);
      });
      return;
    }
    pending = state.game;
    scheduleFlush();
  });
}
