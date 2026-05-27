# Quickstart: Qwixx Digital Scoreboard

This is the developer onboarding for working on this feature. It assumes Bun ≥1.2 is installed.

## One-time setup

```bash
# Clone the repo and switch to the feature branch
git checkout 001-qwixx-scoreboard-web-app

# Install dependencies (Bun workspaces)
bun install

# Install Playwright browsers (one-time per machine)
bunx playwright install --with-deps
```

## Run the app locally

In one terminal:

```bash
bun run dev:server   # Bun HTTP server on :8787
```

In another:

```bash
bun run dev:client   # Vite dev server on :5173 (proxies /api → :8787)
```

Open http://localhost:5173 in a browser.

## Run the tests

```bash
bun test                # all unit tests (domain + server)
bun test --coverage     # with coverage report
bun run test:perf       # Bun benchmarks for hot paths
bun run test:e2e        # Playwright E2E + accessibility
```

The full unit + E2E suite is targeted at <5 minutes on a typical laptop (Principle II).

## Lint, format, and type-check

```bash
bun run check           # Biome lint + format check
bun run check:fix       # Biome lint + format autofix
bun run typecheck       # tsc --noEmit across all workspaces
```

These same commands run as a pre-commit hook.

## Data on disk

Game state lives under `data/`:

- `data/current.json` — the in-progress game (absent when there is no active game)
- `data/history.json` — the bounded list of completed games

These files are tracked in git. To carry your game to another machine, commit the changes and push;
on the other machine, pull and run the dev server again.

## Story-level verification

After implementing each user story you should be able to run a single Playwright test that
demonstrates the story end-to-end:

- `tests/e2e/01-play-complete-game.spec.ts` — User Story 1 (P1)
- `tests/e2e/02-undo-mistake.spec.ts` — User Story 2 (P2)
- `tests/e2e/03-review-history.spec.ts` — User Story 3 (P3)

Each Playwright test additionally runs an axe-core accessibility check against the screen it
visits.

## When in doubt

- Spec: `specs/001-qwixx-scoreboard/spec.md`
- Plan: `specs/001-qwixx-scoreboard/plan.md`
- Data model: `specs/001-qwixx-scoreboard/data-model.md`
- API contract: `specs/001-qwixx-scoreboard/contracts/api.md`
- Constitution: `.specify/memory/constitution.md`
