---
description: "Task list for UI/UX Enhancements"
---

# Tasks: UI/UX Enhancements

**Input**: Design documents from `/specs/003-ux-enhancements/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/turn-state.md, quickstart.md

**Tests**: INCLUDED. The plan's Constitution Check (§II Testing Standards) mandates TDD — new domain logic and server validation get failing unit tests first, and each user-facing story gets at least one Playwright integration test (with axe a11y where surfaces are new).

**Organization**: Tasks are grouped by user story (US1–US7) to enable independent implementation and testing. Story priorities come from spec.md: US1/US2 = P1, US3/US4/US5 = P2, US6/US7 = P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)
- Paths follow the Bun-workspace monorepo: `shared/`, `server/`, `client/`, and root-level `tests/`

## Path Conventions

- Shared domain + types: `shared/src/...`, tests in `shared/tests/...`
- Server: `server/src/...`, tests in `server/tests/...`
- Client: `client/src/...`
- e2e (Playwright): `tests/e2e/`; perf (bun bench): `tests/perf/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure prep for new client utility modules

- [X] T001 Create `client/src/lib/` directory for the new platform-API wrapper modules (`haptics.ts`, `theme.ts`) per plan.md Project Structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared UI primitive used by more than one user story

**⚠️ CRITICAL**: The `Toast` primitive is consumed by US5 (undo notice) and US6 (share confirmation); build it before those stories.

- [X] T002 [P] Create transient `Toast` component with `role="status"` / `aria-live="polite"` and auto-dismiss in `client/src/components/Toast.tsx`
- [X] T003 [P] Add Toast styling (transient/animated, reduced-motion-aware) in `client/src/components/Toast.module.css`

**Checkpoint**: Foundation ready — user stories can now proceed (in parallel if staffed).

---

## Phase 3: User Story 1 - See where points come from (Priority: P1) 🎯 MVP

**Goal**: Display each colored row's current point value on a board while points are visible, updating immediately on mark/unmark/lock.

**Independent Test**: Start a game, mark cells across rows on one board → each row shows its current value, updating per mark; lock a row → score reflects the bonus; toggle Hide points → per-row scores hide with the grand total.

### Tests for User Story 1 ⚠️ (write first, ensure they FAIL)

- [X] T004 [P] [US1] Playwright integration test for per-row scores (marks update row value; lock adds bonus; Hide/Show points hides/shows row scores with the grand total) in `tests/e2e/04-per-row-scores.spec.ts`

### Implementation for User Story 1

- [X] T005 [US1] Render each row's current value in `client/src/components/Row.tsx` using `scoreForRow(row)` from `shared`, gated on the existing `showTotal` visibility prop (FR-001, FR-002)
- [X] T006 [US1] Add per-row score styling (aligned to the row, no layout shift) in `client/src/components/Row.module.css`
- [X] T007 [US1] Ensure `client/src/components/Scoreboard.tsx` threads the `showTotal` flag down to `Row` so per-row scores follow the grand-total visibility toggle

**Checkpoint**: US1 fully functional and independently testable — MVP candidate.

---

## Phase 4: User Story 2 - Know whose turn it is (Priority: P1)

**Goal**: Designate exactly one active player, highlight their board, allow advancing to the next player (wrap last→first), and sync the active player across devices.

**Independent Test**: Start a 3-player game → one board highlighted; tap Next player → highlight moves by position and wraps after the last; on a second synced device the active player matches.

### Tests for User Story 2 ⚠️ (write first, ensure they FAIL)

- [X] T008 [P] [US2] Unit tests for `advanceTurn` (wrap last→first, single-player no-op-safe, `completed` game returns unchanged, missing/unknown `activePlayerId` normalises to `players[0]`) in `shared/tests/domain/turn.test.ts`
- [X] T009 [P] [US2] Extend server validation tests: `activePlayerId` round-trips on PUT, unknown id → `INVALID_PAYLOAD` (path `activePlayerId`), absent field accepted in `server/tests/routes/current.put.test.ts`
- [X] T010 [P] [US2] Playwright two-context (two-device) e2e: advancing the turn on one context updates the active highlight on the other in `tests/e2e/05-turn-sync.spec.ts`

### Implementation for User Story 2

