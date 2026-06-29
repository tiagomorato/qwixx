import {
  CELLS_PER_ROW,
  COLORS,
  type Color,
  type GameState,
  MAX_PENALTIES,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from '@qwixx/shared';

export type ValidationError = { path: string; message: string };

function pushErr(errs: ValidationError[], path: string, message: string): void {
  errs.push({ path, message });
}

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isIso8601(v: unknown): v is string {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v));
}

export function validateGameState(value: unknown): ValidationError[] {
  const errs: ValidationError[] = [];
  if (typeof value !== 'object' || value === null) {
    pushErr(errs, '', 'expected object');
    return errs;
  }
  const game = value as Partial<GameState>;
  if (!isString(game.id)) pushErr(errs, 'id', 'must be a non-empty string');
  if (game.status !== 'in-progress' && game.status !== 'completed') {
    pushErr(errs, 'status', 'must be in-progress | completed');
  }
  if (!isIso8601(game.startedAt)) pushErr(errs, 'startedAt', 'must be ISO-8601');
  if (game.status === 'completed') {
    if (!isIso8601(game.endedAt)) pushErr(errs, 'endedAt', 'must be ISO-8601 when completed');
  } else if (game.endedAt !== null) {
    pushErr(errs, 'endedAt', 'must be null when in-progress');
  }
  if (!Array.isArray(game.players)) {
    pushErr(errs, 'players', 'must be an array');
  } else {
    if (game.players.length < MIN_PLAYERS || game.players.length > MAX_PLAYERS) {
      pushErr(errs, 'players', `length must be ${MIN_PLAYERS}..${MAX_PLAYERS}`);
    }
    const positions = new Set<number>();
    game.players.forEach((p, i) => {
      const path = `players[${i}]`;
      if (!isString(p?.id)) pushErr(errs, `${path}.id`, 'must be non-empty string');
      if (!isString(p?.name) || p.name.trim().length === 0) {
        pushErr(errs, `${path}.name`, 'must be non-empty after trim');
      }
      if (typeof p?.position !== 'number' || p.position < 1 || p.position > MAX_PLAYERS) {
        pushErr(errs, `${path}.position`, `must be 1..${MAX_PLAYERS}`);
      } else {
        if (positions.has(p.position)) {
          pushErr(errs, `${path}.position`, 'must be unique');
        }
        positions.add(p.position);
      }
      if (typeof p?.penalties !== 'number' || p.penalties < 0 || p.penalties > MAX_PENALTIES) {
        pushErr(errs, `${path}.penalties`, `must be 0..${MAX_PENALTIES}`);
      }
      if (!Array.isArray(p?.rows) || p.rows.length !== COLORS.length) {
        pushErr(errs, `${path}.rows`, `must have ${COLORS.length} entries`);
      } else {
        p.rows.forEach((row, ri) => {
          const rpath = `${path}.rows[${ri}]`;
          if (!COLORS.includes(row?.color as Color)) {
            pushErr(errs, `${rpath}.color`, 'must be a valid Color');
          }
          if (!Array.isArray(row?.cells) || row.cells.length !== CELLS_PER_ROW) {
            pushErr(errs, `${rpath}.cells`, `must have ${CELLS_PER_ROW} entries`);
          }
          if (typeof row?.locked !== 'boolean') {
            pushErr(errs, `${rpath}.locked`, 'must be boolean');
          }
        });
      }
    });
  }
  if (typeof game.globalLocks !== 'object' || game.globalLocks === null) {
    pushErr(errs, 'globalLocks', 'must be an object');
  } else {
    for (const c of COLORS) {
      if (typeof (game.globalLocks as Record<string, unknown>)[c] !== 'boolean') {
        pushErr(errs, `globalLocks.${c}`, 'must be boolean');
      }
    }
  }
  if (!Array.isArray(game.actionLog)) {
    pushErr(errs, 'actionLog', 'must be an array');
  }
  // activePlayerId is optional (backward compatibility). When present it must be
  // a non-empty string that matches one of the players' ids.
  if (game.activePlayerId !== undefined) {
    if (!isString(game.activePlayerId)) {
      pushErr(errs, 'activePlayerId', 'must be a non-empty string');
    } else if (
      Array.isArray(game.players) &&
      !game.players.some((p) => p?.id === game.activePlayerId)
    ) {
      pushErr(errs, 'activePlayerId', 'must match a player id');
    }
  }
  return errs;
}
