import type { Color } from './board.ts';

export type MarkAction = {
  kind: 'mark';
  playerId: string;
  color: Color;
  cellIndex: number;
  at: string;
};

export type LockAction = {
  kind: 'lock';
  playerId: string;
  color: Color;
  at: string;
};

export type PenaltyAction = {
  kind: 'penalty';
  playerId: string;
  at: string;
};

export type ActionLogEntry = MarkAction | LockAction | PenaltyAction;
