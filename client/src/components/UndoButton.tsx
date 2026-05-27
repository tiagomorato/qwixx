import { useGameStore } from '../store/gameStore.ts';
import styles from './UndoButton.module.css';

export function UndoButton() {
  const canUndo = useGameStore(
    (s) => s.game !== null && s.game.status === 'in-progress' && s.game.actionLog.length > 0,
  );
  const undo = useGameStore((s) => s.undo);

  return (
    <button
      type="button"
      className={styles.button}
      disabled={!canUndo}
      onClick={() => undo()}
      aria-label="Undo last action"
    >
      Undo
    </button>
  );
}
