import { useEffect, useState } from 'react';
import { api } from './api/client.ts';
import { FinalScoresScreen } from './screens/FinalScoresScreen.tsx';
import { HistoryScreen } from './screens/HistoryScreen.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';
import { PlayScreen } from './screens/PlayScreen.tsx';
import { useGameStore } from './store/gameStore.ts';
import { startPersistence, startRealtime } from './store/persistence.ts';

export type Screen = 'home' | 'play' | 'final' | 'history';

export function App() {
  const game = useGameStore((s) => s.game);
  const hydrate = useGameStore((s) => s.hydrate);
  const reset = useGameStore((s) => s.reset);
  const [screen, setScreen] = useState<Screen>('home');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getCurrent()
      .then((existing) => {
        if (cancelled) return;
        if (existing) {
          hydrate(existing);
          setScreen(existing.status === 'completed' ? 'final' : 'play');
          return;
        }
        const raw = sessionStorage.getItem('qwixx-finalized');
        if (raw) {
          try {
            hydrate(JSON.parse(raw));
            setScreen('final');
          } catch {
            sessionStorage.removeItem('qwixx-finalized');
          }
        }
      })
      .catch((err) => {
        console.error('[app] failed to load current game', err);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  useEffect(() => startPersistence(), []);

  useEffect(() => startRealtime(), []);

  useEffect(() => {
    if (!hydrated) return;
    if (!game) {
      setScreen((cur) => (cur === 'play' || cur === 'final' ? 'home' : cur));
      return;
    }
    if (game.status === 'completed' && screen === 'play') setScreen('final');
  }, [game, hydrated, screen]);

  return (
    <main style={{ padding: 'var(--qx-screen-pad)' }}>
      {screen === 'home' ? (
        <HomeScreen
          hasCurrentGame={Boolean(game)}
          onStarted={() => setScreen('play')}
          onResume={() => setScreen(game?.status === 'completed' ? 'final' : 'play')}
          onOpenHistory={() => setScreen('history')}
        />
      ) : null}
      {screen === 'play' && game ? (
        <PlayScreen
          onExitToHome={() => setScreen('home')}
          onOpenHistory={() => setScreen('history')}
        />
      ) : null}
      {screen === 'final' && game ? (
        <FinalScoresScreen
          game={game}
          onPlayAgain={() => {
            sessionStorage.removeItem('qwixx-finalized');
            reset();
            setScreen('home');
          }}
          onOpenHistory={() => setScreen('history')}
        />
      ) : null}
      {screen === 'history' ? <HistoryScreen onBackToHome={() => setScreen('home')} /> : null}
    </main>
  );
}
