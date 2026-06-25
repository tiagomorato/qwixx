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
  // crypto.randomUUID() is only defined in secure contexts (HTTPS or
  // http://localhost). When the app is opened over plain HTTP on a LAN
  // address (e.g. from a phone at http://192.168.x.x:5173) it is undefined,
  // so fall back to a manual UUIDv4 built from getRandomValues, and finally
  // to Math.random() if the crypto API is unavailable entirely.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40; // version 4
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
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
