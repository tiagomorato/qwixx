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
};

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

export function PlayScreen({ onExitToHome }: PlayScreenProps) {
  const game = useGameStore((s) => s.game);
  const markCell = useGameStore((s) => s.markCell);
  const lockRow = useGameStore((s) => s.lockRow);
  const takePenalty = useGameStore((s) => s.takePenalty);
  const [status, setStatus] = useState<PersistenceStatus>(getPersistenceStatus());

  useEffect(() => onPersistenceStatusChange(setStatus), []);

  if (!game) return null;

  return (
    <section className={styles.play} aria-labelledby="play-title">
      <header className={styles.toolbar}>
        <h1 id="play-title" className={styles.title}>
          Qwixx — game in progress
        </h1>
        <span className={styles.statusBar} aria-live="polite">
          {statusLabel(status)}
        </span>
        <UndoButton />
        <button type="button" className={styles.button} onClick={onExitToHome}>
          Home
        </button>
      </header>
      <div className={styles.boards}>
        {game.players.map((player) => (
          <Scoreboard
            key={player.id}
            game={game}
            player={player}
            onMark={(color, cellIndex) => markCell(player.id, color, cellIndex)}
            onLock={(color) => lockRow(player.id, color)}
            onPenalty={() => takePenalty(player.id)}
          />
        ))}
      </div>
    </section>
  );
}
