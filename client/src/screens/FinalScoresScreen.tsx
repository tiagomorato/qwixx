import {
  type GameState,
  MAX_PLAYERS,
  PENALTY_VALUE,
  type PlayerState,
  formatDateTime,
  formatElapsed,
  scoreForRow,
  totalScore,
  winner,
} from '@qwixx/shared';
import { useMemo, useState } from 'react';
import { Toast } from '../components/Toast.tsx';
import styles from './FinalScoresScreen.module.css';

export type FinalScoresScreenProps = {
  game: GameState;
  onPlayAgain: () => void;
  onOpenHistory: () => void;
};

const NAMES_STORAGE_KEY = 'qwixx-recent-names';

function formatEndedAt(iso: string | null | undefined): string {
  return formatDateTime(iso) ?? 'just now';
}

/** Seed the recent-names key so Home pre-fills with the same players. */
function saveRecentNames(names: string[]): void {
  try {
    localStorage.setItem(NAMES_STORAGE_KEY, JSON.stringify(names.slice(0, MAX_PLAYERS)));
  } catch {
    /* storage unavailable; ignore */
  }
}

/** A human-readable celebration of the winner(s). */
function celebration(winners: PlayerState[]): string {
  if (winners.length === 0) return 'No winner';
  if (winners.length === 1) return `${winners[0]?.name} wins!`;
  const names = winners.map((p) => p.name);
  if (names.length === 2) return `It's a tie — ${names[0]} & ${names[1]} win!`;
  return `It's a tie — ${names.slice(0, -1).join(', ')} & ${names.at(-1)} win!`;
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
  const [toast, setToast] = useState<string | null>(null);
  const { winners } = useMemo(() => winner(game), [game]);

  const rows = useMemo<Row[]>(() => {
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
  }, [game, winners]);

  const duration = formatElapsed(game.startedAt, game.endedAt);

  function buildSummary(): string {
    const lines = rows.map((r, i) => {
      const tag = r.isWinner ? ' 👑' : '';
      return `${i + 1}. ${r.player.name} — ${r.total}${tag}`;
    });
    return `Qwixx results\n${celebration(winners)}\n\n${lines.join('\n')}`;
  }

  async function handleShare(): Promise<void> {
    const text = buildSummary();
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ text });
      } catch {
        /* user dismissed the share sheet — nothing to do */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setToast('Results copied to clipboard');
    } catch {
      setToast('Could not copy results');
    }
  }

  function handleRematch(): void {
    const names = [...game.players].sort((a, b) => a.position - b.position).map((p) => p.name);
    saveRecentNames(names);
    onPlayAgain();
  }

  return (
    <section className={styles.screen} aria-labelledby="final-title">
      <header>
        <h1 id="final-title" className={styles.title}>
          Final scores
        </h1>
        <p className={styles.celebrate}>🎉 {celebration(winners)}</p>
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
        <button type="button" className={styles.primary} onClick={handleRematch}>
          Rematch (same players)
        </button>
        <button type="button" className={styles.secondary} onClick={() => void handleShare()}>
          Share results
        </button>
        <button type="button" className={styles.secondary} onClick={onOpenHistory}>
          View history
        </button>
      </div>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
