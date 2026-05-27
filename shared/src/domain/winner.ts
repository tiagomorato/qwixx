import type { GameState } from '../types/game.ts';
import type { PlayerState } from '../types/player.ts';
import { totalScore } from './score.ts';

export type WinnerResult = { winners: PlayerState[]; topScore: number };

export function winner(game: GameState): WinnerResult {
  if (game.players.length === 0) return { winners: [], topScore: 0 };
  let topScore = Number.NEGATIVE_INFINITY;
  const scored = game.players.map((p) => {
    const s = totalScore(p);
    if (s > topScore) topScore = s;
    return { player: p, score: s };
  });
  const winners = scored.filter((s) => s.score === topScore).map((s) => s.player);
  return { winners, topScore };
}
