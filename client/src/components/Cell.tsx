import type { Color } from '@qwixx/shared';
import styles from './Cell.module.css';

export type CellProps = {
  value: number;
  color: Color;
  marked: boolean;
  disabled: boolean;
  isLockCell?: boolean;
  lockReady?: boolean;
  ariaLabel: string;
  onSelect: () => void;
};

const colorVar = (c: Color) =>
  ({
    '--cell-bg': `var(--qx-color-${c}-bg)`,
    '--cell-fg': `var(--qx-color-${c}-fg)`,
    '--cell-border': `var(--qx-color-${c}-border)`,
  }) as React.CSSProperties;

export function Cell({
  value,
  color,
  marked,
  disabled,
  isLockCell = false,
  lockReady = false,
  ariaLabel,
  onSelect,
}: CellProps) {
  const classes = [styles.cell];
  if (marked) classes.push(styles.marked);
  if (disabled) classes.push(styles.disabled);
  if (isLockCell) classes.push(styles.locked, styles.lockChip);
  if (isLockCell && lockReady) classes.push(styles.lockReady);

  return (
    <button
      type="button"
      className={classes.join(' ')}
      style={colorVar(color)}
      disabled={disabled}
      aria-pressed={marked}
      aria-label={ariaLabel}
      onClick={onSelect}
    >
      {isLockCell ? (
        <svg
          className={styles.lockIcon}
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 10V7a5 5 0 0 1 10 0v3"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <rect
            x="5"
            y="10"
            width="14"
            height="10"
            rx="2"
            stroke="currentColor"
            strokeWidth="2.2"
            fill="none"
          />
        </svg>
      ) : (
        value
      )}
    </button>
  );
}
