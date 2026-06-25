import { MAX_PENALTIES, PENALTY_VALUE } from '@qwixx/shared';
import styles from './PenaltyTrack.module.css';

export type PenaltyTrackProps = {
  count: number;
  disabled: boolean;
  onTakePenalty: () => void;
};

export function PenaltyTrack({ count, disabled, onTakePenalty }: PenaltyTrackProps) {
  return (
    <div
      className={styles.track}
      // biome-ignore lint/a11y/useSemanticElements: a fieldset/legend would break the inline flex row that keeps the boxes, label, and score on one line; div+role=group preserves it
      role="group"
      aria-label={`Penalties: ${count} of ${MAX_PENALTIES}`}
    >
      <span className={styles.label}>Penalties</span>
      {Array.from({ length: MAX_PENALTIES }, (_, i) => {
        const filled = i < count;
        const isNext = i === count;
        return (
          <button
            key={i}
            type="button"
            className={`${styles.cell} ${filled ? styles.filled : ''}`}
            disabled={disabled || !isNext}
            aria-pressed={filled}
            aria-label={filled ? `Penalty ${i + 1} taken` : isNext ? 'Take penalty' : 'Penalty'}
            onClick={onTakePenalty}
          >
            {filled ? (
              <span className={styles.x} aria-hidden="true">
                ✕
              </span>
            ) : null}
          </button>
        );
      })}
      <span className={styles.score} aria-hidden="true">
        −{count * PENALTY_VALUE}
      </span>
    </div>
  );
}
