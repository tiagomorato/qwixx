---

description: "Implementation task list for Qwixx Digital Scoreboard"
---

# Tasks: Qwixx Digital Scoreboard

**Input**: Design documents from `/specs/001-qwixx-scoreboard/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Included. Constitution Principle II (NON-NEGOTIABLE) mandates a failing Bun unit test before every domain rule and server endpoint, and one Playwright E2E test per P1/P2/P3 user story.

**Organization**: Tasks are grouped by user story (US1=P1, US2=P2, US3=P3) so each can be implemented and demoed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story tag — required for Phase 3+ user-story tasks
- Every task includes an exact file path

## Path Conventions (from plan.md)

- Pure domain library: `shared/src/`
- Bun HTTP server: `server/src/`
- React + Vite SPA: `client/src/`
- Cross-cutting tests: `tests/perf/`, `tests/e2e/`
- Persisted state (tracked in git): `data/current.json`, `data/history.json`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bun workspace, TypeScript, tooling, and on-disk persistence skeleton.

- [X] T001 Create top-level directories (`shared/src`, `server/src`, `client/src`, `tests/perf`, `tests/e2e`, `data/`) at repo root
- [X] T002 Initialize root `package.json` declaring Bun workspaces `["shared", "server", "client"]` and dev dependencies (Biome, Playwright, `@axe-core/playwright`)
- [X] T003 [P] Create root `tsconfig.json` with strict mode and project references to `shared`, `server`, `client`
- [X] T004 [P] Create `biome.json` at repo root with project lint + format rules
- [X] T005 [P] Create `shared/package.json` and `shared/tsconfig.json` (pure TS library, no runtime deps)
- [X] T006 [P] Create `server/package.json` and `server/tsconfig.json` (Bun runtime target, depends on `shared`)
- [X] T007 [P] Create `client/package.json`, `client/tsconfig.json`, `client/vite.config.ts`, and `client/index.html` (React 18 + Vite 5 + Zustand 4, depends on `shared`, proxies `/api` → `http://localhost:8787`)
- [X] T008 [P] Create `playwright.config.ts` at repo root configured for Chromium, Firefox, and WebKit with baseURL `http://localhost:5173`
- [X] T009 [P] Add npm scripts to root `package.json`: `dev:server`, `dev:client`, `test`, `test:e2e`, `test:perf`, `check`, `check:fix`, `typecheck`
- [X] T010 Seed `data/history.json` with `{ "version": 1, "games": [] }`
- [X] T011 Add repo `.gitignore` entries for `node_modules`, `.bun`, `client/dist`, `.vite`, `playwright-report`, `coverage` (do NOT ignore `data/`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, design tokens, server skeleton, and client shell required by every user story.

**⚠️ CRITICAL**: No user-story work may begin until this phase is complete.

- [X] T012 [P] Implement constants (`COLORS`, `ASCENDING_COLORS`, `DESCENDING_COLORS`, `MIN_LOCK_MARKS`, `MAX_PENALTIES`, `MAX_HISTORY`, `SCORE` triangular table) in `shared/src/types/constants.ts`
- [X] T013 [P] Define `Color`, `CellState`, `RowState` types in `shared/src/types/board.ts`
- [X] T014 [P] Define `PlayerState` type in `shared/src/types/player.ts`
- [X] T015 [P] Define `ActionLogEntry` union in `shared/src/types/action-log.ts`
- [X] T016 [P] Define `GameStatus`, `GameState`, `HistoryFile` types in `shared/src/types/game.ts`
- [X] T017 Re-export all types and constants from `shared/src/index.ts` (depends on T012–T016)
- [X] T018 [P] Implement atomic write-then-rename helper in `server/src/storage/atomicWrite.ts`
- [X] T019 [P] Implement per-file mutex helper in `server/src/storage/mutex.ts`
- [X] T020 [P] Implement JSON read/parse helper with missing-file handling in `server/src/storage/jsonRepo.ts`
- [X] T021 [P] Implement error envelope + HTTP response helpers (`ok`, `noContent`, `errorJson`) in `server/src/http/respond.ts`
- [X] T022 Create `Bun.serve` entry point with empty router (`switch` on `url.pathname` + method) in `server/src/index.ts`
- [X] T023 [P] Create design tokens (colors, spacing, typography, state-cue icons/borders) in `client/src/design/tokens.ts`
- [X] T024 [P] Create CSS custom-property layer in `client/src/design/tokens.css` exposing tokens to CSS Modules
- [X] T025 [P] Create global reset + theme in `client/src/styles/reset.css`
- [X] T026 Create React entry point in `client/src/main.tsx` (mounts `<App />`, imports `tokens.css` + `reset.css`)
- [X] T027 Create app shell with screen routing scaffold (Home / Play / FinalScores / History placeholders) in `client/src/App.tsx`
- [X] T028 [P] Implement typed `fetch` wrapper (handles JSON, error envelope, timeouts) in `client/src/api/client.ts`

**Checkpoint**: Foundation ready — user story implementation can now proceed.

---

## Phase 3: User Story 1 — Start and play a complete game (Priority: P1) 🎯 MVP

**Goal**: A group can start a new 1–6 player game from the home screen, enter names, mark cells across four colored rows, lock rows, take penalties, see the game auto-end on the documented end conditions, view final scores, and resume after a reload.

**Independent Test**: From a freshly loaded app, create a 3-player game, mark cells across all four rows for each player, trigger a penalty, lock a row, drive the game to an end condition, and observe correct sorted final scores — all without leaving the app, and persisting across a reload.

### Tests for User Story 1 (write FIRST and ensure they FAIL) ⚠️

- [X] T029 [P] [US1] Domain unit tests for `createGame` (player count 1–6, name trim, invariants) in `shared/tests/domain/createGame.test.ts`
- [X] T030 [P] [US1] Domain unit tests for `scoreForRow` + `totalScore` against the triangular `SCORE` table and penalty deduction in `shared/tests/domain/score.test.ts`
- [X] T031 [P] [US1] Domain unit tests for `isCellMarkable` and `isRowLockable` (left-of-marked, color globally locked, <5 marks) in `shared/tests/domain/legality.test.ts`
- [X] T032 [P] [US1] Domain unit tests for `mark`, `lock`, `penalty` action functions (state mutation + action-log append) in `shared/tests/domain/actions.test.ts`
- [X] T033 [P] [US1] Domain unit tests for `gameShouldEnd` and `finalize` (≥2 global locks OR any player at 4 penalties) in `shared/tests/domain/end.test.ts`
- [X] T034 [P] [US1] Domain unit tests for `winner` (sole + tie cases) in `shared/tests/domain/winner.test.ts`
- [X] T035 [P] [US1] Server route tests for `GET /api/current` (null + populated) in `server/tests/routes/current.get.test.ts`
- [X] T036 [P] [US1] Server route tests for `PUT /api/current` (create, replace same id, 409 on id mismatch, 400 on invalid payload) in `server/tests/routes/current.put.test.ts`
- [X] T037 [P] [US1] Server route tests for `DELETE /api/current` (204 happy path + when no current game) in `server/tests/routes/current.delete.test.ts`
- [X] T038 [P] [US1] Server route tests for `POST /api/current/finalize` (moves to history, deletes current, 409 when not ended) in `server/tests/routes/current.finalize.test.ts`
- [X] T039 [P] [US1] Playwright E2E test `tests/e2e/01-play-complete-game.spec.ts` exercising start → marks → lock → penalty → end → final scores → reload-resume, with `@axe-core/playwright` accessibility assertion on Home and Play screens

### Implementation for User Story 1

- [X] T040 [P] [US1] Implement `scoreForRow` and `totalScore` in `shared/src/domain/score.ts`
- [X] T041 [P] [US1] Implement `isCellMarkable`, `isRowLockable`, `gameShouldEnd` in `shared/src/domain/legality.ts`
- [X] T042 [P] [US1] Implement `createGame(players)` factory (UUID v4 ids, row initialization per ascending/descending colors) in `shared/src/domain/createGame.ts`
- [X] T043 [US1] Implement `mark`, `lock`, `penalty`, `finalize` action functions (append to `actionLog`, set `row.locked` and `globalLocks` for lock, set `status`/`endedAt` for finalize) in `shared/src/domain/actions.ts` (depends on T040, T041)
- [X] T044 [P] [US1] Implement `winner(game)` returning sole `PlayerState` or array on tie in `shared/src/domain/winner.ts`
- [X] T045 [US1] Re-export domain functions from `shared/src/index.ts` (depends on T040–T044)
- [X] T046 [P] [US1] Implement current-game repository (`readCurrent`, `writeCurrent`, `deleteCurrent`) with atomic write + mutex in `server/src/storage/currentRepo.ts`
- [X] T047 [P] [US1] Implement history repository (`readHistory`, `appendCompleted` with `MAX_HISTORY` cap) with atomic write + mutex in `server/src/storage/historyRepo.ts`
- [X] T048 [P] [US1] Implement `GameState` validator enforcing data-model invariants in `server/src/validation/gameState.ts`
- [X] T049 [US1] Implement `GET /api/current` and `PUT /api/current` and `DELETE /api/current` handlers in `server/src/routes/current.ts` (depends on T046, T048)
- [X] T050 [US1] Implement `POST /api/current/finalize` handler (validates `gameShouldEnd`, sets `status`/`endedAt`, prepends to history, deletes current) in `server/src/routes/finalize.ts` (depends on T046, T047)
- [X] T051 [US1] Wire `current` and `finalize` routes into the router in `server/src/index.ts` (depends on T022, T049, T050)
- [X] T052 [P] [US1] Add `getCurrent`, `putCurrent`, `deleteCurrent`, `finalizeCurrent` methods to `client/src/api/client.ts`
- [X] T053 [P] [US1] Create Zustand game store with `mark`, `lock`, `penalty`, `finalize` actions and per-player score selectors in `client/src/store/gameStore.ts`
- [X] T054 [US1] Add debounced (≤300 ms) `PUT /api/current` persistence subscriber to the game store in `client/src/store/persistence.ts` (depends on T052, T053)
- [X] T055 [P] [US1] Build `Cell` component (states: available, marked, disabled, just-changed, each with non-color cues per FR-014) in `client/src/components/Cell.tsx`
- [X] T056 [P] [US1] Build `PenaltyTrack` component (4 cells, fill order) in `client/src/components/PenaltyTrack.tsx`
- [X] T057 [US1] Build `Row` component (renders ordered `Cell`s + lock cell, dispatches mark/lock to store) in `client/src/components/Row.tsx` (depends on T055)
- [X] T058 [US1] Build `Scoreboard` component (4 `Row`s + `PenaltyTrack` + running total) in `client/src/components/Scoreboard.tsx` (depends on T056, T057)
- [X] T059 [P] [US1] Build `HomeScreen` (player count selector 1–6, name inputs with non-empty validation, "discard current game" confirmation when one is in progress) in `client/src/screens/HomeScreen.tsx`
- [X] T060 [US1] Build `PlayScreen` (horizontal row of `Scoreboard`s + Take Penalty affordance per player) in `client/src/screens/PlayScreen.tsx` (depends on T058)
- [X] T061 [P] [US1] Build `FinalScoresScreen` (sorted highest-first table of row totals, penalty total, grand total) in `client/src/screens/FinalScoresScreen.tsx`
- [X] T062 [US1] Wire Home → Play → FinalScores screen transitions and trigger `finalizeCurrent` on `gameShouldEnd` in `client/src/App.tsx` (depends on T059, T060, T061)
- [X] T063 [US1] On app startup, call `getCurrent` and hydrate the game store (resume in-progress game) in `client/src/store/gameStore.ts` (depends on T052, T053)

**Checkpoint**: User Story 1 is independently demoable — full game playable end-to-end with persistence.

---

## Phase 4: User Story 2 — Correct a mistake / undo (Priority: P2)

**Goal**: A player can undo the most recent mark, lock, or penalty without losing earlier state; derived scores and global locks recompute correctly.

**Independent Test**: After several marks across multiple boards, tap Undo and observe only the most recent action reverted (cell, lock, or penalty) with all earlier marks preserved and totals recomputed.

### Tests for User Story 2 (write FIRST and ensure they FAIL) ⚠️

- [ ] T064 [P] [US2] Domain unit tests for `undo` (undo a mark; undo a lock — also clears `globalLocks[color]`; undo a penalty; undo on empty log is no-op) in `shared/tests/domain/undo.test.ts`
- [ ] T065 [P] [US2] Playwright E2E test `tests/e2e/02-undo-mistake.spec.ts` covering mark/lock/penalty undo flows with `@axe-core/playwright` assertion on Play screen with Undo affordance visible

### Implementation for User Story 2

- [ ] T066 [US2] Implement `undo(game)` (pops last `ActionLogEntry` and inverts it, including `globalLocks` release on lock-undo) in `shared/src/domain/undo.ts` (depends on T043)
- [ ] T067 [US2] Re-export `undo` from `shared/src/index.ts`
- [ ] T068 [US2] Add `undo` action to the game store and have it route through the debounced persistence subscriber in `client/src/store/gameStore.ts` (depends on T053, T054)
- [ ] T069 [P] [US2] Build `UndoButton` component (disabled when `actionLog` empty, non-color disabled cue) in `client/src/components/UndoButton.tsx`
- [ ] T070 [US2] Mount `UndoButton` in `PlayScreen` and wire to store in `client/src/screens/PlayScreen.tsx` (depends on T068, T069)

**Checkpoint**: User Stories 1 AND 2 both work independently — playable game with reliable single-step undo.

---

## Phase 5: User Story 3 — Review past games (Priority: P3)

**Goal**: Players can open a history view listing completed games (most recent first, capped at 10), each showing date, players, winner, and a drill-down to the final board state.

**Independent Test**: After finishing two games on the device, open the history view, see both games with date/players/winner, and open one to see every player's final scoreboard exactly as it ended.

### Tests for User Story 3 (write FIRST and ensure they FAIL) ⚠️

- [ ] T071 [P] [US3] Server route tests for `GET /api/history` (empty + populated, capped at 10) in `server/tests/routes/history.list.test.ts`
- [ ] T072 [P] [US3] Server route tests for `GET /api/history/:id` (404 missing, 200 with game) in `server/tests/routes/history.detail.test.ts`
- [ ] T073 [P] [US3] Domain unit tests asserting history capping behavior (`appendCompleted` trims to `MAX_HISTORY`, most-recent first) in `shared/tests/domain/history.test.ts`
- [ ] T074 [P] [US3] Playwright E2E test `tests/e2e/03-review-history.spec.ts` covering list and drill-down with `@axe-core/playwright` assertion on History screen

### Implementation for User Story 3

- [ ] T075 [US3] Implement `GET /api/history` and `GET /api/history/:id` handlers in `server/src/routes/history.ts` (depends on T047)
- [ ] T076 [US3] Wire history routes into the router in `server/src/index.ts` (depends on T051, T075)
- [ ] T077 [P] [US3] Add `getHistory` and `getHistoryById` methods to `client/src/api/client.ts`
- [ ] T078 [P] [US3] Create Zustand history store (list + selected detail) in `client/src/store/historyStore.ts`
- [ ] T079 [P] [US3] Build `HistoryList` component (date, player names, winner, sorted most-recent first) in `client/src/components/HistoryList.tsx`
- [ ] T080 [P] [US3] Build `HistoryDetail` component (read-only render of all final `Scoreboard`s for a game) in `client/src/components/HistoryDetail.tsx`
- [ ] T081 [US3] Build `HistoryScreen` composing `HistoryList` + `HistoryDetail` in `client/src/screens/HistoryScreen.tsx` (depends on T079, T080)
- [ ] T082 [US3] Add "View History" navigation entry from `HomeScreen` and route handling in `client/src/App.tsx` (depends on T059, T081)
- [ ] T083 [US3] Fetch `getHistory` on `HistoryScreen` mount and hydrate `historyStore` in `client/src/screens/HistoryScreen.tsx` (depends on T077, T078)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Enforce performance + quality budgets from the Constitution across all stories.

- [ ] T084 [P] Add Bun benchmark for `scoreForRow`, `totalScore`, `isCellMarkable`, `isRowLockable`, `undo` (each <1 ms p95) in `tests/perf/domain.bench.ts`
- [ ] T085 [P] Add Bun benchmark for `PUT /api/current` round-trip on localhost (<100 ms p95) in `tests/perf/server.bench.ts`
- [ ] T086 [P] Add CI workflow at `.github/workflows/ci.yml` running `bun run check`, `bun run typecheck`, `bun test --coverage` (≥80% lines on `shared/domain/**`), `bun run test:perf` (fail on >5% regression), and `bun run test:e2e`
- [ ] T087 [P] Configure pre-commit hook at `lefthook.yml` running `bun run check` and `bun run typecheck` on staged files
- [ ] T088 Run `specs/001-qwixx-scoreboard/quickstart.md` end-to-end on a clean checkout (install, dev servers, all three E2E specs, manual repo-portability check: commit `data/`, clone elsewhere, resume)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1. BLOCKS every user story.
- **Phase 3 (US1)**: Depends on Phase 2. No cross-story dependency.
- **Phase 4 (US2)**: Depends on Phase 2. Builds on `actions.ts` (T043) but can be developed in parallel with US1 implementation once T043 exists.
- **Phase 5 (US3)**: Depends on Phase 2. Builds on history repo (T047) but otherwise independent of US1's UI.
- **Phase 6 (Polish)**: Depends on whichever stories are in scope for the release.

### Story Dependencies

- **US1 (P1)**: Self-contained after Foundational.
- **US2 (P2)**: Requires `actions.ts` from US1 (T043) so the action log exists to undo from.
- **US3 (P3)**: Requires history repo from US1 (T047, used by finalize) so completed games exist to list. UI-wise independent of US1 screens.

### Within Each User Story

- Tests are written FIRST and MUST FAIL before implementation lands (Constitution Principle II).
- Types/constants → domain pure functions → server storage → server routes → router wiring → API client → store → components → screens → routing.

### Parallel Opportunities

- Phase 1: T003–T009 marked [P] run together.
- Phase 2: T012–T016 (types) run together; T018–T021 (server primitives) run together; T023–T025 + T028 (client primitives) run together.
- Phase 3 tests: T029–T039 all run together before any implementation starts.
- Phase 3 implementation: T040, T041, T042, T044 (independent domain files) run together; T046, T047, T048 (independent server files) run together; T052, T053, T055, T056, T059, T061 (independent client files) run together.
- Phase 4 tests: T064, T065 run together.
- Phase 5 tests: T071–T074 run together; T077–T080 (independent client files) run together.
- Phase 6: T084–T087 run together.
- Different developers can own US1, US2, US3 in parallel once Phase 2 is complete.

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all US1 test tasks together (they each touch their own file):
Task: "T029 Domain unit tests for createGame in shared/tests/domain/createGame.test.ts"
Task: "T030 Domain unit tests for scoreForRow + totalScore in shared/tests/domain/score.test.ts"
Task: "T031 Domain unit tests for isCellMarkable + isRowLockable in shared/tests/domain/legality.test.ts"
Task: "T032 Domain unit tests for mark/lock/penalty actions in shared/tests/domain/actions.test.ts"
Task: "T033 Domain unit tests for gameShouldEnd + finalize in shared/tests/domain/end.test.ts"
Task: "T034 Domain unit tests for winner in shared/tests/domain/winner.test.ts"
Task: "T035 Server route tests for GET /api/current in server/tests/routes/current.get.test.ts"
Task: "T036 Server route tests for PUT /api/current in server/tests/routes/current.put.test.ts"
Task: "T037 Server route tests for DELETE /api/current in server/tests/routes/current.delete.test.ts"
Task: "T038 Server route tests for POST /api/current/finalize in server/tests/routes/current.finalize.test.ts"
Task: "T039 Playwright E2E for play-complete-game in tests/e2e/01-play-complete-game.spec.ts"
```

---

## Parallel Example: User Story 1 Independent Implementation Files

```bash
# Pure-domain files (no shared mutation; each is its own module):
Task: "T040 scoreForRow + totalScore in shared/src/domain/score.ts"
Task: "T041 isCellMarkable + isRowLockable + gameShouldEnd in shared/src/domain/legality.ts"
Task: "T042 createGame factory in shared/src/domain/createGame.ts"
Task: "T044 winner in shared/src/domain/winner.ts"

# Independent server files:
Task: "T046 currentRepo in server/src/storage/currentRepo.ts"
Task: "T047 historyRepo in server/src/storage/historyRepo.ts"
Task: "T048 GameState validator in server/src/validation/gameState.ts"

# Independent client UI primitives:
Task: "T055 Cell component in client/src/components/Cell.tsx"
Task: "T056 PenaltyTrack in client/src/components/PenaltyTrack.tsx"
Task: "T059 HomeScreen in client/src/screens/HomeScreen.tsx"
Task: "T061 FinalScoresScreen in client/src/screens/FinalScoresScreen.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: run `tests/e2e/01-play-complete-game.spec.ts`, play a full game manually, commit `data/current.json` + `data/history.json` to git, pull on another machine, resume.
5. Demoable MVP.

### Incremental Delivery

1. Phase 1 + 2 → foundation green.
2. Phase 3 (US1) → MVP demo.
3. Phase 4 (US2) → undo demo.
4. Phase 5 (US3) → history demo.
5. Phase 6 → enforce perf, coverage, pre-commit, and quickstart.

### Parallel Team Strategy

After Phase 2:

- Developer A → US1 (P1, MVP path).
- Developer B → US2 (P2) — can start once T043 (`actions.ts`) lands.
- Developer C → US3 (P3) — can start once T047 (`historyRepo`) lands.

Each story's E2E test (T039 / T065 / T074) is the independent acceptance gate.

---

## Notes

- [P] tasks touch independent files and have no in-flight dependencies.
- [Story] labels map tasks to spec.md user stories for traceability.
- Each user story is independently demoable; do not introduce cross-story coupling that breaks that.
- Tests must FAIL before their implementation task is started (Constitution Principle II).
- Commit after each task or small logical group.
