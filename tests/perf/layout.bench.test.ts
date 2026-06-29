import { describe, expect, it } from 'bun:test';
import { createGame, mark, scoreForRow, totalScore } from '../../shared/src/index.ts';
import type { GameState } from '../../shared/src/index.ts';

// Proxy for the mark→repaint interaction at the maximum layout density (6
// players). A repaint after a mark recomputes every visible per-row score and
// every board total; this measures that recompute cost. The DOM paint itself
// is exercised by the Playwright layout-density spec; here we guard the data
// the render consumes stays comfortably under the interaction budget.

const ITERATIONS = 5_000;
// Budget per full recompute of all six boards. The constitution's interaction
// budget is 200ms p95; the pure recompute must be a tiny fraction of that.
const BUDGET_MS = 1;

function sixPlayerGame(): GameState {
  let game = createGame([
    { name: 'A' },
    { name: 'B' },
    { name: 'C' },
    { name: 'D' },
    { name: 'E' },
    { name: 'F' },
  ]);
  // Put some marks on every board so scores are non-trivial.
  for (const p of game.players) {
    for (let i = 0; i < 4; i += 1) game = mark(game, p.id, 'red', i);
  }
  return game;
}

function recomputeAllBoards(game: GameState): number {
  let sum = 0;
  for (const p of game.players) {
    for (const r of p.rows) sum += scoreForRow(r);
    sum += totalScore(p);
  }
  return sum;
}

describe('layout recompute bench at 6 players (max density)', () => {
  const game = sixPlayerGame();

  it(`recomputing all six boards stays under ${BUDGET_MS} ms / mark`, () => {
    recomputeAllBoards(game); // warm up
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i += 1) recomputeAllBoards(game);
    const perCall = (performance.now() - start) / ITERATIONS;
    console.log(`  recomputeAllBoards(6p): ${perCall.toFixed(4)} ms / call`);
    expect(perCall).toBeLessThan(BUDGET_MS);
  });
});
