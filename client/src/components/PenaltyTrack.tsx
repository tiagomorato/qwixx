import { MAX_PENALTIES, PENALTY_VALUE } from '@qwixx/shared';
import { useEffect, useRef, useState } from 'react';
import styles from './PenaltyTrack.module.css';

export type PenaltyTrackProps = {
  count: number;
  disabled: boolean;
  onTakePenalty: () => void;
};

const DISARM_MS = 3000;

export function PenaltyTrack({ count, disabled, onTakePenalty }: PenaltyTrackProps) {
  // Two-step guard against accidental penalties: the first tap on the next box
  // arms it ("Confirm −5?"), a second deliberate tap applies it. Tapping
  // elsewhere or a short timeout disarms.
  const [armed, setArmed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Reset the guard whenever the penalty is applied or the control disables.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-disarm on count change (penalty applied)
  useEffect(() => {
    setArmed(false);
  }, [count, disabled]);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), DISARM_MS);
    const onOutside = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setArmed(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', onOutside);
    };
  }, [armed]);

  function handleNext(): void {
    if (armed) {
      onTakePenalty();
      setArmed(false);
    } else {
      setArmed(true);
    }
  }

  return (
    <div
      ref={ref}
      className={styles.track}
      // biome-ignore lint/a11y/useSemanticElements: a fieldset/legend would break the inline flex row that keeps the boxes, label, and score on one line; div+role=group preserves it
      role="group"
      aria-label={`Penalties: ${count} of ${MAX_PENALTIES}`}
    >
      <span className={styles.label}>{armed ? 'Confirm −5?' : 'Penalties'}</span>
      {Array.from({ length: MAX_PENALTIES }, (_, i) => {
        const filled = i < count;
        const isNext = i === count;
        const isArmed = isNext && armed;
        return (
          <button
            key={i}
            type="button"
            className={`${styles.cell} ${filled ? styles.filled : ''} ${isArmed ? styles.armed : ''}`}
            disabled={disabled || !isNext}
            aria-pressed={filled}
            aria-label={
              filled
                ? `Penalty ${i + 1} taken`
                : isArmed
                  ? 'Confirm penalty −5'
                  : isNext
                    ? 'Take penalty'
                    : 'Penalty'
            }
            onClick={isNext ? handleNext : onTakePenalty}
          >
            {filled ? (
              <span className={styles.x} aria-hidden="true">
                ✕
              </span>
            ) : isArmed ? (
              <span className={styles.q} aria-hidden="true">
                ?
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
