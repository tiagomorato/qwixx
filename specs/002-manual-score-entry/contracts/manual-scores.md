# Contract Delta: Manual Per-Color Scores

This feature adds **no new endpoints**. It extends the payload of the existing `current.json`
contract (see `specs/001-qwixx-scoreboard/contracts/api.md`). Only the additive change is documented
here.

## Affected endpoints

- `PUT /api/current` — request body is the full `GameState`.
- `GET /api/current` — response body is the full `GameState` (or null/absent).
- `POST /api/current/finalize` — moves the current game to history; carries the same `GameState`.

In all three, each `players[i]` object now MAY include a `manualScores` field.

## Schema addition

Each player object gains:

```jsonc
{
  // …existing player fields…
  "manualScores": {
    "red":    null,   // null  | non-negative integer
    "yellow": 8,
    "green":  null,
    "blue":   6
  }
}
```

### Rules

| Field | Type | Rule |
|-------|------|------|
| `players[i].manualScores` | object \| absent | Optional. Absent ⇒ accepted (legacy game). |
| `players[i].manualScores.<color>` | `null` \| integer | Keys limited to `red`/`yellow`/`green`/`blue`. Value MUST be `null` or an integer `>= 0`. |

### Server validation behavior

- **Backward compatible**: a PUT/GET payload whose players omit `manualScores` is valid.
- A present `manualScores` with a value that is negative, non-integer, a non-number/non-null, or
  under an unknown color key ⇒ `400` with an error path `players[i].manualScores.<color>` (consistent
  with the existing `validateGameState` error format `{ path, message }`).
- Manual scores are stored and returned verbatim; the server performs **no** computation on them and
  they never affect history, finalize eligibility, or any score.

## Example PUT body (excerpt)

```jsonc
PUT /api/current
{
  "id": "498260eb-…",
  "status": "in-progress",
  "players": [
    {
      "id": "d980064e-…",
      "name": "Tiago",
      "position": 1,
      "rows": [ /* … */ ],
      "penalties": 1,
      "manualScores": { "red": 12, "yellow": 8, "green": 15, "blue": 6 }
    }
  ],
  "globalLocks": { "red": false, "yellow": false, "green": false, "blue": false },
  "actionLog": [ /* unchanged; contains NO manual-score entries */ ]
}
```

`actionLog` is unchanged by this feature — manual-score edits produce no log entries.
