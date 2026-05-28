import { useEffect, useMemo } from 'react';
import { HistoryDetail } from '../components/HistoryDetail.tsx';
import { HistoryList } from '../components/HistoryList.tsx';
import { useHistoryStore } from '../store/historyStore.ts';
import styles from './HistoryScreen.module.css';

export type HistoryScreenProps = {
  onBackToHome: () => void;
};

export function HistoryScreen({ onBackToHome }: HistoryScreenProps) {
  const games = useHistoryStore((s) => s.games);
  const selectedId = useHistoryStore((s) => s.selectedId);
  const loadState = useHistoryStore((s) => s.loadState);
  const error = useHistoryStore((s) => s.error);
  const loadList = useHistoryStore((s) => s.loadList);
  const selectGame = useHistoryStore((s) => s.selectGame);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const selectedGame = useMemo(
    () => games.find((g) => g.id === selectedId) ?? null,
    [games, selectedId],
  );

  return (
    <section className={styles.screen} aria-labelledby="history-title">
      <header className={styles.toolbar}>
        <h1 id="history-title" className={styles.title}>
          History
        </h1>
        <button type="button" className={styles.button} onClick={onBackToHome}>
          Back to home
        </button>
      </header>
      {loadState === 'loading' ? <p className={styles.state}>Loading…</p> : null}
      {loadState === 'error' ? (
        <p className={styles.state} role="alert">
          Failed to load history: {error}
        </p>
      ) : null}
      {loadState === 'loaded' ? (
        <div className={styles.layout}>
          <HistoryList games={games} selectedId={selectedId} onSelect={selectGame} />
          <HistoryDetail game={selectedGame} />
        </div>
      ) : null}
    </section>
  );
}
