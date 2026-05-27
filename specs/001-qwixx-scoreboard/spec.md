# Feature Specification: Qwixx Digital Scoreboard

**Feature Branch**: `001-qwixx-scoreboard-web-app`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "i want to create a web application for the game qwixx. the idea is that instead of having a paper with the game board, i have it on the web application. the idea is that users can start a new game, select amount of players (1 to 6), write their respective names and play it. The dices will be thrown in real life, the ideal is to only digitalize the score board and have the data saved in the website, that will run locally only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start and play a complete game (Priority: P1)

A group sits down with a set of Qwixx dice. They open the application on one device,
start a new game, pick the number of players, enter each player's name, and use the
on-screen scoreboards (one per player) in place of the paper scorecards for the rest
of the session. They roll the dice in real life, and after each roll, every player
taps the numbers they choose to cross off on their own row. The application enforces
row direction and lock rules, tracks penalties, ends the game when end conditions
are met, and shows final scores.

**Why this priority**: This is the entire purpose of the product. Without it there is
no value to deliver; everything else is a refinement.

**Independent Test**: From a freshly loaded application, a tester can: create a 3-player
game with chosen names, mark numbers across all four colored rows for each player over
several simulated turns, trigger a penalty, lock a row, reach an end condition, and see
correct final scores — all without leaving the app.

**Acceptance Scenarios**:

1. **Given** the home screen, **When** the user selects "New Game", chooses 3 players,
   enters three names, and confirms, **Then** the play screen shows three scoreboards
   labeled with those names and no marks on any row.
2. **Given** a player's red row with no marks, **When** the player taps a red number
   (e.g., 5), **Then** that number is marked, numbers to its left in the red row become
   unavailable, and the player's current red-row score updates accordingly.
3. **Given** a player's row with five or more marks including the rightmost number,
   **When** the player taps the lock cell of that row, **Then** the row is locked for
   that player, the lock counts as an extra mark in the score, and the color is marked
   globally locked across all players' boards.
4. **Given** an active turn's active player, **When** they tap "Take Penalty",
   **Then** one penalty cell on their board is filled and their total score reflects
   the −5 penalty.
5. **Given** any player has reached four penalties, **When** the app detects this state,
   **Then** the game ends and the final-scores screen is displayed with each player's
   row totals, penalty total, and grand total, sorted highest first.
6. **Given** an in-progress game, **When** the user closes the browser tab and
   re-opens the application, **Then** the same game resumes with all marks, penalties,
   names, and locked rows intact.

---

### User Story 2 - Correct a mistake (Priority: P2)

During play, a player marks the wrong number or takes a penalty in error. They want to
undo that single action without losing the rest of the game state.

**Why this priority**: Mistakes are inevitable on a shared device. Without an undo, the
group's only recourse is to restart, which destroys all earlier progress and frustrates
players. Without it the product is usable but fragile.

**Independent Test**: After making several marks across multiple players' boards, a
tester can tap an "undo" affordance on the most recent action and see only that action
reverted, with all earlier marks preserved.

**Acceptance Scenarios**:

1. **Given** a player has just marked a number, **When** the user invokes undo within
   the same turn, **Then** the most recently marked cell is cleared and that row's
   score recomputes.
2. **Given** a player has just taken a penalty, **When** the user invokes undo,
   **Then** the penalty is removed and the score recomputes.
3. **Given** a row was just locked, **When** the user invokes undo, **Then** the lock
   is removed both for that player and globally, and other players may again mark
   that color.

---

### User Story 3 - Review past games (Priority: P3)

After a game ends, players sometimes want to see who won the previous game, or compare
recent scores. They expect a short history kept on the device.

**Why this priority**: It adds long-term engagement value but the core product is
complete without it. Most games are played, finalized, and forgotten in the moment.

**Independent Test**: After finishing two games on the device, a tester can open a
history view and see both games listed with date, players, and final scores; opening
one shows the full final board state.

**Acceptance Scenarios**:

1. **Given** at least one completed game exists on the device, **When** the user opens
   the history view, **Then** they see a list of completed games ordered most recent
   first, each showing date, player names, and the winner.
2. **Given** a completed game in the history view, **When** the user opens it,
   **Then** they see every player's final scoreboard exactly as it ended.

---

### Edge Cases

- A player attempts to mark a number that is to the left of an already-marked number in
  the same row → the action MUST be rejected with clear feedback (the cell is visibly
  disabled, not just silently inert).
- A player attempts to lock a row but has fewer than five marks in that row → the lock
  cell MUST be disabled with explanatory feedback on tap.
- A color is globally locked → all unmarked cells in that color across every player's
  board MUST be disabled.
- The game ends mid-turn (two rows lock, or a player reaches four penalties) → no
  further marks are accepted; the app transitions immediately to final scores.
- The user reloads the page during data persistence → the resumed state MUST be
  internally consistent (no partial marks, no orphaned penalties).
- Two players' names are identical → both are accepted; the app distinguishes them
  visually by position or a numeric suffix, never by silently renaming.
- Empty or whitespace-only player name → rejected at name entry with a clear message.
- The user starts a new game while one is in progress → the app MUST warn that the
  current game will be lost and require confirmation before discarding it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST allow a user to start a new game from the home
  screen, choose a player count between 1 and 6, and enter a non-empty name for each
  player before play begins.
