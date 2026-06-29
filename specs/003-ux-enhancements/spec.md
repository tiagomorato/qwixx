# Feature Specification: UI/UX Enhancements

**Feature Branch**: `003-ux-enhancements`

**Created**: 2026-06-29

**Status**: Draft

**Input**: User description: "add these suggestions" — a set of UI/UX improvements raised during a design review of the Qwixx scoreboard app: per-row running scores, active-player turn tracking, haptic feedback on marks, a manual light/dark theme toggle, a penalty mis-tap guard, an undo confirmation toast, sharing final results, rematch with the same players, reduced-motion support, and a compact layout for games with more players.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See where points come from (Priority: P1)

While a game is in progress, a player wants to understand how the grand total on each board is composed, not just the final number. They want to glance at a board and see how many points each colored row is currently worth so they can decide whether to keep pushing a row or take a lock.

**Why this priority**: This is the single most-requested capability in score trackers and it builds directly on existing scoring logic. It delivers standalone value the moment it ships, with no dependency on any other story.

**Independent Test**: Start a game, mark several cells across different rows on one board, and confirm each row shows its current point value and that the values update immediately as cells are marked or unmarked, summing to the displayed grand total.

**Acceptance Scenarios**:

1. **Given** a board with points visible, **When** a player marks cells in a row, **Then** that row displays its current score and the value updates with each mark.
2. **Given** a row score is shown, **When** the user hides points via the existing show/hide control, **Then** per-row scores are hidden together with the grand total.
3. **Given** a row is locked, **When** the lock is applied, **Then** the row score reflects the bonus that the lock contributes.

---

### User Story 2 - Know whose turn it is (Priority: P1)

Players sitting around the table want the app to track turn order so the group always knows who the active (rolling) player is. The active player's board is visually highlighted, and anyone can advance to the next player when the turn ends.

**Why this priority**: This is the largest change to how the app feels during play and closes the main game-flow gap — the physical game has a rolling player but the app currently treats all boards equally. High value, and independently demonstrable.

**Independent Test**: Start a game with three players, confirm one board is marked active, advance the turn, and confirm the highlight moves to the next player in order and wraps around after the last player.

**Acceptance Scenarios**:

1. **Given** a newly started game, **When** the play screen loads, **Then** exactly one player is shown as the active player.
2. **Given** an active player, **When** the user advances the turn, **Then** the next player in order becomes active and the previous one is no longer highlighted.
3. **Given** the last player is active, **When** the turn is advanced, **Then** the first player becomes active (wrap-around).
4. **Given** a game played across two synced devices, **When** the turn advances on one device, **Then** the other device reflects the same active player.

---

### User Story 3 - Feel a confirmation when marking (Priority: P2)

On a touch device, a player wants subtle physical feedback when a mark, lock, or penalty registers, so they are confident the tap landed without having to stare at the screen.

**Why this priority**: Low effort, meaningful tactile improvement on the primary interaction. Independent of every other story.

**Independent Test**: On a device that supports vibration, mark a cell and confirm a short haptic pulse occurs; confirm no pulse occurs for a tap that does not change state (e.g. a disabled cell).

**Acceptance Scenarios**:

1. **Given** a touch device that supports haptics, **When** a player successfully marks a cell, locks a row, or takes a penalty, **Then** a brief haptic pulse is emitted.
2. **Given** a device without haptic support, **When** a player marks a cell, **Then** the action completes normally with no error.
3. **Given** a tap on a disabled or already-marked cell, **When** the tap does not change state, **Then** no haptic pulse is emitted.

---

### User Story 4 - Choose light or dark theme (Priority: P2)

A player wants to manually choose between light and dark appearance regardless of their device setting — for example, to dim the "host" phone at a dark table — and have that choice remembered across sessions.

**Why this priority**: Common ask and useful in the app's real setting (a shared phone on a table). Independent of other stories; today the app only follows the OS preference.

