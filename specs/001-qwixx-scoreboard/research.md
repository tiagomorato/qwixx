# Phase 0 Research: Qwixx Digital Scoreboard

All NEEDS CLARIFICATION items raised during planning have been resolved with the user.
This document records the decisions, why they were made, and what was rejected.

## R1. Persistence model — repo-resident JSON vs. browser storage

**Decision**: A small Bun HTTP server runs alongside the React SPA. The server reads and writes
JSON files under `./data/` at the repo root. Those files are committed to git.

**Rationale**: The user's requirement — "save data in the directory, so I have access to it on every
computer I download the repo" — cannot be met by browser storage alone. Browsers cannot write to the
filesystem of the repo. A local Bun server is the smallest moving part that bridges the browser to
disk while keeping the deployment local-only and dependency-light.

**Alternatives considered**:
- *Browser localStorage only*: Rejected. Data does not travel with the repo and is per-browser-per-device.
- *File System Access API*: Rejected. Chromium-only, requires per-load user permission, and writes
  outside the repo tree by default — does not satisfy "in the directory."
- *Desktop wrapper (Tauri/Electron)*: Rejected. Adds a substantial native build chain. The user said
  "web app," and a local Bun server preserves that.

## R2. Bundler / dev server for React + TypeScript

**Decision**: Vite 5, with Bun as the package manager and script runner.

**Rationale**: Vite remains the most mature React HMR and TypeScript dev experience as of early 2026.
Bun is fully compatible as the package manager (`bun install`, `bun run dev`). This gets the best of
both: Bun for everything outside the browser bundle, Vite for the SPA dev loop.

**Alternatives considered**:
- *Bun's built-in bundler*: Rejected for v1. The bundler is capable but React HMR still has rougher
  edges than Vite. Can be revisited if Bun's bundler matures further.

## R3. Styling

**Decision**: CSS Modules + a small design-token file (`client/src/design/tokens.ts` and a CSS
variables file).

**Rationale**: The app has roughly a dozen components and a single visual theme. CSS Modules gives
scoped styles with zero runtime cost and no extra dependency. Design tokens centralize colors,
spacing, typography, and non-color state cues so Principle III (UX Consistency) is enforceable in
code review.

**Alternatives considered**:
- *Tailwind CSS*: Rejected. Useful for larger apps with many ad-hoc layouts; here it would add a
  build dependency without proportional benefit.
- *Plain global CSS*: Rejected. Cannot prevent cross-component leakage; harder to enforce consistency.

## R4. State management

**Decision**: Zustand 4 for the in-memory game state, the undo log, and the history list.

**Rationale**: The game store needs (a) a non-trivial reducer (mark/lock/penalty/undo), (b)
unit-testability outside React, and (c) cross-component subscriptions. Zustand provides all three
in <2 KB with zero boilerplate. The store can be exercised by `bun test` directly because it is
plain TypeScript.

**Alternatives considered**:
- *useReducer + Context*: Rejected. Possible but the store becomes harder to test in isolation; the
  undo log invites prop-drilling.
- *Redux Toolkit*: Rejected. Heavier than the problem requires.

## R5. HTTP server framework

**Decision**: Bun's built-in `Bun.serve`, no framework.

**Rationale**: The server exposes ≤5 endpoints, all reading/writing JSON. `Bun.serve` plus a tiny
hand-written router (`switch` on `url.pathname` + method) is enough and removes a third-party
dependency.

**Alternatives considered**:
- *Hono / Elysia / Express*: Rejected. Overkill for five endpoints and adds dependency churn.

## R6. Concurrent-write safety on the JSON files

**Decision**: All writes go through an atomic write-rename pattern (write to `data/current.json.tmp`,
then `fs.rename` to `data/current.json`). The server serializes writes with a per-file mutex (single
in-process queue).

**Rationale**: The spec assumes a single device and a single writer, but a partial write during
process crash or power loss would corrupt the JSON. Atomic rename eliminates that class of failure.
A per-file mutex prevents interleaving when the client fires rapid PUTs.

**Alternatives considered**:
- *Direct overwrite*: Rejected. Risk of half-written files on crash.
- *Append-only event log + snapshot*: Rejected. Overkill for game state that fits in <10 KB.

## R7. End-to-end testing in a browser

**Decision**: Playwright with the official Chromium, Firefox, and WebKit browsers. Accessibility
assertions via `@axe-core/playwright`.

**Rationale**: Playwright is the de facto standard for cross-browser E2E in 2026 and integrates
naturally with axe-core for WCAG checks. Each P1/P2/P3 user story gets one happy-path Playwright
test; additionally, a single accessibility check per screen enforces WCAG 2.1 AA per Principle III.

**Alternatives considered**:
- *Cypress*: Rejected. Single-browser limitations and a heavier toolchain than Playwright.

## R8. Performance budgets

**Decision**: Bun bench files under `tests/perf/` assert the domain hot-path budgets (<1 ms for
score / legality / undo on a representative game state). Playwright tests assert user-perceived
latency on the mark/lock/penalty gestures. CI fails on any regression of more than 5% from the
established baseline (per Constitution Principle IV).

**Rationale**: Encoding budgets as automated tests is mandated by Principle IV. The split (Bun bench
for pure functions, Playwright for end-to-end perceived latency) matches the two layers of the
performance contract in the plan.

**Alternatives considered**:
- *Manual perf checks*: Rejected; Principle IV explicitly forbids it.

## R9. Pre-commit hook

**Decision**: A single pre-commit hook (managed via `lefthook` or a hand-written `.husky` shim, TBD
during setup) runs Biome (lint + format check) and `tsc --noEmit` over changed files.

**Rationale**: Principle I requires lint/format/types to pass before merge. Catching it at commit
time keeps PRs clean and avoids burning CI time on trivially fixable issues.

**Alternatives considered**:
- *No pre-commit hook, rely on CI alone*: Rejected. CI is the safety net, not the first line.
