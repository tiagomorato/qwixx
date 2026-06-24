import { MAX_PENALTIES } from '@qwixx/shared';
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
      // biome-ignore lint/a11y/useSemanticElements: a fieldset/legend would break the inline flex layout that keeps the boxes on the blue row's line; div+role=group preserves it
      role="group"
      aria-label={`Penalties: ${count} of ${MAX_PENALTIES}`}
    >
      <span className={styles.label} aria-hidden="true">
        Penalties: {count} of {MAX_PENALTIES}
      </span>
      <div className={styles.cells}>
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
              {filled ? 'x' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
