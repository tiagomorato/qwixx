# Implementation Plan: Manual Per-Color Score Entry

**Branch**: `002-manual-score-entry` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-manual-score-entry/spec.md`

## Summary

Add a row of four colored, manually editable point fields (red, yellow, green, blue) to every
player's in-game scoreboard, positioned between the penalty tracker ("Penalties: N of 4") and the
"Take Penalty" button. The fields let the scorekeeper hand-record per-color totals at game end.
Values are purely informational: they persist with the in-progress game (via the existing
`current.json` PUT flow) but never feed automatic scoring, totals, or the final-scores screen.

Technically this extends the shared `PlayerState` type with a `manualScores: Record<Color, number |
null>` field, initializes it in `createGame`, adds a non-logged `setManualScore` store action,
makes server validation and client hydration backward-compatible for games saved before this
feature, and renders a new `<ManualScores>` component in the scoreboard.

## Technical Context

**Language/Version**: TypeScript 5.x, ES2022 target (unchanged from feature 001).

**Primary Dependencies**: Bun (≥1.2) runtime/test runner; React 18 + Zustand 4 + Vite 5 frontend;
`Bun.serve` server; Biome (lint/format); Playwright + `@axe-core/playwright` (E2E + a11y). No new
dependencies are introduced by this feature.

**Storage**: Existing JSON files — `data/current.json` (single in-progress game) and
`data/history.json`. The `manualScores` field is added to each persisted `PlayerState`. Games saved
before this feature lack the field and MUST load cleanly (treated as all-empty).

**Testing**: `bun test` for shared domain + server validation units; Playwright for the P1/P2 user
stories and accessibility; existing `bun bench` perf budgets remain unaffected.

**Target Platform**: Modern evergreen browsers (desktop + mobile); Bun ≥1.2 locally.

**Project Type**: Web application — existing three-project Bun workspace (`shared`, `server`,
`client`).

**Performance Goals**: Typing into a manual field MUST update the UI within the existing 100 ms p95
gesture budget. No new hot paths; `manualScores` is O(1) per edit and adds <1 KB to game JSON.

**Constraints**: Fully offline after first load; single hot-seat writer; `data/` committed to git.
Manual values MUST NOT alter any computed value (FR-012) — this is an additive, side-effect-free
field on `PlayerState`.

**Scale/Scope**: ≤6 players × 4 colored fields = ≤24 manual values per game; trivially small.
One new component, one new store action, one type field, one validation extension. No new screens.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

Reference: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0.

| Principle | Compliance plan | Verdict |
|-----------|-----------------|---------|
| I. Code Quality (NON-NEGOTIABLE) | Biome + `tsc --noEmit` continue to gate. One new single-purpose component (`ManualScores`), one new store action, one additive type field. No duplication: the colored-field rendering reuses existing color tokens; numeric parsing lives in one helper. `Take Penalty` button is extracted from `PenaltyTrack` so each component stays single-purpose. | PASS |
| II. Testing Standards (NON-NEGOTIABLE) | TDD: failing unit tests first for (a) `createGame` initializing `manualScores`, (b) `setManualScore` updating only the targeted player/color and NOT appending to `actionLog`, (c) `totalScore`/`winner` ignoring `manualScores`, (d) server `validateGameState` accepting absent and valid `manualScores` and rejecting bad ones, (e) hydration normalizing legacy games. Playwright E2E covers US1 (enter + persist) and US2 (edit/clear). axe-core asserts the fields are labeled. | PASS |
| III. UX Consistency | Fields consume existing color tokens (`--qx-color-{color}-border`) so they match the board's color language; each field carries a visible color cue AND a programmatic label (`aria-label="Red score for {name}"`) — color is never the sole signal. Numeric-only input with the same `inputMode="numeric"` affordance used elsewhere. The `Take Penalty` button keeps identical text, role, and disabled logic, so existing affordances/selectors are unchanged. Accessibility verified by axe-core in E2E. | PASS |
| IV. Performance Requirements | No new benchmarked hot path. Edits are local state updates that flow through the existing debounced persistence; the 100 ms gesture budget is asserted implicitly by the existing E2E latency checks and is not regressed. No optimization claims made. | PASS |

**No principle violations require justification.** Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-manual-score-entry/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/
    └── manual-scores.md # Phase 1 output — delta to the current.json PUT contract
```

(`tasks.md` is produced later by `/speckit-tasks`, not by this command.)

### Source Code (repository root)

Files this feature touches (existing tree from feature 001; ★ = new, ✎ = modified):

```text
shared/src/
├── types/player.ts            ✎ add `manualScores: Record<Color, number | null>`
└── domain/createGame.ts       ✎ initialize manualScores to all-null per player
shared/tests/domain/
├── createGame.test.ts         ✎ assert manualScores initialized empty
└── score.test.ts (or new)     ★ assert totalScore/winner ignore manualScores

server/src/validation/gameState.ts  ✎ validate optional manualScores (null | int ≥ 0)
server/tests/                        ✎ validation cases for manualScores

client/src/
├── components/
│   ├── ManualScores.tsx            ★ four colored numeric fields, one per color
│   ├── ManualScores.module.css     ★ colored-field styling from tokens
│   ├── PenaltyTrack.tsx            ✎ remove the Take Penalty button (becomes count + cells only)
│   ├── PenaltyTrack.module.css     ✎ drop button styles
│   ├── TakePenaltyButton.tsx       ★ extracted button (identical text/role/disabled)
│   ├── TakePenaltyButton.module.css★ moved button styles
│   ├── Scoreboard.tsx              ✎ render PenaltyTrack → ManualScores → TakePenaltyButton
│   └── Scoreboard.module.css       ✎ spacing for the new ordered block (if needed)
└── store/
    └── gameStore.ts                ✎ add setManualScore + normalize legacy games in hydrate

tests/e2e/
└── 04-manual-scores.spec.ts        ★ US1 + US2 Playwright flow incl. persistence + axe
```

**Structure Decision**: No new project or layer. The feature lives entirely within the existing
`shared` (type + creation), `server` (validation), and `client` (store + components) projects of the
Bun workspace. The only structural refactor is splitting the `Take Penalty` button out of
`PenaltyTrack` so the new `ManualScores` row can sit *between* the penalty tracker and the button, as
the spec requires (FR-003), while keeping each component single-purpose.

## Complexity Tracking

*No violations to justify. Section intentionally empty.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
