import { MAX_PENALTIES } from '@qwixx/shared';
import styles from './PenaltyTrack.module.css';

export type PenaltyTrackProps = {
  count: number;
  disabled: boolean;
  onTakePenalty: () => void;
};

export function PenaltyTrack({ count, disabled, onTakePenalty }: PenaltyTrackProps) {
  return (
    <fieldset className={styles.track}>
      <legend className={styles.label}>
        Penalties: {count} of {MAX_PENALTIES}
      </legend>
      {Array.from({ length: MAX_PENALTIES }, (_, i) => (
        <span
          key={i}
          className={`${styles.cell} ${i < count ? styles.filled : ''}`}
          aria-hidden="true"
        >
          {i < count ? '✕' : ''}
        </span>
      ))}
      <button type="button" className={styles.button} disabled={disabled} onClick={onTakePenalty}>
        Take Penalty
      </button>
    </fieldset>
  );
}
