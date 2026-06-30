import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '..', '..');

function dataDir(): string {
  return process.env.QWIXX_DATA_DIR ?? resolve(repoRoot, 'data');
}

function clientDistDir(): string {
  return process.env.QWIXX_CLIENT_DIST ?? resolve(repoRoot, 'client', 'dist');
}

export function currentPath(): string {
  return `${dataDir()}/current.json`;
}

export function historyPath(): string {
  return `${dataDir()}/history.json`;
}

// Eager-evaluated convenience constants for non-test callers.
export const DATA_DIR = dataDir();
export const CURRENT_PATH = currentPath();
export const HISTORY_PATH = historyPath();
export const CLIENT_DIST = clientDistDir();
