# Phase 0 Research: UI/UX Enhancements

All Technical Context items were resolvable from the existing codebase; there
are no remaining NEEDS CLARIFICATION. The decisions below resolve the design
questions each story raises.

## Turn State (FR-003, FR-004, FR-005)

**Decision**: Add a single field `activePlayerId: string` to `GameState`.
Initialise it to `players[0].id` in `createGame`. Add a pure
`advanceTurn(game)` domain function in `shared/src/domain/turn.ts` that moves to
the next player by `position` order and wraps from last to first. The active
player rides the existing synced `GameState`, so it propagates over SSE with no
new endpoint.

**Rationale**: Cross-device consistency (FR-005) is already solved for
`GameState` by the PUT→broadcast→SSE pipeline. Putting turn state *inside*
`GameState` reuses that pipeline verbatim and stays in one source of truth.
Turn order is a domain rule (constitution II names "turn order" explicitly as a
rule needing unit tests), so it belongs in `shared`, not in client-only state.

**Migration**: Previously persisted current/history games lack the field.
- `validateGameState` (server) treats `activePlayerId` as **optional**, but when
  present it MUST reference an existing player id.
- On read, a current game missing the field is normalised to `players[0].id`
  (defensive default) before use; the client `advanceTurn`/highlight tolerate it.
- Completed history games never need an active player and are unaffected.
This avoids a destructive rewrite of `data/history.json`.

