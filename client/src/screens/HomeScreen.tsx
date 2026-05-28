import { MAX_PLAYERS, MIN_PLAYERS, type NewPlayerInput } from '@qwixx/shared';
import { type FormEvent, useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore.ts';
import styles from './HomeScreen.module.css';

export type HomeScreenProps = {
  hasCurrentGame: boolean;
  onStarted: () => void;
  onResume: () => void;
  onOpenHistory: () => void;
};

const RANGE = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => i + MIN_PLAYERS);
const NAMES_STORAGE_KEY = 'qwixx-recent-names';

function loadRecentNames(): string[] {
  try {
    const raw = localStorage.getItem(NAMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is string => typeof n === 'string').slice(0, MAX_PLAYERS);
  } catch {
    return [];
  }
}

function saveRecentNames(names: string[]): void {
  try {
    localStorage.setItem(NAMES_STORAGE_KEY, JSON.stringify(names));
  } catch {
    /* storage unavailable; ignore */
  }
}

export function HomeScreen({
  hasCurrentGame,
  onStarted,
  onResume,
  onOpenHistory,
}: HomeScreenProps) {
  const startGame = useGameStore((s) => s.startGame);
  const reset = useGameStore((s) => s.reset);
  const [count, setCount] = useState<number>(MIN_PLAYERS);
  const [names, setNames] = useState<string[]>(() => Array.from({ length: MIN_PLAYERS }, () => ''));
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);

  useEffect(() => {
    const recent = loadRecentNames();
    if (recent.length === 0) return;
    const initialCount = Math.max(MIN_PLAYERS, Math.min(recent.length, MAX_PLAYERS));
    setCount(initialCount);
    setNames(Array.from({ length: initialCount }, (_, i) => recent[i] ?? ''));
  }, []);

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
    const firstEmpty = trimmed.findIndex((n) => n.length === 0);
    if (firstEmpty >= 0) {
      setError('Every player needs a non-empty name.');
      setErrorIndex(firstEmpty);
      document.getElementById(`player-${firstEmpty}`)?.focus();
      return;
    }
    const seen = new Map<string, number>();
    for (let i = 0; i < trimmed.length; i += 1) {
      const key = (trimmed[i] ?? '').toLowerCase();
      const prev = seen.get(key);
      if (prev !== undefined) {
        setError('Each player needs a unique name.');
        setErrorIndex(i);
        document.getElementById(`player-${i}`)?.focus();
        return;
      }
      seen.set(key, i);
    }
    setError(null);
    setErrorIndex(null);
    saveRecentNames(trimmed);
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

      <details className={styles.rules}>
        <summary>How to play</summary>
        <ul>
          <li>On each turn the active player rolls; everyone may mark.</li>
          <li>
            Mark cells in each color row strictly left-to-right; numbers to the left of your last
            mark become unavailable.
          </li>
          <li>Lock a row by marking its rightmost cell after at least 5 marks in that row.</li>
          <li>Penalty: -5 points each. 4 penalties on any player ends the game.</li>
          <li>Two locked rows also end the game.</li>
          <li>
            Score per row: 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78 for 1–12 marks (a lock counts
            as a mark).
          </li>
        </ul>
      </details>

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

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
                aria-invalid={errorIndex === i ? true : undefined}
                onChange={(ev) =>
                  setNames((prev) => {
                    const next = [...prev];
                    next[i] = ev.target.value;
                    return next;
                  })
                }
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
