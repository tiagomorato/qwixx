import { type GameState, winner } from '@qwixx/shared';
import styles from './HistoryList.module.css';

export type HistoryListProps = {
  games: GameState[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function formatDate(iso: string | null): string {
  if (!iso) return 'Unknown date';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function HistoryList({ games, selectedId, onSelect }: HistoryListProps) {
  if (games.length === 0) {
    return <p className={styles.empty}>No completed games yet.</p>;
  }
  return (
    <ul className={styles.list}>
      {games.map((game) => {
        const { winners } = winner(game);
        const winnerNames = winners.map((w) => w.name).join(', ');
        const isSelected = game.id === selectedId;
        return (
          <li key={game.id}>
            <button
              type="button"
              className={styles.item}
              aria-current={isSelected}
              onClick={() => onSelect(game.id)}
            >
              <span className={styles.date}>{formatDate(game.endedAt)}</span>
              <span className={styles.players}>{game.players.map((p) => p.name).join(' vs ')}</span>
              <span className={styles.winner}>★ {winnerNames}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