- **FR-002**: The application MUST display, during play, one scoreboard per player
  containing four colored rows (red, yellow, green, blue), a penalty track of four
  cells, and a running total score.
- **FR-003**: The red and yellow rows MUST present numbers 2 through 12 left-to-right
  in ascending order; the green and blue rows MUST present numbers 12 through 2
  left-to-right in descending order; each row MUST end with a lock cell.
- **FR-004**: When a player marks a cell, the application MUST prevent any later mark
  in cells to its left in the same row for that player.
- **FR-005**: The application MUST allow a row to be locked only when the player has
  already marked at least five cells in that row AND is marking (or has marked) the
  rightmost numeric cell.
- **FR-006**: When any player locks a row of a given color, that color MUST become
  globally locked: no further marks in that color are accepted on any player's board.
- **FR-007**: The application MUST allow the user to record a penalty for any player,
  filling the next available penalty cell on that player's board.
- **FR-008**: The application MUST end the game and present final scores when either
  two rows are globally locked OR any player has accumulated four penalties.
- **FR-009**: The application MUST compute each player's score as the sum of per-row
  scores (using the standard Qwixx triangular table where 1 mark = 1, 2 = 3, 3 = 6,
  4 = 10, 5 = 15, 6 = 21, 7 = 28, 8 = 36, 9 = 45, 10 = 55, 11 = 66, 12 = 78, where a
  locked row counts the lock as an additional mark), minus 5 points per penalty, and
  display the total live as the board changes.
- **FR-010**: The application MUST allow the user to undo the most recent
  cell-mark, lock, or penalty action and have all derived state (scores, global
  locks, end conditions) recompute correctly.
- **FR-011**: The application MUST persist the current in-progress game across
  browser reloads and tab closures, with no server or external storage involved.
- **FR-012**: The application MUST keep a local history of completed games — at
  minimum the most recent 10 — recording date, player names, final per-player
  scores, and final board state.
- **FR-013**: The application MUST allow the user to abandon an in-progress game and
  start a new one, requiring an explicit confirmation step before any data is
  discarded.
- **FR-014**: All interactive elements (cells, lock cells, penalty cells, buttons)
  MUST visibly communicate their state (available, marked, disabled, just-changed)
  through more than color alone, so the board is usable by color-blind players.
- **FR-015**: The application MUST function entirely offline after first load and
  MUST NOT make any network requests during gameplay.

### Key Entities *(include if feature involves data)*

- **Game**: A single play session. Has a unique identifier, a start timestamp, a list
  of players, a current status (in-progress or completed), and an end timestamp when
  completed. Owns the global lock state for each color.
- **Player**: Belongs to one Game. Has a display name, a position (1–6), a scoreboard,
  a penalty count (0–4), and a computed total score.
- **Scoreboard**: Belongs to one Player. Composed of four colored rows and the lock
  state of each. Tracks which cells are marked and the order in which they were
  marked (to support undo).
- **Row**: Belongs to one Scoreboard. Has a color, an ordered sequence of 11 numeric
  cells plus one lock cell, and a locked-by-this-player flag.
- **Action Log Entry**: An ordered, append-only record of every mark/lock/penalty so
  the most recent action can be reversed deterministically; persisted alongside the
  Game.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can start a 4-player game from the home screen and reach the
  first markable scoreboard in under 30 seconds.
- **SC-002**: Marking, locking, or penalizing any cell visibly updates the score and
  board state within 100 ms on a typical consumer device, as perceived by the player.
- **SC-003**: After closing and re-opening the app, an in-progress game resumes with
  100% of its prior marks, penalties, lock states, and player names intact, in 100% of
  trials.
- **SC-004**: In a usability test with at least five participants familiar with the
  paper game, at least 90% complete a full game without external help and report the
  digital board to be as clear as the paper version or clearer.
- **SC-005**: Across a sample of at least 20 finished games, the application's final
  scores match an independent hand calculation in 100% of cases.
- **SC-006**: Zero gameplay actions require network connectivity; the application
  remains fully functional with the device in airplane mode after the first load.
- **SC-007**: No more than 1 player out of every 50 (≤2%) needs to restart a game due
  to an unrecoverable state caused by the application (e.g., a mismarked cell that
  cannot be undone).

## Assumptions

- The dice are physical and external to the app; the app does not generate, validate,
  or constrain dice rolls in any way. It is purely a scoreboard.
- Play is **hot-seat on a single device**: all players use the same browser on the
  same device, taking turns to interact with their own column. The app does not
  enforce turn order or identify who is tapping; it trusts the group, mirroring the
  honor system of the paper game.
- "Local only" means: persistence uses on-device browser storage, the app makes no
  network calls during gameplay, and no user account or sign-in exists. The same
  device sees the same data; switching devices does not migrate data.
- For player counts of 1 or 6 (outside Qwixx's officially boxed 2–5 range), the same
  rules and scoreboard mechanics apply uniformly; no special solo or 6-player
  rule variant is introduced.
- The standard published Qwixx scoring table and end conditions are authoritative;
  no house-rule variants are included in v1.
- "Recent games" history is bounded (default: last 10 completed games) to keep
  on-device storage usage trivial; older games are automatically pruned.
- Browser compatibility targets modern evergreen browsers on desktop and mobile;
  older or non-evergreen browsers are out of scope for v1.
- Internationalization and localization are out of scope for v1; UI text is in a
  single language (English).
