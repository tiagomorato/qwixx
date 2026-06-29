# Quickstart: UI/UX Enhancements

Validate the ten enhancements end-to-end. Assumes the monorepo dev setup.

## Run

```bash
bun install
bun run dev:server     # http://localhost:8787
bun run dev:client     # Vite dev server (proxies /api to the server)
```

Open the client URL on two devices/tabs on the same LAN to exercise sync.

## Verify each story

### US1 — Per-row scores (P1)
1. Start a game; mark several cells across different rows on one board.
2. Each colored row shows its current point value, updating per mark.
3. Lock a row → its score reflects the lock bonus.
4. Tap **Hide points** → per-row scores hide with the grand total; **Show
   points** restores both.

### US2 — Turn tracking (P1)
1. Start a 3-player game → exactly one board is highlighted as active.
2. Tap **Next player** → highlight moves to the next player by position.
3. Advance past the last player → wraps to the first.
4. On a second synced device, advancing the turn on one reflects on the other.

### US3 — Haptics (P2)
1. On a phone that supports vibration, mark a cell / lock / take a penalty →
   brief pulse.
2. On a desktop browser (no vibration) → actions work, no error.
3. Tap a disabled/already-marked cell → no pulse (no state change).

### US4 — Theme toggle (P2)
1. Use the theme control to pick Light, then Dark → appearance changes
   immediately, overriding the OS setting.
2. Reload → the chosen theme persists.
3. Choose **System** → appearance follows the device preference again.
4. Confirm the choice does **not** change the other synced device's theme.

### US5 — Penalty guard + undo notice (P2)
1. Tap the next penalty box → it arms ("Confirm −5?"); a single tap does **not**
   apply. A second deliberate tap applies it.
2. Perform any action, then **Undo** → a transient toast names what was undone
   and for which player.
3. On two synced devices, undo on one → both show a matching message.

### US6 — Wrap-up + rematch (P3)
1. Finish a game → the winner (or co-winners on a tie) is clearly celebrated.
2. Use **Share** → native share sheet opens, or (no native share) a summary is
   copied to the clipboard with a confirmation.
3. Use **Rematch** → Home setup opens pre-filled with the same player names; no
   retyping needed.

### US7 — Comfortable layout + motion (P3)
1. Start a 6-player game on a 375px-wide viewport → all boards stay legible,
   cells remain ≥44px tappable, nothing clipped.
2. Enable OS reduced-motion → non-essential animations are suppressed while
   marks/locks/turn changes remain visually perceivable.
3. Inspect marked vs disabled cells in both themes → distinguishable by glyph/
   opacity, not colour alone.

## Automated checks

```bash
bun test shared server      # domain (advanceTurn wrap-around) + server validation
bun run test:e2e            # Playwright incl. two-context sync + axe a11y
bun run test:perf           # interaction budget at max player count
bun run check && bun run typecheck
```

### Key test cases to expect

- `shared/tests/domain/turn.test.ts`: advance wraps last→first; completed game
  is a no-op; missing `activePlayerId` normalises to `players[0]`.
- `server/tests/routes/current.put.test.ts`: `activePlayerId` round-trips;
  unknown id → `INVALID_PAYLOAD`; absent field accepted.
- e2e: turn highlight syncs across two browser contexts; undo toast text matches
  on both; theme persists across reload but does **not** cross devices.