**Independent Test**: Toggle the theme control, confirm the appearance changes immediately, reload the app, and confirm the chosen theme persists.

**Acceptance Scenarios**:

1. **Given** the app using the system theme, **When** the user selects a specific theme, **Then** the appearance changes immediately and overrides the system setting.
2. **Given** a manually selected theme, **When** the user reloads or reopens the app, **Then** the previously selected theme is applied.
3. **Given** a manually selected theme, **When** the user chooses to follow the system setting again, **Then** appearance tracks the device preference.

---

### User Story 5 - Avoid accidental penalties and understand undos (Priority: P2)

A player wants protection against accidentally tapping a penalty (worth −5) and wants clarity when an undo happens — especially across synced devices — so the group trusts the score.

**Why this priority**: Penalties and cross-device undo are the two most error-prone moments. Reuses the existing undo capability; medium effort, high trust payoff.

**Independent Test**: Tap a penalty and confirm it requires an explicit confirmation step before applying; perform an undo and confirm a short message describes what was undone.

**Acceptance Scenarios**:

1. **Given** a board with the next penalty available, **When** the user taps to take a penalty, **Then** the penalty is not applied until a confirmation step is satisfied.
2. **Given** any reversible action was just performed, **When** an undo occurs, **Then** a brief message identifies what was undone and for which player.
3. **Given** two synced devices, **When** an undo is triggered on one device, **Then** both devices show a message describing the same undone action.

---

### User Story 6 - Wrap up and play again (Priority: P3)

At the end of a game, players want to celebrate the winner, share the result outside the app, and quickly start a rematch with the same players without re-entering names.

**Why this priority**: Nice end-of-game polish that improves repeat play, but the game is fully functional without it.

**Independent Test**: Finish a game, confirm the winner is celebrated, use the share action to produce a result summary, and use rematch to start a new game pre-filled with the same players.

**Acceptance Scenarios**:

1. **Given** a finished game, **When** the final screen appears, **Then** the winning player (or a tie) is clearly celebrated and ties are presented unambiguously.
2. **Given** the final screen, **When** the user shares the result, **Then** a readable summary of players and scores is produced for sharing or copying.
3. **Given** the final screen, **When** the user chooses rematch, **Then** a new game setup is started pre-populated with the same player names.

---

### User Story 7 - Comfortable layout and motion (Priority: P3)

Players using games with four or five boards on a phone want a layout that stays readable without excessive scrolling, and players sensitive to motion want animations reduced.

**Why this priority**: Improves comfort at the high end of player counts and respects accessibility preferences, but does not block core play.

**Independent Test**: Start a five-player game on a narrow screen and confirm boards remain legible with reduced density; enable the OS reduced-motion setting and confirm non-essential animations are suppressed.

**Acceptance Scenarios**:

1. **Given** a game with the maximum number of players on a narrow screen, **When** the play screen renders, **Then** boards remain legible and the density adapts to the player count.
2. **Given** a device with reduced-motion preference enabled, **When** the app animates transitions, **Then** non-essential motion is suppressed while state changes remain perceivable.
3. **Given** a marked cell in either theme, **When** it is displayed, **Then** the mark and disabled states are distinguishable by more than color alone.

---

### Edge Cases

