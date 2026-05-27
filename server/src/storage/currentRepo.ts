import { unlink } from 'node:fs/promises';
import type { GameState } from '@qwixx/shared';
import { currentPath } from '../paths.ts';
import { readJson, writeJson } from './jsonRepo.ts';
import { withFileLock } from './mutex.ts';

export function readCurrent(): Promise<GameState | null> {
  return readJson<GameState>(currentPath());
}

export function writeCurrent(game: GameState): Promise<void> {
  return writeJson(currentPath(), game);
}

export function deleteCurrent(): Promise<void> {
  const path = currentPath();
  return withFileLock(path, async () => {
    const file = Bun.file(path);
    if (await file.exists()) {
      await unlink(path);
    }
  });
}