- [X] T011 [US2] Add optional `activePlayerId: string` field to `GameState` in `shared/src/types/game.ts` (data-model.md)
- [X] T012 [US2] Initialise `activePlayerId = players[0].id` in `shared/src/domain/createGame.ts`
- [X] T013 [US2] Create pure immutable `advanceTurn(game): GameState` (next by `position`, wrap last→first, no-op on `completed`, defensive normalise of missing/unknown id; does NOT append to `actionLog`) in `shared/src/domain/turn.ts`
- [X] T014 [US2] Export `advanceTurn` from `shared/src/index.ts`
- [X] T015 [US2] Validate `activePlayerId` in `server/src/validation/gameState.ts` (optional; when present must be non-empty and match a `players[i].id`; not required on completed games) per contracts/turn-state.md
- [X] T016 [US2] Add an `advanceTurn` action to `client/src/store/gameStore.ts` and normalise a missing/unknown `activePlayerId` to `players[0].id` on load (rides the existing debounced PUT → SSE sync, FR-005)
- [X] T017 [US2] Add active-player highlight to `client/src/components/Scoreboard.tsx` + `Scoreboard.module.css` (distinguishable by more than colour alone)
- [X] T018 [US2] Add the "Next player" control and turn-highlight wiring to `client/src/screens/PlayScreen.tsx` + `PlayScreen.module.css`

**Checkpoint**: US1 and US2 both work independently.

---

## Phase 5: User Story 3 - Feel a confirmation when marking (Priority: P2)

**Goal**: Emit a brief haptic pulse on a successful mark, lock, or penalty; silent no-op where unsupported or where the tap did not change state.

**Independent Test**: On a vibration-capable device, mark/lock/penalty → brief pulse; on desktop → no error; tap a disabled/already-marked cell → no pulse.

### Tests for User Story 3 ⚠️ (write first, ensure they FAIL)

- [X] T019 [P] [US3] Playwright integration test asserting mark/lock/penalty complete with no error when `navigator.vibrate` is absent, and a stubbed `navigator.vibrate` is called only on state-changing taps (not on disabled cells) in `tests/e2e/06-haptics.spec.ts`

### Implementation for User Story 3

- [X] T020 [P] [US3] Create `pulse()` wrapper guarding `navigator.vibrate(<short ms>)` with a feature check (silent no-op when unsupported) in `client/src/lib/haptics.ts`
- [X] T021 [US3] Call `pulse()` from the success branch of `markCell`, `lockRow`, and `takePenalty` in `client/src/store/gameStore.ts` (fire only after a real state change; never on remote/SSE updates) per FR-006

**Checkpoint**: US3 adds tactile feedback without affecting other stories.

---

## Phase 6: User Story 4 - Choose light or dark theme (Priority: P2)

**Goal**: Manual light/dark/system theme selection that applies immediately, persists per-device across sessions, and can fall back to the OS preference.

**Independent Test**: Pick Light then Dark → appearance changes immediately, overriding the OS; reload → choice persists; choose System → tracks the device preference; the choice does not cross to another synced device.

### Tests for User Story 4 ⚠️ (write first, ensure they FAIL)

- [X] T022 [P] [US4] Playwright + axe test: selecting a theme changes appearance immediately and overrides system; reload persists the choice; System follows the media query; toggle passes axe a11y in `tests/e2e/07-theme-toggle.spec.ts`

### Implementation for User Story 4

- [X] T023 [P] [US4] Create theme module managing `'light' | 'dark' | 'system'` in `localStorage` key `qwixx-theme` (default `system`), applied via `document.documentElement.dataset.theme`, with load/apply/persist helpers in `client/src/lib/theme.ts`
- [X] T024 [US4] Refactor `client/src/design/tokens.css`: keep light defaults in `:root`, apply dark tokens for both `@media (prefers-color-scheme: dark)` (when no explicit choice) and `:root[data-theme='dark']`, add a `:root[data-theme='light']` reset (FR-007)
- [X] T025 [US4] Apply the persisted theme before first paint in `client/src/main.tsx` (synchronous read+apply to avoid a flash)
- [X] T026 [US4] Create `ThemeToggle` component (light/dark/system selector) in `client/src/components/ThemeToggle.tsx`
- [X] T027 [US4] Mount `ThemeToggle` in the play/home UI (e.g. `client/src/screens/PlayScreen.tsx` toolbar) using existing button patterns and design tokens

**Checkpoint**: US4 theme control works and persists per-device.

---

## Phase 7: User Story 5 - Avoid accidental penalties and understand undos (Priority: P2)

**Goal**: Require an explicit two-step confirmation before applying a penalty, and show a transient toast describing any undone action (local or remote).

**Independent Test**: Tap the next penalty → it arms ("Confirm −5?"); a single tap does not apply, a second deliberate tap does. Perform an action then Undo → a toast names what was undone and for whom; on two synced devices the message matches.

