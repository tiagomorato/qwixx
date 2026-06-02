import { type Color, type GameState, type PlayerState, totalScore } from '@qwixx/shared';
import { PenaltyTrack } from './PenaltyTrack.tsx';
import { Row } from './Row.tsx';
import styles from './Scoreboard.module.css';

export type ScoreboardProps = {
  game: GameState;
  player: PlayerState;
  showTotal?: boolean;
  onMark: (color: Color, cellIndex: number) => void;
  onLock: (color: Color) => void;
  onPenalty: () => void;
};

export function Scoreboard({
  game,
  player,
  showTotal = true,
  onMark,
  onLock,
  onPenalty,
}: ScoreboardProps) {
  const total = totalScore(player);
  const completed = game.status === 'completed';

  return (
    <section className={styles.board} aria-label={`Scoreboard for ${player.name}`}>
      <header className={styles.header}>
        <h2 className={styles.name}>{player.name}</h2>
        <span className={styles.total} aria-label={showTotal ? `Total ${total}` : 'Total hidden'}>
          {showTotal ? total : '–'}
        </span>
      </header>
      <div className={styles.rows}>
        {player.rows.map((row) => (
          <Row
            key={row.color}
            game={game}
            playerId={player.id}
            row={row}
            onMark={onMark}
            onLock={onLock}
          />
        ))}
      </div>
      <PenaltyTrack
        count={player.penalties}
        disabled={completed || player.penalties >= 4}
        onTakePenalty={onPenalty}
      />
    </section>
  );
}
