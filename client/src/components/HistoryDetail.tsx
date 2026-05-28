import type { GameState } from '@qwixx/shared';
import styles from './HistoryDetail.module.css';
import { Scoreboard } from './Scoreboard.tsx';

export type HistoryDetailProps = {
  game: GameState | null;
};

const noop = () => undefined;

export function HistoryDetail({ game }: HistoryDetailProps) {
  if (!game) {
    return <p className={styles.empty}>Select a game from the list to see its boards.</p>;
  }
  const endedLabel = game.endedAt ? new Date(game.endedAt).toLocaleString() : 'Unknown';
  return (
    <div className={styles.detail}>
      <p className={styles.summary}>
        Played {endedLabel} · {game.players.length} player
        {game.players.length === 1 ? '' : 's'}
      </p>
      <div className={styles.boards}>
        {game.players.map((player) => (
          <Scoreboard
            key={player.id}
            game={game}
            player={player}
            onMark={noop}
            onLock={noop}
            onPenalty={noop}
          />
        ))}
      </div>
    </div>
  );
}
