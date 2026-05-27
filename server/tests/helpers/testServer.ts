import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dispatch } from '../../src/index.ts';
import '../../src/routes/register.ts';

export { dispatch };

export function setupDataDir(): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'qwixx-test-'));
  process.env.QWIXX_DATA_DIR = dir;
  return {
    dir,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
