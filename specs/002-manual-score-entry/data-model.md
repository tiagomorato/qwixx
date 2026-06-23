# Phase 1 Data Model: Manual Per-Color Score Entry

This feature adds one field to an existing type. It introduces no new persisted top-level shapes.
All types live in `shared/src/types/`; the JSON on disk matches them exactly.

## Modified type

### `PlayerState` (extended)

```ts
type PlayerState = {
  id: string;
  name: string;
  position: 1 | 2 | 3 | 4 | 5 | 6;
  rows: RowState[];
  penalties: number;
  manualScores: Record<Color, number | null>;   // NEW
};
```

Where `Record<Color, number | null>` always carries exactly the four color keys:

```ts
manualScores: {
  red: number | null;
  yellow: number | null;
  green: number | null;
  blue: number | null;
}
```

**Semantics**:
- `null` ⇒ the field is empty (FR-004 initial state, FR-011 cleared state).
- A `number` ⇒ a user-entered, non-negative whole-number point value (Assumptions).
- Each color key is independent (FR-006, FR-010): editing one never changes another.
- The value is **purely informational** (FR-012): no derived function reads it.

**Invariants**:
- All four color keys (`red`, `yellow`, `green`, `blue`) are always present on a player produced by
  `createGame` or by client hydration normalization.
- Each value is `null` or an integer `>= 0`.
- `manualScores` participates in no game-end, scoring, or winner computation.

## Entity mapping (from spec "Key Entities")

| Spec entity | Representation |
|-------------|----------------|
| **Manual color score** — a point value for one player + one color, may be empty | One entry `manualScores[color]` on that player's `PlayerState`; `null` when empty. |

## Creation

`createGame` initializes every player with all-empty manual scores:

```ts
manualScores: { red: null, yellow: null, green: null, blue: null }
```

This satisfies FR-004 (each field empty when a game begins) and the edge case "new game ⇒ fields
empty for every player."

## Hydration / backward compatibility

Games persisted before this feature have no `manualScores`. When the client hydrates a loaded
`GameState`, each player missing the field (or missing any color key) is normalized to `null` for the
absent keys:

```
manualScores = { red: null, yellow: null, green: null, blue: null, ...existing }
```

This guarantees the in-memory invariant (all four keys present) regardless of disk vintage.

## State transitions

Manual scores are **not** part of the `actionLog` and are therefore unaffected by `undo`. The only
transition is a direct set via the store:

| Trigger | Effect on `GameState` |
|---------|------------------------|
| `setManualScore(playerId, color, value)` with `value: number` (≥0 int) | sets `players[i].manualScores[color] = value`; no `actionLog` entry; no game-end check. |
| `setManualScore(playerId, color, null)` (clear) | sets `players[i].manualScores[color] = null`. |
| `mark` / `lock` / `penalty` / `undo` / `finalize` | leave `manualScores` untouched (preserved via object spread). |

## Validation rules (server `validateGameState`)

`manualScores` is validated per player, and is **optional** for backward compatibility:

- If `manualScores` is absent on a player ⇒ valid (legacy save).
- If present, it MUST be an object whose every present key is one of the four `COLORS`, and whose
  every value is either `null` or a non-negative integer (`Number.isInteger(v) && v >= 0`).
- A negative number, a non-integer, a string, or an unknown color key ⇒ validation error at
  `players[i].manualScores.<color>`.

## Derived values

**None.** No function in `shared/src/domain/` reads `manualScores`. In particular `scoreForRow`,
`totalScore`, `winner`, and `gameShouldEnd` are unchanged and MUST continue to ignore it (FR-012,
verified by unit test).
