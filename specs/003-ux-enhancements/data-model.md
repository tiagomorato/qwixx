# Phase 1 Data Model: UI/UX Enhancements

This feature is overwhelmingly presentation/interaction state. Only **one**
persisted, synced field is added; the rest are derived values or per-device
client state that never enter `GameState`.

## Synced / Persisted

### GameState (modified)

Existing shape in `shared/src/types/game.ts`, with one addition:

| Field | Type | New? | Notes |
|-------|------|------|-------|
| `id` | `string` | — | unchanged |
| `status` | `'in-progress' \| 'completed'` | — | unchanged |
| `startedAt` | `string` (ISO-8601) | — | unchanged |
| `endedAt` | `string \| null` | — | unchanged |
| `players` | `PlayerState[]` | — | unchanged |
| `globalLocks` | `Record<Color, boolean>` | — | unchanged |
| `actionLog` | `ActionLogEntry[]` | — | unchanged; source for the Undo Notice |
| **`activePlayerId`** | **`string`** | **YES** | id of the player whose turn it is |

**Validation rules** (`server/src/validation/gameState.ts`):
- Optional for backward compatibility with pre-existing persisted games.
- When present, MUST be a non-empty string equal to some `players[i].id`.
- Not required on completed/history games.

**Initialisation** (`createGame`): `activePlayerId = players[0].id`.

**State transition** — `advanceTurn(game): GameState`:
- Finds the current active player's index by `position` order.
- Sets `activePlayerId` to the next player's id, wrapping last→first.
- If `status === 'completed'`, returns the game unchanged.
- If `activePlayerId` is missing/unknown on input, treats `players[0]` as
  current (defensive normalisation), then advances.
- Pure and immutable, matching the existing `mark`/`lock`/`penalty` style; does
  **not** append to `actionLog`.

## Derived (not stored)

### Row Score

The current point value of one colored row. Computed on render via the existing
`scoreForRow(row)`; reflects marks + the lock bonus. Visibility follows the
existing `showTotal` flag. No new field.

### Undo Notice

A transient description of the most-recently-undone action. Derived by detecting
that `actionLog` shrank by exactly its last entry between two `GameState`
values (local update or SSE remote update). The removed `ActionLogEntry`
supplies:
- `kind` → "mark" | "lock" | "penalty" wording
- `playerId` → resolved to a player name via `game.players`
- `color`/`cellIndex` (marks) → optional detail

Lifetime: shown briefly, auto-dismissed. Never persisted or synced as its own
field — both devices reconstruct it independently from the synced log.

## Per-Device Client State (localStorage, never synced)

### Theme Preference

| Key | `qwixx-theme` (localStorage) |
|-----|------------------------------|
| Value | `'light' \| 'dark' \| 'system'` |
| Default | `'system'` |
| Applied via | `document.documentElement.dataset.theme` |
| Scope | per-device; explicitly excluded from `GameState` |

### Recent Player Names (existing — reused for Rematch)

`qwixx-recent-names` already exists and is read by `HomeScreen` on mount.
Rematch writes the finished game's player names here; no schema change.

## In-Memory Component State (ephemeral)

- **Penalty arm/confirm**: a per-board boolean (and optional timeout) tracking
  whether the next penalty is armed for its confirming second tap. Lives in
  `Scoreboard`/`PenaltyTrack`; resets after apply, cancel, or timeout.
- **Toast queue/visibility**: which notice (if any) is currently shown.

## Entity Relationships

```
GameState ──1:N── PlayerState        (existing)
GameState ──1:1── activePlayerId ──► PlayerState.id   (NEW, synced)
GameState.actionLog ──diff──► Undo Notice             (derived, transient)
PlayerState.rows[] ──scoreForRow──► Row Score         (derived, transient)
Theme Preference         (per-device, localStorage — NO relationship to GameState)
```
