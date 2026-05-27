# HTTP API Contract: Client ↔ Local Bun Server

The Bun server runs on `http://localhost:5173` (Vite dev) proxied to `http://localhost:8787` (Bun
server) in development, or co-hosted in production. All responses are JSON.

## Conventions

- Content-Type: `application/json` for all request and response bodies.
- All timestamps are ISO-8601 UTC strings.
- The server is single-writer; all writes are serialized per file via an in-process mutex.
- `GameState` matches the type defined in `data-model.md`.

### Common error envelope

```json
{
  "error": {
    "code": "STRING_TAG",
    "message": "Human-readable description"
  }
}
```

Error codes used:
- `NOT_FOUND` (404)
- `CONFLICT` (409) — e.g., starting a new game while one is in progress
- `INVALID_PAYLOAD` (400)
- `INTERNAL` (500)

---

## Endpoints

### `GET /api/current`

Returns the in-progress game or `null` if none exists.

**Response 200**

```json
{ "game": null }
```

or

```json
{ "game": <GameState> }
```

### `PUT /api/current`

Upsert the in-progress game. The client sends the full authoritative `GameState`.

**Request body**

```json
{ "game": <GameState> }
```

**Behavior**

- If `data/current.json` is absent, create it with the provided game. The game's `status` MUST be
  `"in-progress"`.
- If `data/current.json` exists and its `id` matches the request's `id`, replace it.
- If `data/current.json` exists with a different `id`, respond `409 CONFLICT`. The client must
  `DELETE` first to abandon the existing game.

**Response 200**

```json
{ "game": <GameState> }
```

**Response 400 INVALID_PAYLOAD** — game fails the validation rules in data-model.md.

**Response 409 CONFLICT** — id mismatch with existing in-progress game.

### `DELETE /api/current`

Discard the in-progress game (no archival to history).

**Response 204** — empty body.

### `POST /api/current/finalize`

Move the current in-progress game into history. The server sets `status = "completed"` and
`endedAt = now()` and prepends the game to `history.json.games`, trimming to `MAX_HISTORY` (10).
The current game file is then removed.

**Request body**: none.

**Response 200**

```json
{ "game": <GameState> }   // the finalized game as stored in history
```

**Response 409 CONFLICT** — no in-progress game, or `gameShouldEnd(game)` is false.

### `GET /api/history`

List of completed games, most recent first, capped at `MAX_HISTORY`.

**Response 200**

```json
{
  "games": [<GameState>, ...]
}
```

### `GET /api/history/:id`

Single completed game by id.

**Response 200**

```json
{ "game": <GameState> }
```

**Response 404 NOT_FOUND**

---

## Client expectations

- The client treats its in-memory Zustand store as the source of truth during a turn, then debounces
  a `PUT /api/current` (≤300 ms after the last mutation) to persist. This keeps the UI snappy
  (Principle IV) while avoiding a request per cell-tap.
- On startup, the client fetches `GET /api/current` and `GET /api/history` once.
- If a network call fails, the client surfaces a clear, actionable error (Principle III) and queues
  one retry; further failures show a "saved locally, persistence unavailable" indicator. The client
  never drops a write silently.

## Server expectations

- The server writes atomically (write-then-rename) to avoid partial files on crash.
- The server validates the incoming `GameState` against the rules in data-model.md and rejects
  invalid payloads with `400 INVALID_PAYLOAD`.
- The server makes zero outbound network calls.
- The server logs each mutation (player count, action kind, player id) at info level for
  postmortem reconstruction (Principle I observability rule).
