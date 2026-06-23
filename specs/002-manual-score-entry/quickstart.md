# Quickstart: Manual Per-Color Score Entry

How to exercise this feature locally and what "done" looks like.

## Prerequisites

- Bun ≥1.2 installed.
- Dependencies installed: `bun install`.

## Run the app

```bash
bun run dev        # starts the Bun server + Vite client (see package.json scripts)
```

Open the app, start a game with 2+ players, and make a few marks so a game is in progress.

## Try the feature (US1 — record per-color points)

1. On any player's scoreboard, look **below** "Penalties: N of 4" and **above** the "Take Penalty"
   button. You should see four fields in one horizontal row, colored and ordered red, yellow, green,
   blue (FR-001, FR-002, FR-003, FR-007).
2. Type `12` into red, `8` into yellow, `15` into green, `6` into blue. Each value stays in its own
   field; the others don't change (FR-005, FR-006).
3. Confirm the player's **Total** (top-right of the board) and the rest of the board are unchanged —
   manual values are informational only (FR-012).
4. Refresh / close and re-open the app for the same in-progress game. The four values are still there
   (FR-009, SC-003).

## Try corrections (US2 — edit / clear)

1. Replace red's `12` with `9` — only red changes (FR-006).
2. Clear yellow (delete its contents) — the field becomes empty; others unaffected (FR-011).
3. Type a letter into green — it is not stored; the field rejects non-numeric input (FR-008).

## Per-player independence & new game

- Enter values for two different players — each board keeps its own four values (FR-010, SC-004).
- Start a brand-new game — every field is empty again (FR-004).

## Tests

```bash
# Shared domain + creation
bun test shared

# Server validation (manualScores optional + bounds)
bun test server

# End-to-end (US1 + US2 + persistence + accessibility)
bunx playwright test tests/e2e/04-manual-scores.spec.ts
```

### What the tests assert (TDD targets)

- `createGame` gives every player `manualScores: { red: null, yellow: null, green: null, blue: null }`.
- `setManualScore` updates only the targeted player+color and appends **nothing** to `actionLog`.
- `totalScore`, `winner`, and `gameShouldEnd` ignore `manualScores` (FR-012).
- `undo` after a mark/penalty leaves `manualScores` intact.
- `validateGameState` accepts players with no `manualScores` (legacy) and with valid values, and
  rejects negative / non-integer / wrong-typed values.
- Hydrating a legacy game (no `manualScores`) normalizes it to all-`null`.
- Playwright: fields are visible in the specified location, hold typed numbers, persist across reload,
  edit/clear independently, reject non-numeric input, and are labeled (axe-core passes).

## Success criteria mapping

| Criterion | Verified by |
|-----------|-------------|
| SC-001 fields findable in the specified location | Playwright locator + visual position assertion |
| SC-002 enter all four colors < 15 s | Manual quickstart step / E2E timing (informal) |
| SC-003 100% retained after reload | Playwright reload assertion |
| SC-004 one field never alters another | Unit (`setManualScore`) + Playwright independence check |
