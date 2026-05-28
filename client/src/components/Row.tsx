import { type Color, type RowState, isCellMarkable, isRowLockable } from '@qwixx/shared';
import type { GameState } from '@qwixx/shared';
import { Cell } from './Cell.tsx';
import styles from './Row.module.css';

export type RowProps = {
  game: GameState;
  playerId: string;
  row: RowState;
  onMark: (color: Color, cellIndex: number) => void;
  onLock: (color: Color) => void;
};

export function Row({ game, playerId, row, onMark, onLock }: RowProps) {
  const { color, cells, locked } = row;
  const lockable = isRowLockable(game, playerId, color);

  return (
    <div
      className={styles.row}
      // biome-ignore lint/a11y/useSemanticElements: fieldset/legend renders the legend outside grid flow and clipped the label; div+role=group preserves the layout
      role="group"
      aria-label={`${color} row`}
      style={{ '--label-fg': `var(--qx-color-${color}-fg)` } as React.CSSProperties}
    >
      <span className={styles.label} aria-hidden="true">
        {color}
      </span>
      <div className={styles.cells}>
        {cells.map((cell, idx) => {
          const markable = isCellMarkable(game, playerId, color, idx);
          return (
            <Cell
              key={`${color}-${cell.value}`}
              value={cell.value}
              color={color}
              marked={cell.marked}
              disabled={!markable && !cell.marked}
              ariaLabel={`${color} ${cell.value}${cell.marked ? ' marked' : ''}`}
              onSelect={() => onMark(color, idx)}
            />
          );
        })}
        <Cell
          value={0}
          color={color}
          marked={locked}
          disabled={!lockable && !locked}
          isLockCell
          lockReady={lockable && !locked}
          ariaLabel={`Lock ${color} row${locked ? ' (locked)' : ''}`}
          onSelect={() => onLock(color)}
        />
      </div>
    </div>
  );
}
