<!--
Sync Impact Report
==================
Version change: TEMPLATE (uninitialized) → 1.0.0
Rationale: Initial ratification of the project constitution (MAJOR bump from
unversioned template to first governed version).

Modified principles (template slot → final name):
- [PRINCIPLE_1_NAME] → I. Code Quality (NON-NEGOTIABLE)
- [PRINCIPLE_2_NAME] → II. Testing Standards (NON-NEGOTIABLE)
- [PRINCIPLE_3_NAME] → III. User Experience Consistency
- [PRINCIPLE_4_NAME] → IV. Performance Requirements
- [PRINCIPLE_5_NAME] → REMOVED (user requested four principles only)

Added sections:
- Quality Gates & Development Workflow (former SECTION_3 slot)
- Additional Constraints (former SECTION_2 slot)
- Governance (concrete rules replacing placeholder)

Removed sections:
- Fifth placeholder principle slot (intentional — only four principles requested).

Templates requiring updates:
- ✅ .specify/templates/plan-template.md — "Constitution Check" gate references
  this constitution; no token edits required, gates remain principle-driven.
- ✅ .specify/templates/spec-template.md — aligned (no constitution-specific
  tokens present; Success Criteria already supports measurable performance/UX).
- ✅ .specify/templates/tasks-template.md — aligned (categorization already
  supports testing-first and polish/perf tasks).
- ⚠ .specify/templates/commands/*.md — directory not present in this project;
  no action required.
- ✅ CLAUDE.md — generic guidance, no stale references.

Follow-up TODOs: none. Ratification date set to today (2026-05-27) as this is
the first formal adoption.
-->

# Qwixx Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

All code MUST pass automated linting, formatting, and static type checks before
merge; CI MUST block on any failure. Every change MUST keep functions small,
single-purpose, and free of dead code, commented-out blocks, or speculative
abstractions. Public APIs and non-obvious invariants MUST carry concise
documentation; code that explains itself MUST NOT be padded with redundant
comments. Reviewers MUST reject changes that introduce duplication when a
single source of truth is feasible, or that bypass established patterns
without a documented justification in the PR description.

**Rationale**: Qwixx is a small codebase; uncontrolled drift in style or
quality compounds quickly and is the cheapest defect class to prevent at the
gate.

### II. Testing Standards (NON-NEGOTIABLE)

Test-Driven Development is mandatory for all production logic: failing tests
MUST exist before implementation begins, and the Red-Green-Refactor cycle MUST
be visible in commit history. Every user-facing feature MUST have at least one
integration test exercising the full path; every domain rule (scoring, turn
order, lock conditions, penalties) MUST have unit tests covering boundary and
error cases. Test suites MUST run in under five minutes locally and MUST be
deterministic — flaky tests MUST be fixed or quarantined within one working
day, never silently retried. Coverage thresholds are enforced in CI; any drop
below the established baseline MUST be justified in the PR.

**Rationale**: Game rules are precise and adversarially exercised by real
players; regressions in scoring or rule enforcement are user-visible and
trust-eroding. Tests are the only durable specification of correctness.

### III. User Experience Consistency

All user-facing surfaces MUST share a single design system: typography,
spacing, color tokens, iconography, and interaction patterns are defined once
and reused — ad-hoc styling is prohibited. Identical actions MUST behave
identically across screens (same affordances, same feedback, same error
copy). Latency-perceptible operations MUST provide progress feedback within
100ms and MUST be cancellable when they exceed one second. Error states MUST
be actionable (what happened, what to do next) and MUST never expose raw stack
traces or internal identifiers. Accessibility (keyboard navigation, screen
reader labels, contrast ratios meeting WCAG 2.1 AA) is a release gate, not a
backlog item.

**Rationale**: Qwixx players move quickly between turns; inconsistency or
unclear feedback breaks the play loop and is indistinguishable from a bug.

### IV. Performance Requirements

Every user-initiated interaction MUST complete within 200ms at the p95
measured on representative hardware; background or networked operations MUST
define and publish their own explicit budget (latency, throughput, memory).
Performance budgets MUST be encoded as automated tests or benchmarks and MUST
fail CI when exceeded. No change may regress an established benchmark by more
than 5% without an approved variance recorded in the PR. Profiling data MUST
accompany any optimization claim — micro-optimizations without measurement
are prohibited. Memory footprint and bundle/binary size MUST be tracked over
time; sustained growth without feature justification MUST be remediated.

**Rationale**: The product's value is its responsiveness; performance
regressions are silent until users feel them, so they MUST be caught by
machines, not by complaints.

## Additional Constraints

- **Dependencies**: New runtime dependencies MUST be justified in the PR
  description (problem solved, alternatives weighed, maintenance signal). Dev
  dependencies follow the same rule with a lower bar. Security advisories on
  any dependency MUST be triaged within seven days.
- **Security**: Untrusted input MUST be validated at trust boundaries; secrets
  MUST never be committed; dependency and SAST scans MUST run in CI.
- **Observability**: Production code paths MUST emit structured logs at the
  decision points needed to reconstruct user-affecting failures.

## Quality Gates & Development Workflow

- **Pre-merge gates** (all MUST pass): lint, format check, type check, unit
  tests, integration tests, coverage threshold, performance benchmarks,
  accessibility checks where applicable.
- **Code review**: Every change requires at least one reviewer who did not
  author the code. Reviewers MUST verify compliance with Principles I–IV and
  cite the principle when requesting changes.
- **Spec-driven changes**: Non-trivial features MUST follow the Spec Kit
  workflow (spec → plan → tasks → implement). The plan template's
  "Constitution Check" gate MUST be filled in honestly; documented violations
  MUST appear in the plan's Complexity Tracking table with justification.
- **Definition of done**: Code merged + tests green + docs updated + telemetry
  added (when applicable) + UX reviewed against the design system.

## Governance

This constitution supersedes ad-hoc team conventions and individual
preferences. Where a project document, code comment, or chat decision
conflicts with this constitution, this constitution prevails until amended.

- **Amendments**: Proposed via PR modifying `.specify/memory/constitution.md`,
  with a Sync Impact Report block, a version bump per the rules below, and at
  least one reviewer approval. Amendments touching NON-NEGOTIABLE principles
  require explicit acknowledgement of the migration impact in the PR.
- **Versioning policy**: Semantic versioning of the constitution document
  itself.
  - **MAJOR**: Backward-incompatible governance change, removal of a
    principle, or redefinition that invalidates prior compliance.
  - **MINOR**: New principle, new mandatory section, or material expansion of
    an existing principle.
  - **PATCH**: Clarifications, wording fixes, non-semantic refinements.
- **Compliance review**: Every PR description MUST state which principles were
  most relevant and how compliance was verified. Quarterly, maintainers MUST
  audit a sample of merged PRs against this constitution and open follow-up
  issues for any drift.
- **Runtime guidance**: Day-to-day agent and contributor guidance lives in
  `CLAUDE.md` and the active plan under `specs/<feature>/plan.md`; those
  documents MUST defer to this constitution on conflicts.

**Version**: 1.0.0 | **Ratified**: 2026-05-27 | **Last Amended**: 2026-05-27
