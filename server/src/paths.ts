import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '..', '..');

export const DATA_DIR = process.env.QWIXX_DATA_DIR ?? resolve(repoRoot, 'data');
export const CURRENT_PATH = `${DATA_DIR}/current.json`;
export const HISTORY_PATH = `${DATA_DIR}/history.json`;
