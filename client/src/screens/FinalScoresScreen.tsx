import {
  type GameState,
  PENALTY_VALUE,
  type PlayerState,
  formatDateTime,
  scoreForRow,
  totalScore,
  winner,
} from '@qwixx/shared';
import { useMemo } from 'react';
import styles from './FinalScoresScreen.module.css';

export type FinalScoresScreenProps = {
  game: GameState;
  onPlayAgain: () => void;
  onOpenHistory: () => void;
};

function formatEndedAt(iso: string | null | undefined): string {
  return formatDateTime(iso) ?? 'just now';
}

function formatDuration(startedAt: string, endedAt: string | null | undefined): string | null {
  if (!endedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const totalSeconds = Math.floor((end - start) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
}

type Row = {
  player: PlayerState;
  redScore: number;
  yellowScore: number;
  greenScore: number;
  blueScore: number;
  penaltyTotal: number;
  total: number;
  isWinner: boolean;
};

export function FinalScoresScreen({ game, onPlayAgain, onOpenHistory }: FinalScoresScreenProps) {
  const rows = useMemo<Row[]>(() => {
    const { winners } = winner(game);
    const winnerIds = new Set(winners.map((p) => p.id));
    const computed = game.players.map((p) => {
      const get = (color: 'red' | 'yellow' | 'green' | 'blue'): number => {
        const r = p.rows.find((row) => row.color === color);
        return r ? scoreForRow(r) : 0;
      };
      return {
        player: p,
        redScore: get('red'),
        yellowScore: get('yellow'),
        greenScore: get('green'),
        blueScore: get('blue'),
        penaltyTotal: -PENALTY_VALUE * p.penalties,
        total: totalScore(p),
        isWinner: winnerIds.has(p.id),
      };
    });
    return computed.sort((a, b) => b.total - a.total);
  }, [game]);

  const duration = formatDuration(game.startedAt, game.endedAt);

  return (
    <section className={styles.screen} aria-labelledby="final-title">
      <header>
        <h1 id="final-title" className={styles.title}>
          Final scores
        </h1>
        <p className={styles.subtitle}>Game finished {formatEndedAt(game.endedAt)}.</p>
        {duration ? <p className={styles.subtitle}>Game lasted {duration}.</p> : null}
      </header>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Player</th>
            <th scope="col">Red</th>
            <th scope="col">Yellow</th>
            <th scope="col">Green</th>
            <th scope="col">Blue</th>
            <th scope="col">Penalties</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.player.id} className={row.isWinner ? styles.winner : undefined}>
              <td>
                {row.isWinner ? (
                  <span className={styles.crown} aria-label="winner">
                    Winner
                  </span>
                ) : null}
                {row.player.name}
              </td>
              <td>{row.redScore}</td>
              <td>{row.yellowScore}</td>
              <td>{row.greenScore}</td>
              <td>{row.blueScore}</td>
              <td>{row.penaltyTotal}</td>
              <td>{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onPlayAgain}>
          Play another game
        </button>
        <button type="button" className={styles.secondary} onClick={onOpenHistory}>
          View history
        </button>
      </div>
    </section>
  );
}
