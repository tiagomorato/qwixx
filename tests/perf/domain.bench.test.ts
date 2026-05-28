import { describe, expect, it } from 'bun:test';
import {
  createGame,
  isCellMarkable,
  isRowLockable,
  mark,
  scoreForRow,
  totalScore,
  undo,
} from '../../shared/src/index.ts';

const ITERATIONS = 10_000;
const BUDGET_MS = 1; // <1 ms per call, p95 over the run

function measure(label: string, fn: () => void): number {
  // Warm up once.
  fn();
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i += 1) fn();
  const elapsed = performance.now() - start;
  const perCall = elapsed / ITERATIONS;
  console.log(`  ${label}: ${perCall.toFixed(4)} ms / call (${elapsed.toFixed(1)} ms total)`);
  return perCall;
}

describe('domain bench (target <1 ms per call)', () => {
  const game = createGame([{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }]);
  const playerId = game.players[0]?.id;
  if (!playerId) throw new Error('no player');
  let withMarks = game;
  for (let i = 0; i < 5; i += 1) withMarks = mark(withMarks, playerId, 'red', i);
  const player = withMarks.players[0];
  const redRow = player?.rows[0];
  if (!player || !redRow) throw new Error('missing data');

  it(`scoreForRow stays under ${BUDGET_MS} ms / call`, () => {
    const perCall = measure('scoreForRow', () => {
      scoreForRow(redRow);
    });
    expect(perCall).toBeLessThan(BUDGET_MS);
  });

  it(`totalScore stays under ${BUDGET_MS} ms / call`, () => {
    const perCall = measure('totalScore', () => {
      totalScore(player);
    });
    expect(perCall).toBeLessThan(BUDGET_MS);
  });

  it(`isCellMarkable stays under ${BUDGET_MS} ms / call`, () => {
    const perCall = measure('isCellMarkable', () => {
      isCellMarkable(withMarks, playerId, 'red', 5);
    });
    expect(perCall).toBeLessThan(BUDGET_MS);
  });

  it(`isRowLockable stays under ${BUDGET_MS} ms / call`, () => {
    const perCall = measure('isRowLockable', () => {
      isRowLockable(withMarks, playerId, 'red');
    });
    expect(perCall).toBeLessThan(BUDGET_MS);
  });

  it(`undo stays under ${BUDGET_MS} ms / call`, () => {
    const perCall = measure('undo', () => {
      undo(withMarks);
    });
    expect(perCall).toBeLessThan(BUDGET_MS);
  });
});