- A player is eliminated mid-game or the game reaches an end condition while a turn is active — turn tracking must still resolve to a valid active player or gracefully stop advancing.
- Per-row scores must remain correct for a row with zero marks (shows zero) and a fully locked row.
- Haptics requested rapidly (many quick marks) must not queue up or cause noticeable lag.
- The theme toggle is changed on one device — this is a per-device preference and need not sync across devices.
- The share action is invoked on a platform without native sharing — a copyable summary must still be available.
- A game ends in a multi-way tie — all tied players are presented as co-winners without implying a single winner.
- Turn advancement on a synced device must not conflict with simultaneous marking on another device.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the current point value of each colored row on a board while points are visible, updating immediately when cells are marked, unmarked, or a row is locked.
- **FR-002**: Per-row scores MUST be hidden together with the grand total when the user hides points, and shown together when points are shown.
- **FR-003**: System MUST designate exactly one active player during play and visually highlight that player's board.
- **FR-004**: Users MUST be able to advance the active player to the next player in turn order, wrapping from the last player back to the first.
- **FR-005**: Active-player state MUST be consistent across synced devices viewing the same game.
- **FR-006**: System MUST emit a brief haptic pulse on a successful mark, lock, or penalty when the device supports haptics, and MUST degrade silently where unsupported or where the tap does not change state.
- **FR-007**: Users MUST be able to choose a light theme, a dark theme, or to follow the system preference, with appearance changing immediately on selection.
- **FR-008**: The selected theme preference MUST persist across sessions on the same device and is treated as a per-device setting.
- **FR-009**: System MUST require an explicit confirmation step before applying a penalty.
- **FR-010**: System MUST present a brief, transient message after a reversible action is undone, identifying the action and the affected player.
- **FR-011**: The final scores screen MUST clearly celebrate the winner and present ties as co-winners without implying a single winner.
- **FR-012**: Users MUST be able to produce a shareable or copyable text summary of the final result.
- **FR-013**: Users MUST be able to start a rematch from the final screen with the previous players' names pre-populated.
- **FR-014**: The play screen layout MUST adapt board density to the number of players so boards remain legible at the maximum supported player count on narrow screens.
- **FR-015**: System MUST suppress non-essential animations when the device indicates a reduced-motion preference.
- **FR-016**: Marked and disabled cell states MUST be distinguishable by more than color alone in both light and dark themes.

### Key Entities *(include if feature involves data)*

- **Turn State**: Identifies which player is currently active and the order in which play proceeds; associated with the in-progress game and shared across synced devices.
- **Theme Preference**: A per-device choice of light, dark, or system appearance that persists across sessions.
- **Undo Notice**: A transient description of the most recently undone action, including the affected player and what changed.
- **Row Score**: The current point value contributed by a single colored row, derived from its marks and lock state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can determine how many points any single row currently contributes within 3 seconds of looking at a board, without performing mental arithmetic.
- **SC-002**: At any moment during play, every person at the table can identify the active player within 2 seconds.
- **SC-003**: Advancing the turn reflects on all synced devices within the same interval as existing score updates (no slower than current live sync).
- **SC-004**: Accidental penalties are reduced such that no penalty is applied without a deliberate confirmation, measured by zero single-tap penalty applications in testing.
- **SC-005**: A returning user's chosen theme is correctly restored on 100% of app reloads.
- **SC-006**: From the final screen, a user can start a rematch with the same players in under 10 seconds and without retyping any name.
- **SC-007**: At the maximum supported player count on a common phone width, all board cells remain tappable at the established minimum touch-target size with no clipped content.
- **SC-008**: With reduced-motion enabled, no non-essential animation plays, while all state changes (marks, locks, turn changes) remain visually perceivable.

## Assumptions

- These enhancements extend the existing single in-progress game model and its live cross-device sync; no new game modes are introduced.
- Turn tracking is advisory for the group's convenience and does not restrict which player may mark cells (the app remains a scoreboard, not a rules enforcer).
- Haptic feedback relies on device capability; absence of support is a silent no-op, not an error.
- Theme preference is intentionally per-device and is not synchronized across devices sharing a game.
- Scoring values and end-game conditions are unchanged from the existing rules; per-row scores reuse the established scoring formula.
- The maximum and minimum player counts are unchanged from the current app.
- Sharing uses the platform's native share capability where available and falls back to copyable text otherwise.

## Out of Scope

- Enforcing turn order or restricting marks to the active player.
- Synchronizing theme preference across devices.
- Adding sound effects (only haptic feedback is in scope).
- New game variants, additional rows, or changes to scoring values.
- Built-in dice rolling.
