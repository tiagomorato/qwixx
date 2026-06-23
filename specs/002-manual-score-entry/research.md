# Phase 0 Research: Manual Per-Color Score Entry

The spec left no `NEEDS CLARIFICATION` markers; its Assumptions section already resolves the open
questions (entry allowed anytime, non-negative whole numbers, same local persistence, purely
informational). This document records the design decisions that turn those assumptions into a concrete
plan against the existing codebase.

## Decision 1 — Where the manual values live

**Decision**: Add `manualScores: Record<Color, number | null>` to `PlayerState` in
`shared/src/types/player.ts`. `null` represents an empty field.

**Rationale**: Manual scores belong to exactly one player (FR-010) and must persist with the
in-progress game (FR-009). The whole game already persists as one `GameState` object via the
`current.json` PUT flow, so attaching the values to `PlayerState` makes them persist for free with no
new endpoint or storage path. A `Record<Color, …>` keyed by the four existing colors keeps the four
fields independent (FR-006) and naturally enforces "exactly one field per color." `number | null`
distinguishes "empty" (FR-004, FR-011) from a real `0`.

**Alternatives considered**:
- *Separate top-level `manualScores` map keyed by playerId+color*: more plumbing, a second thing to
  keep in sync with the players array, and easy to orphan on player changes. Rejected.
- *Client-only state (e.g. `localStorage`, not in `GameState`)*: fails FR-009's requirement to
  persist via the same mechanism as the rest of the game and to travel with `data/`. Rejected.
- *`number | undefined` / omit empty keys*: makes "all four keys always present" non-uniform and
  complicates validation and rendering. `null` is explicit and JSON-friendly. Rejected.

## Decision 2 — Mutation is NOT a domain action (no action-log entry, no undo coupling)

**Decision**: Add a `setManualScore(playerId, color, value: number | null)` action to the Zustand
`gameStore` that clones the game and updates only `players[i].manualScores[color]`. It does **not**
append to `actionLog`, does **not** call `gameShouldEnd`/`finalize`, and is **not** reversed by
`undo`.

**Rationale**: FR-012 mandates the values are purely informational and never affect game flow.
`actionLog` exists solely to drive `undo` of real Qwixx moves (mark/lock/penalty); putting manual
edits there would let `undo` clear a typed number, which is surprising. Because `undo()` spreads
`...player` when reversing real actions, a `manualScores` field on `PlayerState` is preserved across
undo automatically — no extra code needed. The persistence subscription fires on any new `game`
object reference, so a plain state replacement triggers the existing debounced PUT (FR-009).

**Alternatives considered**:
- *Model it as a logged action*: couples informational data to undo and to `gameShouldEnd`. Violates
  FR-012's spirit. Rejected.
- *Put the helper in `shared/domain`*: it has no rules to enforce beyond "set a value"; a pure
  one-liner in the store is sufficient and keeps the domain layer about Qwixx rules. (A tiny pure
  helper can still be unit-tested via the store.) Rejected as unnecessary abstraction (Constitution I).

## Decision 3 — Backward compatibility for games saved before this feature

**Decision**: Server `validateGameState` treats `manualScores` as **optional**: absent ⇒ valid; if
present, each of the four color keys must be `null` or a non-negative integer. On the client,
`hydrate` normalizes any player missing `manualScores` (or missing a color key) to `null` before the
game enters the store.

**Rationale**: `data/current.json` already exists on disk without this field. The app must load it
cleanly (the user has a live in-progress game). Making the field optional in validation and
defaulting it on hydration avoids a forced "new game" and satisfies the "consistent with existing
state retention" clause of FR-009. New games get the field from `createGame`, so the absent case only
arises for legacy saves.

**Alternatives considered**:
- *Require the field and migrate on read in the server*: more invasive; the client already owns
  hydration normalization and the server stays a thin validator. Rejected.
- *Reject legacy saves*: would discard an in-progress game. Unacceptable. Rejected.

## Decision 4 — Numeric-only input handling

**Decision**: Render each field as a controlled `<input inputMode="numeric">` whose value is the
player's `manualScores[color]` (empty string when `null`). On change, parse the raw string: an empty
string ⇒ `null` (clear, FR-011); a valid non-negative integer ⇒ that number; anything else ⇒ reject
(do not store, FR-008). Bound editing to active games only (Assumptions: editable anytime while
active).

**Rationale**: FR-008 requires only numeric point values be stored, and Assumptions specify
non-negative whole numbers. Parsing-and-rejecting in the change handler is simpler and more reliable
across browsers than relying on `<input type="number">` quirks, and it keeps the field controlled so
state is the single source of truth (Constitution I). `inputMode="numeric"` surfaces the numeric
keypad on mobile, matching existing input affordances (Constitution III).

**Alternatives considered**:
- *`<input type="number">` uncontrolled*: inconsistent empty/invalid handling across browsers and
  allows `e`/`+`/`-`/decimals. Rejected.
- *Allow decimals/negatives*: contradicts Assumptions (non-negative whole points). Rejected.

## Decision 5 — Placement: split the "Take Penalty" button out of `PenaltyTrack`

**Decision**: Extract the `Take Penalty` button from `PenaltyTrack` into its own
`TakePenaltyButton` component, and have `Scoreboard` render, in order: rows → `PenaltyTrack` (penalty
legend + cells) → `ManualScores` → `TakePenaltyButton`.

**Rationale**: FR-003 and the US1 acceptance scenario require the four fields to sit *below* the
"Penalties: N of 4" tracker and *above* the "Take Penalty" button. Today both the tracker and the
button live in a single horizontal `PenaltyTrack` fieldset, so there is no slot between them. Splitting
the button out yields the exact vertical order with each component single-purpose (Constitution I).
The button keeps identical text ("Take Penalty"), role, and `disabled` logic
(`completed || penalties >= 4`), so existing Playwright selectors and the UX affordance are unchanged
(Constitution III).

**Alternatives considered**:
- *Inject `ManualScores` as `children` into `PenaltyTrack` between cells and button*: keeps one
  component but makes `PenaltyTrack` do two unrelated jobs and complicates its layout. Rejected in
  favor of clearer separation.
- *Render `ManualScores` after the existing `PenaltyTrack` (button included)*: would place the fields
  below the button, violating FR-003. Rejected.

## Decision 6 — Visual color cue + accessibility

**Decision**: Each field is wrapped with a visible color indicator built from the existing
`--qx-color-{color}-border` / surface tokens (e.g. a colored top border or swatch) plus a
programmatic label `aria-label="{Color} score for {playerName}"`. The four fields render in a single
horizontal row ordered red, yellow, green, blue (FR-002).

**Rationale**: FR-007 requires each field to indicate its color; Constitution III forbids color as
the sole signal and requires WCAG-AA labeling. Reusing the board's existing color tokens keeps the
design-system single source of truth (Constitution III) and matches the colored rows above. axe-core
in the E2E flow verifies the labels and contrast.

**Alternatives considered**:
- *Color-only fields (no text/label)*: fails accessibility gate. Rejected.
- *New bespoke color values*: duplicates the design tokens. Rejected.