### Tests for User Story 5 ⚠️ (write first, ensure they FAIL)

- [X] T028 [P] [US5] Playwright integration test: a single tap on the penalty does NOT apply −5 (SC-004); a second deliberate tap applies it; tapping elsewhere/timeout disarms in `tests/e2e/08-penalty-guard.spec.ts`
- [X] T029 [P] [US5] Playwright two-context e2e: an undo on one device shows a matching undo-notice toast (action + player name) on both in `tests/e2e/09-undo-notice.spec.ts`

### Implementation for User Story 5

- [X] T030 [P] [US5] Add per-board arm/confirm state to the penalty flow (first tap arms "Confirm −5?", second tap applies via existing `takePenalty`, tapping elsewhere or a short timeout disarms) in `client/src/components/PenaltyTrack.tsx` (+ `client/src/components/PenaltyTrack.module.css`) and `client/src/components/Scoreboard.tsx` (FR-009)
- [X] T031 [P] [US5] Derive an Undo Notice by detecting that `actionLog` shrank by its last entry across a state change (local or SSE), resolving `kind`/`playerId`(→name)/`color`/`cellIndex` into a message in `client/src/store/persistence.ts` (FR-010)
- [X] T032 [US5] Surface the undo notice via the `Toast` component on `client/src/screens/PlayScreen.tsx` (auto-dismiss; reconstructed independently on each device, no new synced field)

**Checkpoint**: US5 protects penalties and explains undos across devices.

---

## Phase 8: User Story 6 - Wrap up and play again (Priority: P3)

**Goal**: Celebrate the winner (co-winners on a tie), produce a shareable/copyable result summary, and start a rematch pre-filled with the same player names.

**Independent Test**: Finish a game → winner/co-winners clearly celebrated; Share → native share sheet or clipboard fallback with confirmation; Rematch → Home opens pre-filled with the same names.

### Tests for User Story 6 ⚠️ (write first, ensure they FAIL)

- [X] T033 [P] [US6] Playwright integration test: final screen celebrates the winner (and presents a multi-way tie as co-winners); Share copies a readable summary when native share is absent; Rematch opens Home pre-filled with the same names (no retyping, SC-006) in `tests/e2e/10-wrapup-rematch.spec.ts`

### Implementation for User Story 6

- [X] T034 [US6] Strengthen winner/tie celebration using `winner(game)` (all co-winners, `topScore`) in `client/src/screens/FinalScoresScreen.tsx` + `FinalScoresScreen.module.css` (FR-011)
- [X] T035 [US6] Add a Share action building a plain-text summary (players + totals + winner line), calling `navigator.share({ text })` when available and falling back to `navigator.clipboard.writeText` + a `Toast` confirmation, in `client/src/screens/FinalScoresScreen.tsx` (FR-012)
- [X] T036 [US6] Add a Rematch action that seeds the existing `qwixx-recent-names` localStorage key with the finished game's player names and routes to Home in `client/src/screens/FinalScoresScreen.tsx` (FR-013); verify `client/src/screens/HomeScreen.tsx` pre-populates from that key on mount

**Checkpoint**: US6 closes the end-of-game loop and speeds repeat play.

---

## Phase 9: User Story 7 - Comfortable layout and motion (Priority: P3)

**Goal**: Adapt board density to player count so boards stay legible at the max count on narrow screens, suppress non-essential motion under reduced-motion, and keep marked/disabled states distinguishable by more than colour.

**Independent Test**: 6-player game at 375px → boards legible, cells ≥44px tappable, nothing clipped; OS reduced-motion → non-essential animation suppressed while state changes stay perceivable; marked vs disabled cells differ by glyph/opacity in both themes.

### Tests for User Story 7 ⚠️ (write first, ensure they FAIL)

- [X] T037 [P] [US7] Playwright test at a 375px viewport with 6 players asserting cells remain ≥`--qx-tap-min` (44px) and content is not clipped (SC-007) in `tests/e2e/11-layout-density.spec.ts`
- [X] T038 [P] [US7] Perf test asserting mark→repaint stays within the interaction budget at 6 players (max layout density) in `tests/perf/layout.bench.test.ts`

### Implementation for User Story 7

