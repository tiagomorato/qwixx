import { type GameState, type HistoryFile, MAX_HISTORY } from '@qwixx/shared';
import { historyPath } from '../paths.ts';
import { readJson, writeJson } from './jsonRepo.ts';

const EMPTY: HistoryFile = { version: 1, games: [] };

export async function readHistory(): Promise<HistoryFile> {
  const file = await readJson<HistoryFile>(historyPath());
  if (!file) return { ...EMPTY };
  if (file.version !== 1) {
    throw new Error(`unsupported history version ${file.version}`);
  }
  return file;
}

export async function appendCompleted(game: GameState): Promise<HistoryFile> {
  const current = await readHistory();
  const next: HistoryFile = {
    version: 1,
    games: [game, ...current.games].slice(0, MAX_HISTORY),
  };
  await writeJson(historyPath(), next);
  return next;
}

export async function findHistoryGame(id: string): Promise<GameState | null> {
  const file = await readHistory();
  return file.games.find((g) => g.id === id) ?? null;
}
