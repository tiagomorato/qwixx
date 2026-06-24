import { formatElapsed, gameShouldEnd } from '@qwixx/shared';
import { useEffect, useState } from 'react';
import { Scoreboard } from '../components/Scoreboard.tsx';
import { UndoButton } from '../components/UndoButton.tsx';
import { useGameStore } from '../store/gameStore.ts';
import {
  type PersistenceStatus,
  getPersistenceStatus,
  onPersistenceStatusChange,
} from '../store/persistence.ts';
import styles from './PlayScreen.module.css';

export type PlayScreenProps = {
  onExitToHome: () => void;
  onOpenHistory: () => void;
};

/** Re-renders the caller roughly every `intervalMs`, returning the current epoch time. */
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function statusLabel(s: PersistenceStatus): string {
  switch (s) {
    case 'idle':
      return 'Ready';
    case 'saving':
      return 'Saving…';
    case 'saved':
      return 'Saved';
    case 'offline':
      return 'Saved locally; sync unavailable';
  }
}

export function PlayScreen({ onExitToHome, onOpenHistory }: PlayScreenProps) {
  const game = useGameStore((s) => s.game);
  const markCell = useGameStore((s) => s.markCell);
  const lockRow = useGameStore((s) => s.lockRow);
  const takePenalty = useGameStore((s) => s.takePenalty);
  const finalize = useGameStore((s) => s.finalize);
  const [status, setStatus] = useState<PersistenceStatus>(getPersistenceStatus());
  const [showTotals, setShowTotals] = useState(true);
  const now = useNow(1000);

  useEffect(() => onPersistenceStatusChange(setStatus), []);

  if (!game) return null;

  const canEnd = gameShouldEnd(game);
  const elapsed = formatElapsed(game.startedAt, new Date(now).toISOString());

  return (
    <section className={styles.play} aria-labelledby="play-title">
      <header className={styles.toolbar}>
        <h1 id="play-title" className={styles.title}>
          Qwixx
        </h1>
        {elapsed ? (
          <span className={styles.clock} aria-label={`Elapsed time ${elapsed}`}>
            {elapsed}
          </span>
        ) : null}
        <span className={styles.statusBar} aria-live="polite">
          {statusLabel(status)}
        </span>
        <UndoButton />
        <button
          type="button"
          className={styles.button}
          aria-pressed={!showTotals}
          onClick={() => setShowTotals((v) => !v)}
        >
          {showTotals ? 'Hide points' : 'Show points'}
        </button>
        <button type="button" className={styles.button} onClick={onOpenHistory}>
          History
        </button>
        <button type="button" className={styles.button} onClick={onExitToHome}>
          Home
        </button>
      </header>
      {canEnd ? (
        <output className={styles.endBar}>
          <span className={styles.endMessage}>An end condition has been met.</span>
          <button type="button" className={styles.endButton} onClick={finalize}>
            End game
          </button>
        </output>
      ) : null}
      <div className={styles.boards}>
        {game.players.map((player) => (
          <Scoreboard
            key={player.id}
            game={game}
            player={player}
            showTotal={showTotals}
            onMark={(color, cellIndex) => markCell(player.id, color, cellIndex)}
            onLock={(color) => lockRow(player.id, color)}
            onPenalty={() => takePenalty(player.id)}
          />
        ))}
      </div>
    </section>
  );
}
