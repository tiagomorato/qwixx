import { useEffect, useState } from 'react';

export type Screen = 'home' | 'play' | 'final' | 'history';

export function App() {
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    // Screen routing is owned by App; concrete screen mounts arrive in US1/US3.
  }, []);

  return (
    <main style={{ padding: 'var(--qx-space-lg)' }}>
      <h1>Qwixx</h1>
      <p data-testid="screen-placeholder">Current screen: {screen}</p>
      <nav style={{ display: 'flex', gap: 'var(--qx-space-sm)' }}>
        <button type="button" onClick={() => setScreen('home')}>
          Home
        </button>
        <button type="button" onClick={() => setScreen('play')}>
          Play
        </button>
        <button type="button" onClick={() => setScreen('history')}>
          History
        </button>
      </nav>
    </main>
  );
}
