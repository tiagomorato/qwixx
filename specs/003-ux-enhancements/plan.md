# Implementation Plan: UI/UX Enhancements

**Branch**: `003-ux-enhancements` | **Date**: 2026-06-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-ux-enhancements/spec.md`

## Summary

Ten UI/UX improvements layered onto the existing single-game Qwixx scoreboard:
per-row running scores, cross-device active-player turn tracking, haptic
feedback, a manual light/dark theme toggle, a penalty mis-tap guard, an undo
confirmation toast, end-game share + rematch, plus reduced-motion and
high-player-count layout polish. Almost all work lives in the React client and
reuses the established scoring domain. The one schema-level change is **turn
state**: the active player is added to the synced `GameState` so it propagates
over the existing SSE live-sync. Every other story is client-local presentation
or interaction state with no contract impact. The undo toast and per-row scores
are *derived* from existing state (action log diff, `scoreForRow`) and add no
new persisted fields.

## Technical Context

**Language/Version**: TypeScript 5.7 on Bun (server + tooling), ES modules throughout

**Primary Dependencies**: React 18.3, Zustand 4.5, Vite 5.4 (client); Bun's
built-in `Bun.serve` + `ReadableStream` SSE (server); no new runtime
dependencies required

**Storage**: File-based JSON (`data/history.json` + current-game record) via the
existing `currentRepo`/`historyRepo`; browser `localStorage` for the per-device
theme preference (new) and recent player names (existing)

**Testing**: `bun test` (shared domain + server unit/integration), Playwright +
`@axe-core/playwright` (client e2e + accessibility), `bun test tests/perf`
(performance budgets); Biome for lint/format, `tsc` for typecheck across the
three project references

**Target Platform**: Mobile-first responsive web (phones around a table),
served over LAN HTTP; modern evergreen browsers + iOS/Android Safari/Chrome

**Project Type**: Web application — Bun workspace monorepo (`shared`, `server`,
`client`)

**Performance Goals**: User-initiated interactions ≤200ms p95 (constitution IV);
turn advance propagates within the existing live-sync latency (no slower than a
score update); 60fps board interactions, haptics non-blocking

**Constraints**: Offline-tolerant client (sync degrades silently); theme is
per-device and MUST NOT enter `GameState`; haptics are a silent no-op where
unsupported; WCAG 2.1 AA contrast and "more than colour alone" for cell states
in both themes

**Scale/Scope**: 2–6 players, one in-progress game, ≤10 stored history games;
~10 React components/screens touched, one shared domain addition (turn state)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Code Quality** — PASS. No new runtime dependencies (haptics, share, theme
all use platform APIs). Turn state reuses the existing immutable-update pattern
in `shared/src/domain`. The undo toast and per-row scores derive from existing
state rather than duplicating it (single source of truth). Theme CSS refactor
replaces the bare `@media (prefers-color-scheme)` block with a
token-override pattern — one definition, reused.

**II. Testing Standards** — PASS (TDD required). New domain logic
(`advanceTurn`, turn-state in `createGame`, server validation of the new field)
gets failing unit tests first covering wrap-around, single-player edge, and the
end-condition interaction. Each user-facing story gets at least one Playwright
integration test; undo-toast and turn-sync get a two-context (two-device)
e2e. Accessibility assertions (axe) extend the existing suite for the theme
toggle, penalty-confirm dialog, and toast (`aria-live`).

**III. UX Consistency** — PASS, and this feature *is* a UX-consistency
investment. All new surfaces consume existing design tokens; the penalty-confirm
and rematch reuse the established confirm/primary-button patterns from
`HomeScreen`. Toast feedback is actionable and transient. The theme toggle adds
a documented token-override layer rather than ad-hoc styling.

**IV. Performance** — PASS. All interactions are local React state updates or a
single debounced PUT already covered by the existing persistence path; turn
advance rides the existing SSE broadcast. Haptics are fire-and-forget. A perf
test asserts mark→repaint stays within budget at 6 players (max layout density).

**No violations — Complexity Tracking table is empty.**

### Migration note (tracked in research.md)

Adding a field to `GameState` means previously persisted current games and the
10 history records predate it. Mitigation: the field is **optional on read /
normalized to a default** (`players[0].id`) and only *written* going forward;
completed history games never need an active player. This avoids a destructive
data migration and keeps `validateGameState` backward-tolerant. See
[research.md](research.md) §Turn State.

## Project Structure

### Documentation (this feature)

```text
specs/003-ux-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── turn-state.md    # Phase 1 output — GameState/PUT/SSE delta
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
shared/
├── src/
│   ├── types/
│   │   └── game.ts            # + activePlayerId on GameState
│   ├── domain/
│   │   ├── createGame.ts      # initialise activePlayerId = players[0].id
│   │   └── turn.ts            # NEW: advanceTurn(game) (wrap-around)
│   └── index.ts               # export advanceTurn
└── tests/domain/
    └── turn.test.ts           # NEW: wrap-around, single-active, end-state

server/
├── src/validation/
│   └── gameState.ts           # tolerate/validate activePlayerId
└── tests/routes/
    └── current.put.test.ts    # extend: round-trips active player

client/src/
├── components/
│   ├── Row.tsx / Row.module.css            # per-row score display
│   ├── Cell.module.css                     # reduced-motion + colour-blind states (in progress)
│   ├── Scoreboard.tsx / .module.css        # active highlight, row scores, penalty guard hook
│   ├── PenaltyTrack.tsx                     # confirm-before-apply step
│   ├── Toast.tsx / Toast.module.css        # NEW: transient aria-live notice
│   └── ThemeToggle.tsx                      # NEW: light/dark/system control
├── screens/
│   ├── PlayScreen.tsx / .module.css        # turn highlight + "Next player", density, toast host
│   ├── FinalScoresScreen.tsx / .module.css # winner celebration, share, rematch
│   └── HomeScreen.tsx                       # accept rematch-prefilled names
├── store/
│   ├── gameStore.ts                        # advanceTurn action; haptics on success; undo-notice
│   └── persistence.ts                      # derive remote undo notice from actionLog diff
├── lib/
│   ├── haptics.ts                          # NEW: navigator.vibrate wrapper
│   └── theme.ts                            # NEW: load/apply/persist theme preference
└── design/
    └── tokens.css                          # theme override via [data-theme]; reduced-motion
```

**Structure Decision**: Existing Bun-workspace web app. Domain rules live in
`shared` (the single source of truth consumed by both server and client);
presentation and per-device state live in `client`. The server changes are
limited to validating the one new synced field. New client utilities go under a
new `client/src/lib/` folder to keep platform-API wrappers (haptics, theme) out
of the component tree.

## Complexity Tracking

> No constitution violations. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
