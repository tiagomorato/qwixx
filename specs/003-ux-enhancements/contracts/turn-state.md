# Contract Delta: Turn State on the Current Game

This feature adds exactly one field to the synced game contract. No new
endpoints, no new request/response envelopes. The existing live-sync pipeline
(`PUT /api/current` → persist → `broadcastCurrent` → `GET /api/current/stream`
SSE) carries the new field unchanged.

## Affected surface

| Surface | Change |
|---------|--------|
| `GET /api/current` | response `game` now includes `activePlayerId` (when set) |
| `PUT /api/current` | request `game` MAY include `activePlayerId`; validated if present |
| `GET /api/current/stream` (SSE) | each `data:` frame's `game` includes `activePlayerId` |
| `POST /api/current/finalize` | unchanged; completed game retains last `activePlayerId` (ignored thereafter) |
| `GET /api/history`, `GET /api/history/:id` | unchanged; old records have no `activePlayerId` and need none |

## Field

```
activePlayerId: string   // equals one of game.players[].id
```

## Validation (server `validateGameState`)

- **Optional**: absence is allowed (backward compatibility with games persisted
  before this feature). A current game missing the field is normalised to
  `players[0].id` on read by the client.
- **When present**: MUST be a non-empty string AND MUST match some
  `players[i].id`. Otherwise return `INVALID_PAYLOAD` with path `activePlayerId`.
- No requirement on completed games.

## Example PUT body (abbreviated)

```json
{
  "game": {
    "id": "…",
    "status": "in-progress",
    "startedAt": "2026-06-29T10:00:00.000Z",
    "endedAt": null,
    "activePlayerId": "p2-uuid",
    "players": [
      { "id": "p1-uuid", "name": "Ada", "position": 1, "rows": [/*…*/], "penalties": 0 },
      { "id": "p2-uuid", "name": "Lin", "position": 2, "rows": [/*…*/], "penalties": 0 }
    ],
    "globalLocks": { "red": false, "yellow": false, "green": false, "blue": false },
    "actionLog": []
  }
}
```

## SSE frame (unchanged shape)

```
data: {"game": { …, "activePlayerId": "p2-uuid" }}
```

A client receiving a frame whose `game.activePlayerId` differs from its current
value updates the active-player highlight, satisfying FR-005 within existing
sync latency (SC-003).

## Non-contract (explicitly NOT synced)

- **Theme preference** — per-device `localStorage` only; never appears in any
  request/response/SSE payload.
- **Undo Notice** — reconstructed client-side from the `actionLog` diff; not a
  field.
- **Per-row scores** — derived via `scoreForRow`; not a field.
- **Penalty arm/confirm** — ephemeral client UI state; not a field.

## Backward / forward compatibility

- Old persisted current game (no field) → still valid; client defaults the
  active player to `players[0]`.
- Old history records (no field) → unaffected; never read for turn state.
- A client that ignores the field continues to function (additive, optional).
