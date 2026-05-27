import { MAX_PLAYERS, MIN_PLAYERS, type NewPlayerInput } from '@qwixx/shared';
import { type FormEvent, useState } from 'react';
import { useGameStore } from '../store/gameStore.ts';
import styles from './HomeScreen.module.css';

export type HomeScreenProps = {
  hasCurrentGame: boolean;
  onStarted: () => void;
  onResume: () => void;
  onOpenHistory: () => void;
};

const RANGE = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => i + MIN_PLAYERS);

export function HomeScreen({
  hasCurrentGame,
  onStarted,
  onResume,
  onOpenHistory,
}: HomeScreenProps) {
  const startGame = useGameStore((s) => s.startGame);
  const reset = useGameStore((s) => s.reset);
  const [count, setCount] = useState<number>(2);
  const [names, setNames] = useState<string[]>(['', '']);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function changeCount(n: number): void {
    setCount(n);
    setNames((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push('');
      return next;
    });
  }

  function startNow(): void {
    const trimmed = names.slice(0, count).map((n) => n.trim());
    if (trimmed.some((n) => n.length === 0)) {
      setError('Every player needs a non-empty name.');
      return;
    }
    setError(null);
    const players: NewPlayerInput[] = trimmed.map((name) => ({ name }));
    startGame(players);
    onStarted();
  }

  function handleSubmit(ev: FormEvent): void {
    ev.preventDefault();
    if (hasCurrentGame) {
      setShowConfirm(true);
      return;
    }
    startNow();
  }

  return (
    <section className={styles.home} aria-labelledby="home-title">
      <header>
        <h1 id="home-title" className={styles.title}>
          Qwixx
        </h1>
        <p className={styles.subtitle}>Roll the dice yourself. Track the scoreboard here.</p>
      </header>

      {hasCurrentGame && !showConfirm ? (
        <output className={styles.warning}>
          <p>You have a game in progress.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={onResume}>
              Resume game
            </button>
            <button type="button" className={styles.danger} onClick={() => setShowConfirm(true)}>
              Start a new game (discards current)
            </button>
          </div>
        </output>
      ) : null}

      {showConfirm ? (
        <div className={styles.warning} role="alertdialog" aria-labelledby="confirm-title">
          <h2 id="confirm-title">Discard current game?</h2>
          <p>This permanently removes your in-progress game. Continue?</p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.danger}
              onClick={() => {
                reset();
                setShowConfirm(false);
                startNow();
              }}
            >
              Yes, discard and start
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit}>
        <fieldset>
          <legend>How many players?</legend>
          <div className={styles.count} role="radiogroup" aria-label="Player count">
            {RANGE.map((n) => (
              <button
                key={n}
                type="button"
                className={styles.countButton}
                aria-pressed={count === n}
                onClick={() => changeCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.players}>
          <legend>Player names</legend>
          {Array.from({ length: count }, (_, i) => (
            <div className={styles.playerRow} key={i}>
              <label htmlFor={`player-${i}`}>Player {i + 1}</label>
              <input
                id={`player-${i}`}
                type="text"
                value={names[i] ?? ''}
                maxLength={32}
                onChange={(ev) =>
                  setNames((prev) => {
                    const next = [...prev];
                    next[i] = ev.target.value;
                    return next;
                  })
                }
                required
              />
            </div>
          ))}
        </fieldset>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.actions}>
          <button type="submit" className={styles.primary}>
            Start new game
          </button>
          <button type="button" className={styles.secondary} onClick={onOpenHistory}>
            View history
          </button>
        </div>
      </form>
    </section>
  );
}
