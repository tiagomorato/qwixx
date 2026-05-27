# Implementation Plan: Qwixx Digital Scoreboard

**Branch**: `001-qwixx-scoreboard-web-app` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-qwixx-scoreboard/spec.md`

## Summary

Build a local-first web application that digitalizes the Qwixx scorecard for 1–6 players sharing one device.
Players roll real dice; the app records marks, penalties, locks, scores, and persists the entire game state
as JSON files in a `data/` directory at the repo root so the game can travel with the repository to any
machine that clones it. The app is a React+TypeScript SPA served by a small Bun HTTP server that owns
filesystem persistence and exposes a thin JSON API.

## Technical Context

**Language/Version**: TypeScript 5.x, ES2022 target

**Primary Dependencies**:
- Runtime / package manager / test runner: Bun (latest stable, ≥1.2)
- Frontend: React 18, Zustand 4, Vite 5
- Server: Bun built-in `Bun.serve`, no Express/Fastify
- Tooling: Biome (lint + format), Playwright (E2E + accessibility via `@axe-core/playwright`)

**Storage**: JSON files in `./data/` at repo root, committed to git. Two files:
- `data/current.json` — single in-progress game (absent or `null` if none)
- `data/history.json` — bounded list (≤10) of completed games

**Testing**:
- `bun test` for unit tests (domain logic + server routes)
- Playwright for end-to-end tests in a real browser
- `@axe-core/playwright` for accessibility assertions inside E2E flows
- `bun bench` (Bun's bench runner) for performance budgets

**Target Platform**: Modern evergreen browsers (Chromium, Firefox, Safari) on desktop and mobile.
Bun ≥1.2 on macOS, Linux, and Windows (WSL or native) for running locally.

**Project Type**: Web application — single repository containing a React SPA, a Bun server, and a
shared pure-TypeScript domain library.

**Performance Goals**:
- Any user gesture (mark, lock, penalty, undo) MUST visibly update the UI within 100 ms p95 on a
  representative consumer laptop.
- Server round-trip for state PUT MUST complete within 100 ms p95 on localhost.
- Domain pure functions (score, legality, lock check, undo) MUST execute in < 1 ms each at p95.

**Constraints**:
- Fully offline after first load (no third-party network calls during gameplay).
- No external database. No user accounts.
- Single device at a time (hot-seat play); the server assumes one writer.
- `data/` directory is committed to git so the user can pull it on another machine and resume.

**Scale/Scope**:
- Max 6 players × 4 rows × 11 cells per game ⇒ a single game state fits comfortably in <10 KB JSON.
- History capped at 10 games; bounded forever-growth not required.
- ≤3 screens (home, play, history). One concurrent user.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked at the end of Phase 1.*

Reference: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0.

| Principle | Compliance plan | Verdict |
|-----------|-----------------|---------|
| I. Code Quality (NON-NEGOTIABLE) | Biome + `tsc --noEmit` in CI; pre-commit hook runs both. Small, single-purpose modules; pure domain layer isolated from I/O. No commented-out code or speculative abstractions allowed by review. | PASS |
| II. Testing Standards (NON-NEGOTIABLE) | TDD: every domain rule and server endpoint gets a failing Bun unit test before implementation. Each P1/P2/P3 user story gets a Playwright E2E test. Test suite target: <5 min locally. Coverage threshold ≥80% lines on `shared/domain/**` enforced in CI. Flaky-test rule honored. | PASS |
| III. UX Consistency | Single design system in `client/src/design/` (CSS variables + a `tokens.ts`); component primitives consume tokens only. All interactive states (available / marked / disabled / just-changed) carry both color and a non-color cue (icon, weight, border) to satisfy FR-014. Accessibility checked automatically with axe-core in Playwright. | PASS |
| IV. Performance Requirements | Bun bench files under `tests/perf/` enforce the budgets in Technical Context; CI fails if a budget is exceeded. Playwright E2E asserts user-perceived latency on critical gestures. No optimization without a benchmark. | PASS |

**No principle violations require justification.** No entries in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-qwixx-scoreboard/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # HTTP contract between client and server
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify)
└── tasks.md             # Phase 2 output (created later by /speckit-tasks)
```

### Source Code (repository root)

```text
data/                    # Persisted JSON state (committed to git)
├── current.json         # In-progress game (or absent)
└── history.json         # Bounded list of completed games

shared/                  # Pure TypeScript: domain logic + types
└── src/
    ├── domain/          # Pure functions: rules, scoring, legality, undo
    ├── types/           # GameState, PlayerState, RowState, ActionLogEntry, etc.
    └── index.ts         # Public surface used by both client and server

server/                  # Bun HTTP server (filesystem persistence)
├── src/
│   ├── index.ts         # Bun.serve entry point
│   ├── routes/          # One file per resource (current, history)
│   └── storage/         # JSON file repository (read/write/atomic-replace)
└── tests/               # Bun tests for server routes + storage

client/                  # React SPA (Vite root)
├── index.html
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── screens/         # HomeScreen, PlayScreen, HistoryScreen
    ├── components/      # Scoreboard, Row, Cell, PenaltyTrack, etc.
    ├── design/          # tokens.ts + base CSS variables
    ├── store/           # Zustand stores (gameStore, historyStore)
    ├── api/             # Typed client for server endpoints
    └── styles/          # Global CSS reset + theme

tests/                   # Cross-cutting tests
├── perf/                # Bun bench files (domain hot paths)
└── e2e/                 # Playwright tests + accessibility checks

biome.json               # Biome lint + format config
playwright.config.ts
tsconfig.json            # Strict TS config, project references for shared/server/client
package.json             # Bun workspaces
bun.lockb
```

**Structure Decision**: Single repository with **three TypeScript projects under one Bun workspace**:
`shared`, `server`, `client`. The `shared` package holds pure domain logic with zero I/O so it can
be unit-tested with `bun test` and consumed by both `server` and `client`. The `server` package owns
all filesystem access. The `client` package is the Vite-built React SPA. Cross-cutting tests
(performance, E2E) live under `tests/` at the root.

## Complexity Tracking

*No violations to justify. Section intentionally empty.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