- [X] T039 [P] [US7] Adapt board density to player count while preserving the `--qx-tap-min` tappable target at 6 players in `client/src/screens/PlayScreen.module.css` (FR-014)
- [X] T040 [P] [US7] Extend `@media (prefers-reduced-motion: reduce)` coverage across board/toast/transition animations (suppress non-essential motion, keep state changes perceivable) in `client/src/components/Cell.module.css`, `client/src/components/Toast.module.css`, and `client/src/screens/PlayScreen.module.css` (FR-015)
- [X] T041 [P] [US7] Ensure marked and disabled cell states are distinguishable by more than colour (glyph + opacity/tile) in both themes in `client/src/components/Cell.module.css` (FR-016)

**Checkpoint**: All seven user stories are independently functional.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Validation and quality gates across all stories

- [X] T042 [P] Run `bun test shared server` (domain + server validation incl. `advanceTurn` and `activePlayerId`)
- [~] T043 [P] Run `bun run test:e2e` (Playwright incl. two-context sync + axe a11y) and `bun run test:perf` — perf suite PASSES; the 8 Playwright specs are authored & registered, but the e2e run could not execute in this sandbox: the harness boots every project's `bun --watch` server, exceeding the 128 inotify-instance cap (`ProcessFdQuotaExceeded`). Run on a normal dev machine.
- [X] T044 [P] Run `bun run check && bun run typecheck` (Biome + tsc across the three project references)
- [~] T045 Execute the manual quickstart.md verification for all seven stories (incl. backward compatibility of a pre-existing current game with no `activePlayerId`) — manual step; not executed in this non-interactive environment.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup; the `Toast` primitive blocks US5 and US6
- **User Stories (Phase 3–9)**: Depend on Setup; US5/US6 additionally depend on the `Toast` primitive (Phase 2). Otherwise stories are independent and can run in parallel
- **Polish (Phase 10)**: Depends on all targeted stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — only touches `Row`/`Scoreboard` rendering
- **US2 (P1)**: Independent — adds the shared turn-state domain + server validation + play UI
- **US3 (P2)**: Independent — adds `haptics.ts` and store-success hooks
- **US4 (P2)**: Independent — adds `theme.ts`, tokens refactor, toggle
- **US5 (P2)**: Depends on Foundational `Toast` (T002–T003)
- **US6 (P3)**: Depends on Foundational `Toast` (T002–T003)
- **US7 (P3)**: Independent — CSS only (note: T040 touches `Toast.module.css`, so order after T003)

### Within Each User Story

- Tests are written FIRST and must FAIL before implementation (TDD per plan §II)
- Shared types/domain before server validation before client store/UI (US2)
- `lib/` wrappers before the store/UI that call them (US3, US4)

### Parallel Opportunities

- T002 and T003 (Foundational) run in parallel
- Once Setup + Foundational complete, the four independent stories (US1, US2, US3, US4, US7) can proceed in parallel; US5/US6 join after Toast exists
- Within a story, tasks marked [P] (distinct files, no shared dependency) run in parallel — e.g. T008/T009/T010 (US2 tests), T030/T031 (US5), T039/T040/T041 (US7)
- All Polish tasks T042–T044 run in parallel

---

## Parallel Example: User Story 2

```bash
# Write the failing tests together (TDD):
Task: "Unit tests for advanceTurn in shared/tests/domain/turn.test.ts"   # T008
Task: "Extend server validation tests in server/tests/routes/current.put.test.ts"  # T009
Task: "Two-context turn-sync e2e in tests/e2e/05-turn-sync.spec.ts"       # T010

# Then implement shared → server → client in dependency order (T011 → T018).
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup (T001)
2. Phase 3: US1 (T004–T007)
3. **STOP and VALIDATE**: per-row scores update live and follow the points toggle
4. Demo / ship

### Incremental Delivery (priority order)

1. Setup + Foundational → foundation ready
2. US1 (P1) → per-row scores → demo
3. US2 (P1) → turn tracking + sync → demo
4. US3, US4, US5 (P2) → haptics, theme, penalty guard + undo notice → demo
5. US6, US7 (P3) → wrap-up/rematch, layout/motion polish → demo
6. Phase 10 polish gates (tests, lint, typecheck, quickstart)

### Parallel Team Strategy

After Setup + Foundational: Dev A on US1+US2 (domain-heavy), Dev B on US3+US4 (client libs), Dev C on US5+US6 (Toast-dependent), Dev D on US7 (CSS). Stories integrate independently.

---

## Notes

- [P] = different files, no incomplete dependency
- Theme preference, undo notice, per-row scores, and penalty arm/confirm are NOT synced fields — only `activePlayerId` enters `GameState` (contracts/turn-state.md)
- `advanceTurn` must stay pure/immutable and must not append to `actionLog`
- Verify each test FAILS before implementing
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
