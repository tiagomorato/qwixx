import { formatElapsed, gameShouldEnd } from '@qwixx/shared';
import { useEffect, useState } from 'react';
import { Scoreboard } from '../components/Scoreboard.tsx';
import { ThemeToggle } from '../components/ThemeToggle.tsx';
import { Toast } from '../components/Toast.tsx';
import { UndoButton } from '../components/UndoButton.tsx';
import { useGameStore } from '../store/gameStore.ts';
import { onUndoNotice } from '../store/persistence.ts';
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

/**
 * Drives the browser Fullscreen API. Hiding the browser/OS chrome to give the
 * boards the whole screen requires a user gesture, so `toggle` must be called
 * from an event handler. `supported` is false where the API is unavailable
 * (notably iOS Safari, which only allows fullscreen on <video>); callers should
 * hide the control there and rely on "Add to Home Screen" instead.
 */
function useFullscreen(): { supported: boolean; active: boolean; toggle: () => void } {
  const supported =
    typeof document !== 'undefined' && document.documentElement.requestFullscreen != null;
  const [active, setActive] = useState(
    () => typeof document !== 'undefined' && document.fullscreenElement != null,
  );

  useEffect(() => {
    const onChange = () => setActive(document.fullscreenElement != null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return { supported, active, toggle };
}

export function PlayScreen({ onExitToHome, onOpenHistory }: PlayScreenProps) {
  const game = useGameStore((s) => s.game);
  const markCell = useGameStore((s) => s.markCell);
  const lockRow = useGameStore((s) => s.lockRow);
  const takePenalty = useGameStore((s) => s.takePenalty);
  const advanceTurn = useGameStore((s) => s.advanceTurn);
  const finalize = useGameStore((s) => s.finalize);
  const [showTotals, setShowTotals] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const fullscreen = useFullscreen();
  const now = useNow(1000);

  useEffect(() => onUndoNotice((notice) => setToast(notice.message)), []);

  if (!game) return null;

  const canEnd = gameShouldEnd(game);
  const elapsed = formatElapsed(game.startedAt, new Date(now).toISOString());

  return (
    <section className={styles.play} aria-labelledby="play-title">
      <header className={styles.toolbar}>
        <h1 id="play-title" className={styles.title}>
          Qwixx
        </h1>
        <span className={styles.dots} aria-hidden="true">
          <span style={{ background: 'var(--qx-color-red-border)' }} />
          <span style={{ background: 'var(--qx-color-yellow-border)' }} />
          <span style={{ background: 'var(--qx-color-green-border)' }} />
          <span style={{ background: 'var(--qx-color-blue-border)' }} />
        </span>
        <div className={styles.actions}>
          {elapsed ? (
            <span className={styles.clock} aria-label={`Elapsed time ${elapsed}`}>
              {elapsed}
            </span>
          ) : null}
          <button
            type="button"
            className={styles.nextButton}
            onClick={advanceTurn}
            disabled={game.status === 'completed'}
          >
            Next player
          </button>
          <UndoButton />
          <ThemeToggle />
          {fullscreen.supported ? (
            <button
              type="button"
              className={styles.button}
              aria-pressed={fullscreen.active}
              onClick={fullscreen.toggle}
            >
              {fullscreen.active ? 'Exit full screen' : 'Full screen'}
            </button>
          ) : null}
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
        </div>
      </header>
      {canEnd ? (
        <output className={styles.endBar}>
          <span className={styles.endMessage}>An end condition has been met.</span>
          <button type="button" className={styles.endButton} onClick={finalize}>
            End game
          </button>
        </output>
      ) : null}
      <div className={styles.boards} data-players={game.players.length}>
        {game.players.map((player) => (
          <Scoreboard
            key={player.id}
            game={game}
            player={player}
            showTotal={showTotals}
            isActive={player.id === game.activePlayerId}
            onMark={(color, cellIndex) => markCell(player.id, color, cellIndex)}
            onLock={(color) => lockRow(player.id, color)}
            onPenalty={() => takePenalty(player.id)}
          />
        ))}
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