**Edge cases**: Single advance with one remaining "valid" player is a no-op-safe
wrap. When the game is `completed`, `advanceTurn` returns the game unchanged
(the spec's "gracefully stop advancing" edge case). Concurrent
advance-vs-mark on two devices is last-write-wins under the existing
debounced-PUT model — acceptable because turn tracking is advisory (Assumptions)
and the SSE echo reconciles both devices to one state.

**Alternatives considered**: (a) Client-only turn state in Zustand — rejected,
cannot satisfy FR-005 cross-device sync. (b) A separate `/api/current/turn`
endpoint + field — rejected as redundant plumbing when `GameState` already
syncs. (c) Recording turn advances in `actionLog` — rejected; turns are not
scoring actions and would pollute undo semantics.

## Per-Row Score (FR-001, FR-002)

**Decision**: Display each row's current value in the `Row` component using the
existing `scoreForRow(row)` from `shared`. Gate visibility on the existing
`showTotal`/"Hide points" toggle already threaded through `Scoreboard`.

**Rationale**: `scoreForRow` already encodes the lock-counts-as-a-mark bonus
(FR-001 scenario 3) and returns 0 for an empty row (edge case). No domain change;
purely additive rendering. Reusing the existing show/hide prop gives FR-002 for
free.

**Alternatives considered**: Recomputing scores in the component — rejected,
duplicates the scoring table (constitution I, single source of truth).

## Haptic Feedback (FR-006)

**Decision**: A `client/src/lib/haptics.ts` wrapper exposing `pulse()` that
calls `navigator.vibrate(<short ms>)` guarded by a feature check. Invoke it from
the store's `markCell`/`lockRow`/`takePenalty` only **after** a successful state
change.

**Rationale**: The store mutators already short-circuit when there is no
game, and illegal taps never reach them (cells/penalties are `disabled`).
Firing inside the successful branch satisfies "only when the tap changes state"
(FR-006 scenario 3) without extra legality re-checks. `navigator.vibrate` is the
only portable haptic primitive on the web; absence (desktop, iOS Safari) makes
the guard a silent no-op (FR-006 scenario 2). A single short pulse avoids the
queueing/lag edge case.

**Alternatives considered**: The Web Vibration API via a React effect on state
change — rejected as harder to scope to "this specific action changed state"
and prone to firing on remote (SSE) updates.

## Theme Preference (FR-007, FR-008)

**Decision**: A `client/src/lib/theme.ts` module managing a `'light' | 'dark' |
'system'` value persisted in `localStorage`, applied by setting
`document.documentElement.dataset.theme`. Refactor `tokens.css`: keep the light
defaults in `:root`, move the existing dark block to apply for **both**
`@media (prefers-color-scheme: dark)` *when no explicit choice is set* **and**
`:root[data-theme='dark']`; add a `:root[data-theme='light']` reset. A
`ThemeToggle` component cycles/selects the value.

**Rationale**: A data-attribute override layered over the existing media query
is the standard pattern for "manual override that can fall back to system"
(FR-007 scenario 3). `localStorage` gives per-device persistence across reloads
(FR-008) and is intentionally **not** in `GameState`, so it never syncs
(Assumptions, Out of Scope). Read+apply must run before first paint to avoid a
flash — done in `main.tsx` (or an inline head script) synchronously.

**Alternatives considered**: A CSS class on `<body>` — equivalent; `data-theme`
chosen for consistency with the attribute-selector approach and easy
`:root` cascade. Syncing theme via `GameState` — explicitly out of scope.

## Penalty Mis-Tap Guard (FR-009)

**Decision**: Introduce a per-board two-step confirm in the penalty flow: the
first tap on the next penalty arms a confirm affordance (e.g. the box asks
"Confirm −5?"), a second deliberate tap within the same board applies it;
tapping elsewhere or a short timeout disarms. Implemented as local component
state in `Scoreboard`/`PenaltyTrack`; the actual apply still calls the existing
`takePenalty`.

**Rationale**: Penalties are irreversible-feeling (−5) and the spec requires "no
penalty applied without a deliberate confirmation" with zero single-tap
applications (SC-004). Keeping the guard in component state reuses the existing
domain `penalty` action unchanged and mirrors the existing confirm pattern used
for "discard current game" on `HomeScreen` (UX consistency).

**Alternatives considered**: A modal dialog per penalty — rejected as too heavy
for a fast play loop; an inline arm/confirm is quicker while still deliberate.

## Undo Notice (FR-010)

**Decision**: Derive the notice by diffing the action log across a state change.
On any game update (local *or* remote), if `actionLog` shrank by its last entry,
surface a transient toast describing that removed entry ("Undid <mark/lock/
penalty> for <player name>"). A small `Toast` component with `role="status"` /
`aria-live="polite"` renders it; it auto-dismisses.

**Rationale**: The removed `ActionLogEntry` already carries `kind`, `playerId`,
and (for marks) `color`/`cellIndex` — enough to describe what was undone and for
whom, mapping `playerId`→name via `game.players`. Diffing works identically for
the local undo and for the SSE-delivered remote undo (FR-010 scenario 3,
cross-device), so both devices show the same message without a new synced field.
`persistence.ts` already compares `state.game`/`prev.game`; the same subscriber
point can detect the shrink.

**Alternatives considered**: A synced "lastUndo" field on `GameState` — rejected
as redundant state when the action-log diff already reconstructs it, and it
would need its own validation + clearing logic.

## Share + Rematch (FR-011, FR-012, FR-013)

**Decision**: On `FinalScoresScreen`, (a) strengthen the winner/tie celebration
using `winner(game)` (already returns all co-winners and `topScore`); (b) a
Share action builds a plain-text summary (players + totals, winner line) and
calls `navigator.share({ text })` when available, falling back to
`navigator.clipboard.writeText` + a confirmation toast; (c) a Rematch action
seeds the existing `qwixx-recent-names` localStorage key (already read by
`HomeScreen` on mount) with the finished game's player names and routes to Home,
which pre-populates the setup form.

**Rationale**: `winner()` already presents ties as co-winners without implying a
single winner (FR-011). `HomeScreen` already hydrates names from
`qwixx-recent-names`, so rematch reuses that path for "no retyping" (SC-006)
rather than adding new prop plumbing. Native share with clipboard fallback
covers the "platform without native sharing" edge case (FR-012).

**Alternatives considered**: A dedicated rematch route carrying names as props —
workable but the recent-names localStorage path already exists and is the
smaller change.

## Layout Density + Reduced Motion + Colour-Blind States (FR-014, FR-015, FR-016)

**Decision**: Pure CSS. (a) Density: the `PlayScreen` boards container adapts via
existing responsive `@media (max-width: 540px)` rules already started on this
branch; ensure cells keep the `--qx-tap-min` (44px) tappable target at 6
players. (b) Reduced motion: extend the existing
`@media (prefers-reduced-motion: reduce)` blocks (already present in
`Cell.module.css`) across board-in/toast/transition animations, suppressing
non-essential motion while keeping state changes visible. (c) Colour-blind:
marked cells already render a bold ✕ glyph and disabled cells dim + drop the
tile (in-progress diff), so states differ by more than colour in both themes.

**Rationale**: These are presentation concerns with no logic; the design-token
system and existing media queries are the right and only place. The in-progress
branch diff already moves cells to a fluid fl: 1 layout and adds the colour
letter chip, which directly serves FR-016 and FR-014.

**Alternatives considered**: A JS-driven density switch by player count —
rejected; CSS media + flexbox handles it without re-render cost and respects the
performance budget.

## Cross-Cutting: No New Dependencies

Every capability maps to a platform API (`navigator.vibrate`, `navigator.share`,
`navigator.clipboard`, `localStorage`, `prefers-*` media queries) or existing
domain/UI code. This satisfies constitution I's dependency-justification bar by
adding none.
