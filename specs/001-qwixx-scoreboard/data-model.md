# Phase 1 Data Model: Qwixx Digital Scoreboard

This document defines the persistent and in-memory data shapes. All shapes live in
`shared/src/types/` as TypeScript types; the JSON files on disk match these shapes exactly.

## Constants

- `COLORS = ['red', 'yellow', 'green', 'blue'] as const`
- `ASCENDING_COLORS = ['red', 'yellow']` — rows show 2…12 left-to-right
- `DESCENDING_COLORS = ['green', 'blue']` — rows show 12…2 left-to-right
- `MIN_LOCK_MARKS = 5` — minimum marks required before locking a row
- `MAX_PENALTIES = 4`
- `MAX_HISTORY = 10`
- Triangular score table for `n` marks (including the lock):
  `SCORE = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78]` (index = mark count)

## Top-level types

### `Color`

```ts
type Color = 'red' | 'yellow' | 'green' | 'blue';
```

### `CellState`

A single numeric cell in a row.

```ts
type CellState = {
  value: number;          // 2..12, matches row direction
  marked: boolean;
};
```

### `RowState`

Eleven numeric cells + the lock cell.

```ts
type RowState = {
  color: Color;
  cells: CellState[];     // length = 11, ordered left-to-right
  locked: boolean;        // true iff THIS player has crossed the lock cell
};
```

Invariants:
- For ascending colors, `cells[i].value === i + 2`.
- For descending colors, `cells[i].value === 12 - i`.
- If any `cells[i].marked === true`, all `cells[j].marked === false` for `j < i` is permitted but
  `cells[j]` can no longer transition to `marked: true` (enforced by the domain layer, not by the type).
- `locked === true` ⇒ the rightmost cell (`cells[10]`) is `marked: true` AND at least 5 cells in the
  row were marked at the time of locking.

### `PlayerState`

```ts
type PlayerState = {
  id: string;             // UUID v4, stable for the life of the game
  name: string;           // non-empty after trim
  position: 1 | 2 | 3 | 4 | 5 | 6;
  rows: RowState[];       // length = 4, order: red, yellow, green, blue
  penalties: number;      // 0..4
};
```

### `ActionLogEntry`

Append-only log used to drive undo. Every state-changing operation appends exactly one entry.

```ts
type ActionLogEntry =
  | { kind: 'mark'; playerId: string; color: Color; cellIndex: number; at: string }
  | { kind: 'lock'; playerId: string; color: Color; at: string }
  | { kind: 'penalty'; playerId: string; at: string };
```

`at` is an ISO-8601 timestamp (UTC). The log persists with the game and is used by `undo()` to
reverse the last entry.

### `GameState`

The single root persisted object for an in-progress or completed game.

```ts
type GameStatus = 'in-progress' | 'completed';

type GameState = {
  id: string;                       // UUID v4
  status: GameStatus;
  startedAt: string;                // ISO-8601
  endedAt: string | null;           // ISO-8601 once completed
  players: PlayerState[];           // length 1..6, ordered by position
  globalLocks: Record<Color, boolean>;
  actionLog: ActionLogEntry[];
};
```

Invariants:
- `status === 'completed'` ⇔ `endedAt !== null` ⇔ (≥2 colors in `globalLocks` are `true`) OR (any
  `player.penalties === 4`).
- `globalLocks[c] === true` ⇔ at least one player has `row(c).locked === true`.
- Player positions are unique and contiguous from 1..N.

### Disk shapes

**`data/current.json`** — exactly one of:
- absent / empty file ⇒ no in-progress game
- a single `GameState` object with `status === 'in-progress'`

**`data/history.json`** — always present:

```ts
type HistoryFile = {
  version: 1;
  games: GameState[];               // length ≤ 10, most-recent first, all status='completed'
};
```

If the file is missing on first run, the server creates it with `{ version: 1, games: [] }`.

## Derived values (not persisted)

These are computed by pure functions in `shared/src/domain/` from `GameState` and never stored:

- `scoreForRow(row): number` — uses `SCORE[count]` where `count` is `cells.filter(marked).length +
  (row.locked ? 1 : 0)`.
- `totalScore(player): number` — sum of per-row scores minus `5 * player.penalties`.
- `winner(game): PlayerState | PlayerState[]` — highest total; returns an array on tie.
- `isCellMarkable(game, playerId, color, cellIndex): boolean` — true iff cell is not marked, no
  later cell in same row is marked, color not globally locked, player not currently locked-out.
- `isRowLockable(game, playerId, color): boolean` — true iff color not globally locked AND that
  player's row has ≥5 marks AND the rightmost cell is markable (or already marked) AND row not yet
  locked by that player.
- `gameShouldEnd(game): boolean` — true iff ≥2 entries in `globalLocks` are true OR any player has
  `penalties === 4`.

## State transitions

| From action | Effect on `GameState` |
|-------------|-----------------------|
| `mark(playerId, color, cellIndex)` | sets matching cell `marked = true`; appends `ActionLogEntry`. |
| `lock(playerId, color)` | marks rightmost cell if not already marked, sets `row.locked = true`, sets `globalLocks[color] = true`; appends entry. |
| `penalty(playerId)` | increments `player.penalties`; appends entry. |
| `undo()` | pops last `ActionLogEntry` and reverses it; if it was `lock`, also clears `row.locked` AND `globalLocks[color]` (no other player can have it locked because the log is single-writer per game). |
| `finalize()` | sets `status = 'completed'`, `endedAt = now()`; allowed only when `gameShouldEnd` is true. |

## Validation rules

- `name` MUST be non-empty after `.trim()`. Whitespace-only is rejected at the API boundary.
- `player.penalties` MUST be in `0..MAX_PENALTIES`.
- `players.length` MUST be in `1..6` at creation; cannot change mid-game.
- `actionLog` MUST be append-only between two consecutive PUTs except via the `undo` action (server
  treats the entire payload as the new authoritative state).
- The server MUST reject a PUT whose `id` differs from the existing `current.json`'s `id` unless
  `current.json` is absent (creating a new game requires DELETE first).
