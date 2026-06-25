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

// Signature of the most recent state we sent to the server. Used to recognise
// the echo of our own writes when it comes back over the SSE stream, so we
// neither re-apply it nor let a stale echo clobber newer local edits.
let lastSentSig = '';
// Identity of a game just applied from a remote update, so the persistence
// subscriber can skip re-sending it back to the server (avoids a feedback loop).
let lastRemote: GameState | null | undefined;

function sig(game: GameState | null): string {
  return JSON.stringify(game ?? null);
}

async function flush(): Promise<void> {
  const target = pending;
  pending = null;
  if (!target) return;
  lastSentSig = sig(target);
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
    // A change we just applied from a remote update — don't echo it back.
    if (state.game === lastRemote) {
      lastRemote = undefined;
      return;
    }
    if (state.game === null) {
      pending = null;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastSentSig = sig(null);
      void api.deleteCurrent().catch((err) => {
        console.error('[persistence] delete failed', err);
      });
      return;
    }
    pending = state.game;
    scheduleFlush();
  });
}

// Apply a current-game state received from the server's live stream. Ignores
// the echo of our own writes; otherwise hydrates the store, marking the value
// so the persistence subscriber doesn't send it straight back.
export function applyRemoteGame(game: GameState | null): void {
  if (sig(game) === lastSentSig) return;
  lastRemote = game;
  useGameStore.getState().hydrate(game);
}

// Subscribe to live current-game updates over Server-Sent Events. The browser's
// EventSource reconnects automatically, so a dropped server connection recovers
// on its own. Returns a disposer that closes the stream.
export function startRealtime(): () => void {
  const source = new EventSource('/api/current/stream');
  source.onmessage = (event) => {
    try {
      const { game } = JSON.parse(event.data) as { game: GameState | null };
      applyRemoteGame(game);
    } catch (err) {
      console.error('[realtime] failed to apply update', err);
    }
  };
  return () => source.close();
}
