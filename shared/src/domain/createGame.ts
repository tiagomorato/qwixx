import type { CellState, Color, RowState } from '../types/board.ts';
import {
  ASCENDING_COLORS,
  CELLS_PER_ROW,
  COLORS,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from '../types/constants.ts';
import type { GameState } from '../types/game.ts';
import type { PlayerPosition, PlayerState } from '../types/player.ts';

export type CreateGameOptions = {
  now?: () => string;
  idGen?: () => string;
};

export type NewPlayerInput = {
  name: string;
};

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultIdGen(): string {
  return crypto.randomUUID();
}

function buildRow(color: Color): RowState {
  const ascending = (ASCENDING_COLORS as readonly string[]).includes(color);
  const cells: CellState[] = [];
  for (let i = 0; i < CELLS_PER_ROW; i += 1) {
    const value = ascending ? i + 2 : 12 - i;
    cells.push({ value, marked: false });
  }
  return { color, cells, locked: false };
}

function buildPlayer(
  input: NewPlayerInput,
  position: PlayerPosition,
  idGen: () => string,
): PlayerState {
  return {
    id: idGen(),
    name: input.name.trim(),
    position,
    rows: COLORS.map(buildRow),
    penalties: 0,
  };
}

function assertValidPlayers(players: NewPlayerInput[]): void {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new Error(
      `players.length must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}, got ${players.length}`,
    );
  }
  for (const p of players) {
    if (p.name.trim().length === 0) {
      throw new Error('player name must be non-empty after trim');
    }
  }
}

export function createGame(players: NewPlayerInput[], opts: CreateGameOptions = {}): GameState {
  assertValidPlayers(players);
  const now = opts.now ?? defaultNow;
  const idGen = opts.idGen ?? defaultIdGen;
  return {
    id: idGen(),
    status: 'in-progress',
    startedAt: now(),
    endedAt: null,
    players: players.map((p, i) => buildPlayer(p, (i + 1) as PlayerPosition, idGen)),
    globalLocks: { red: false, yellow: false, green: false, blue: false },
    actionLog: [],
  };
}
