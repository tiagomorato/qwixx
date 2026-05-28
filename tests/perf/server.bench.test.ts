import { describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGame } from '../../shared/src/index.ts';

const dir = mkdtempSync(join(tmpdir(), 'qwixx-bench-'));
process.env.QWIXX_DATA_DIR = dir;

const { dispatch } = await import('../../server/src/index.ts');
await import('../../server/src/routes/register.ts');

const game = createGame([{ name: 'A' }, { name: 'B' }]);
const payload = JSON.stringify({ game });

const ITERATIONS = 200;
const BUDGET_MS = 100;

async function measureAsync(label: string, fn: () => Promise<void>): Promise<number> {
  await fn(); // warm up
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i += 1) await fn();
  const elapsed = performance.now() - start;
  const perCall = elapsed / ITERATIONS;
  console.log(`  ${label}: ${perCall.toFixed(2)} ms / call (${elapsed.toFixed(1)} ms total)`);
  return perCall;
}

describe('server bench (target <100 ms p95)', () => {
  it(`PUT /api/current round-trip stays under ${BUDGET_MS} ms / call`, async () => {
    const perCall = await measureAsync('PUT /api/current', async () => {
      await dispatch(
        new Request('http://x/api/current', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: payload,
        }),
      );
    });
    expect(perCall).toBeLessThan(BUDGET_MS);
  });

  it(`GET /api/current stays under ${BUDGET_MS} ms / call`, async () => {
    const perCall = await measureAsync('GET /api/current', async () => {
      await dispatch(new Request('http://x/api/current'));
    });
    expect(perCall).toBeLessThan(BUDGET_MS);
  });
});

process.on('beforeExit', () => {
  rmSync(dir, { recursive: true, force: true });
});
