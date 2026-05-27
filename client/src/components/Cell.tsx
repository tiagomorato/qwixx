import type { Color } from '@qwixx/shared';
import styles from './Cell.module.css';

export type CellProps = {
  value: number;
  color: Color;
  marked: boolean;
  disabled: boolean;
  isLockCell?: boolean;
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
  ariaLabel,
  onSelect,
}: CellProps) {
  const classes = [styles.cell];
  if (marked) classes.push(styles.marked);
  if (disabled) classes.push(styles.disabled);
  if (isLockCell) classes.push(styles.locked, styles.lockChip);

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
      {isLockCell ? '🔒' : value}
    </button>
  );
}
