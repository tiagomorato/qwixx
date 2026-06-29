import {
  type Color,
  type GameState,
  MAX_PENALTIES,
  type PlayerState,
  totalScore,
} from '@qwixx/shared';
import { PenaltyTrack } from './PenaltyTrack.tsx';
import { Row } from './Row.tsx';
import styles from './Scoreboard.module.css';

export type ScoreboardProps = {
  game: GameState;
  player: PlayerState;
  showTotal?: boolean;
  isActive?: boolean;
  onMark: (color: Color, cellIndex: number) => void;
  onLock: (color: Color) => void;
  onPenalty: () => void;
};

export function Scoreboard({
  game,
  player,
  showTotal = true,
  isActive = false,
  onMark,
  onLock,
  onPenalty,
}: ScoreboardProps) {
  const total = totalScore(player);
  const completed = game.status === 'completed';

  return (
    <section
      className={`${styles.board} ${isActive ? styles.active : ''}`}
      aria-label={`Scoreboard for ${player.name}`}
      aria-current={isActive ? 'true' : undefined}
    >
      <header className={styles.header}>
        <h2 className={styles.name}>
          {player.name}
          {isActive ? <span className={styles.turnBadge}>● Turn</span> : null}
        </h2>
        <div className={styles.score}>
          <span className={styles.total} aria-label={showTotal ? `Total ${total}` : 'Total hidden'}>
            {showTotal ? total : '–'}
          </span>
          <span className={styles.pts} aria-hidden="true">
            pts
          </span>
        </div>
      </header>
      <div className={styles.rows}>
        {player.rows.map((row) => (
          <Row
            key={row.color}
            game={game}
            playerId={player.id}
            row={row}
            showScore={showTotal}
            onMark={onMark}
            onLock={onLock}
          />
        ))}
      </div>
      <PenaltyTrack
        count={player.penalties}
        disabled={completed || player.penalties >= MAX_PENALTIES}
        onTakePenalty={onPenalty}
      />
    </section>
  );
}
