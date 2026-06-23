---
description: "Task list for Manual Per-Color Score Entry"
---

# Tasks: Manual Per-Color Score Entry

**Input**: Design documents from `/specs/002-manual-score-entry/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/manual-scores.md, quickstart.md

**Tests**: INCLUDED. Constitution II (Testing Standards) is NON-NEGOTIABLE and the plan mandates TDD, so each phase writes failing tests before implementation.

**Organization**: Tasks are grouped by user story. Foundational data/persistence plumbing (shared type, createGame, validation, store action, hydration) is shared by both stories and lives in Phase 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1, US2)
- Exact file paths are included in every task

## Path Conventions

Bun workspace from feature 001: `shared/` (types + domain), `server/` (validation + routes), `client/` (store + components), `tests/e2e/` (Playwright). Unit tests: `bun test` runs `shared` + `server`; client store tests run via `bun test client/...`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm a clean baseline before touching code. No new dependencies are introduced by this feature.

- [ ] T001 Establish a green baseline by running `bun test`, `bun run typecheck`, and `bun run check` from the repo root; confirm all pass before making changes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the `manualScores` data field and its non-UI plumbing (type, creation, server validation, store action, legacy hydration). Both user stories depend on this layer.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for Foundational (write first, ensure they FAIL) ⚠️

- [ ] T002 [P] In `shared/tests/domain/createGame.test.ts`, add a test asserting every player created by `createGame` has `manualScores` equal to `{ red: null, yellow: null, green: null, blue: null }`.
- [ ] T003 [P] In `shared/tests/domain/score.test.ts`, add tests asserting `totalScore`, `winner`, and `gameShouldEnd` produce identical results whether or not players carry non-null `manualScores` (FR-012: manual values are ignored by all derived functions).
- [ ] T004 [P] In `server/tests/routes/current.put.test.ts`, add `validateGameState` cases: (a) a player with no `manualScores` is accepted (legacy save); (b) `manualScores` with `null`/non-negative-integer values is accepted; (c) a negative number, a non-integer, a non-number/non-null, and an unknown color key are each rejected with error path `players[i].manualScores.<color>`.
- [ ] T005 [P] In `client/src/store/gameStore.test.ts` (run via `bun test client/src/store/gameStore.test.ts`), add tests asserting: `setManualScore(playerId, color, value)` updates only the targeted player+color and leaves other players/colors unchanged (SC-004); the call appends **nothing** to `actionLog` and triggers no game-end/finalize; `setManualScore(playerId, color, null)` clears the value to `null`; and hydrating a game whose players lack `manualScores` normalizes each player to all-`null`.

### Implementation for Foundational

- [ ] T006 Extend `PlayerState` in `shared/src/types/player.ts` with `manualScores: Record<Color, number | null>` (import `Color` from the shared color type); update the re-export in `shared/src/index.ts` if the type surface changes.
- [ ] T007 In `shared/src/domain/createGame.ts`, initialize every player with `manualScores: { red: null, yellow: null, green: null, blue: null }` (depends on T006).
- [ ] T008 In `server/src/validation/gameState.ts`, validate `manualScores` per player as **optional**: absent ⇒ valid; if present, every key must be one of `COLORS` and every value must be `null` or `Number.isInteger(v) && v >= 0`, emitting `{ path: "players[i].manualScores.<color>", message }` on failure (depends on T006).
- [ ] T009 In `client/src/store/gameStore.ts`, add a `setManualScore(playerId, color, value: number | null)` action that clones the game and sets `players[i].manualScores[color]`, replacing the `game` reference so the existing debounced persistence subscription fires; it MUST NOT append to `actionLog`, call `gameShouldEnd`/`finalize`, or be reversed by `undo` (depends on T006).
- [ ] T010 In `client/src/store/gameStore.ts`, normalize legacy games during `hydrate`: for each player missing `manualScores` (or missing any color key) default the absent keys to `null` so the all-four-keys invariant always holds in memory (depends on T006; same file as T009 — sequential).

**Checkpoint**: Type, creation, validation, store action, and hydration are in place and unit-tested. UI work can begin.

---

## Phase 3: User Story 1 - Record final per-color points by hand (Priority: P1) 🎯 MVP

**Goal**: Show four colored numeric entry fields on each player's scoreboard, ordered red/yellow/green/blue, positioned between the penalty tracker and the "Take Penalty" button; typed values are independent, persist with the in-progress game, and never affect scoring.

**Independent Test**: In an active game, locate the four colored fields on a player's board, type red 12 / yellow 8 / green 15 / blue 6, confirm each value stays in its own field and the player's Total is unchanged, then reload the app and confirm the values persist.

### Tests for User Story 1 (write first, ensure they FAIL) ⚠️

- [ ] T011 [P] [US1] Create `tests/e2e/04-manual-scores.spec.ts` with a US1 flow: start a game, assert four fields are visible in a single horizontal row ordered red/yellow/green/blue and positioned below "Penalties: N of 4" and above "Take Penalty" (SC-001); type a value into each field and assert each field holds only its own value while the player's Total is unchanged (FR-005, FR-006, FR-012); reload the app and assert the values persist (FR-009, SC-003); and run `@axe-core/playwright` asserting the fields are labeled with no a11y violations.

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create `client/src/components/TakePenaltyButton.tsx` and `client/src/components/TakePenaltyButton.module.css` by extracting the existing "Take Penalty" button from `PenaltyTrack` — identical text, role, and `disabled` logic (`completed || penalties >= 4`) so existing selectors and affordances are unchanged.
- [ ] T013 [P] [US1] In `client/src/components/PenaltyTrack.tsx`, remove the "Take Penalty" button so the component renders only the penalty legend + cells; drop the now-unused button styles from `client/src/components/PenaltyTrack.module.css`.
- [ ] T014 [P] [US1] Create `client/src/components/ManualScores.tsx` and `client/src/components/ManualScores.module.css`: four controlled `<input inputMode="numeric">` fields (one per color, ordered red/yellow/green/blue) whose value is `manualScores[color]` (empty string when `null`); each field carries a visible color cue from `--qx-color-{color}-*` tokens AND `aria-label="{Color} score for {playerName}"`; the change handler stores a valid non-negative integer via `setManualScore` and rejects non-numeric input (FR-008); editing is enabled only while the game is active.
- [ ] T015 [US1] In `client/src/components/Scoreboard.tsx`, render in order rows → `PenaltyTrack` → `ManualScores` → `TakePenaltyButton`, and adjust `client/src/components/Scoreboard.module.css` spacing for the new ordered block (depends on T012, T013, T014).

**Checkpoint**: User Story 1 is fully functional — fields appear in the required location, accept numbers, persist across reload, and do not affect scoring. This is the MVP.

---

## Phase 4: User Story 2 - Correct an entered value (Priority: P2)

**Goal**: Let the scorekeeper change or clear a single field without affecting other colors or other players.

**Independent Test**: With values already entered, replace one field's value with a different number (only that field changes) and clear another field to empty (others unaffected).

### Tests for User Story 2 (write first, ensure they FAIL) ⚠️

- [ ] T016 [US2] Add a US2 describe block to `tests/e2e/04-manual-scores.spec.ts`: replace an existing value in one field and assert only that field changes (FR-006, SC-004); clear a field (delete its contents) and assert it becomes empty while others are unaffected (FR-011); type a non-numeric character and assert it is not stored (FR-008); and enter values on a second player's board to assert per-player independence (FR-010) (same file as T011 — sequential).

### Implementation for User Story 2

- [ ] T017 [US2] In `client/src/components/ManualScores.tsx`, complete the change handler's clear/edit semantics: an empty input string calls `setManualScore(playerId, color, null)` (FR-011) and replacing a value writes the new integer, leaving sibling fields and other players untouched (depends on T014; same file as T014 — sequential).

**Checkpoint**: User Stories 1 and 2 both work independently — entry, edit, and clear all behave per spec.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify the whole feature against the suite, gates, and quickstart.

- [ ] T018 [P] Run `bun test` (shared + server) and `bun test client/src/store/gameStore.test.ts`; confirm all unit tests pass.
- [ ] T019 [P] Run `bun run typecheck`; confirm `tsc --noEmit` passes for shared, server, and client.
- [ ] T020 [P] Run `bun run check` (Biome lint/format); fix any findings with `bun run check:fix`.
- [ ] T021 Run `bunx playwright test tests/e2e/04-manual-scores.spec.ts`; confirm US1, US2, persistence, and axe-core checks pass.
- [ ] T022 Execute the manual walkthrough in `specs/002-manual-score-entry/quickstart.md` (US1 entry + persist, US2 edit/clear, per-player independence, new-game empties) and confirm SC-001..SC-004.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS both user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational. No dependency on US2.
- **User Story 2 (Phase 4)**: Depends on Foundational and on the `ManualScores` component from US1 (T014); otherwise independently testable.
- **Polish (Phase 5)**: Depends on all desired user stories being complete.

### Key Task Dependencies

- T006 (type) blocks T007, T008, T009, T010, and all of US1/US2.
- T007–T010 should follow their respective failing tests (T002–T005).
- T015 depends on T012, T013, T014.
- T016/T017 (US2) depend on T014 (the component) and reuse the T011 E2E file.
- T009 and T010 share `gameStore.ts` → run sequentially. T014 and T017 share `ManualScores.tsx` → run sequentially.

### Parallel Opportunities

- Foundational tests T002, T003, T004, T005 are all `[P]` (different files).
- After T006, implementation T007 / T008 / T009 can proceed in parallel (different files); T010 follows T009 (same file).
- US1 components T012, T013, T014 are `[P]` (different files); T015 integrates them.
- Polish T018, T019, T020 are `[P]`.

---

## Parallel Example: Foundational tests

```bash
# Launch the four foundational test tasks together (different files):
Task: "createGame manualScores test in shared/tests/domain/createGame.test.ts"
Task: "score/winner/end ignore manualScores in shared/tests/domain/score.test.ts"
Task: "validateGameState manualScores cases in server/tests/routes/current.put.test.ts"
Task: "setManualScore + hydration test in client/src/store/gameStore.test.ts"
```

## Parallel Example: User Story 1 components

```bash
# After T006–T010, build the UI pieces in parallel (different files):
Task: "Extract TakePenaltyButton.tsx + .module.css"
Task: "Strip Take Penalty button from PenaltyTrack.tsx + .module.css"
Task: "Create ManualScores.tsx + .module.css"
# Then T015 wires them into Scoreboard.tsx.
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup (baseline green).
2. Phase 2: Foundational (type, createGame, validation, store action, hydration) — CRITICAL, blocks everything.
3. Phase 3: User Story 1 (fields render, accept numbers, persist, don't affect scoring).
4. **STOP and VALIDATE**: run the US1 E2E and quickstart US1 steps. Ship/demo.

### Incremental Delivery

1. Setup + Foundational → data layer ready.
2. US1 → enter + persist (MVP) → validate independently.
3. US2 → edit + clear → validate independently.
4. Polish → full suite, gates, quickstart.

---

## Notes

- `[P]` = different files, no incomplete dependencies.
- Verify each test FAILS before implementing (Constitution II / TDD).
- Manual values are purely informational (FR-012): no shared/domain function may read `manualScores`.
- Commit after each task or logical group; the optional Spec Kit git-commit hook can auto-commit.
