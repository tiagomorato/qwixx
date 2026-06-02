# Feature Specification: Manual Per-Color Score Entry

**Feature Branch**: `002-manual-score-entry`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "During a game, under the scoreboard and between \"penalties 0 of 4\" and take penalty, there should be empty fields, one for each color: red, yellow, green and blue, in the horizontal. the idea is that when the game ends, the user can manually enter the points there."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record final per-color points by hand (Priority: P1)

A group finishes a Qwixx session. For each player's scoreboard, the scorekeeper wants
to write down the points earned in each colored row (red, yellow, green, blue) in a
dedicated place on that player's board, just as they would total each color band on a
paper scorecard. A row of four empty fields — one per color — sits on each scoreboard
between the penalty tracker and the "Take Penalty" button, ready to receive those
numbers when the game wraps up.

**Why this priority**: This is the whole point of the request — giving the user a place
to manually record the per-color points for each player at the end of a game.

**Independent Test**: In an active game, a tester can locate the four colored entry
fields on each player's scoreboard, type a number into each (e.g., red 12, yellow 8,
green 15, blue 6), and see those values retained on the board.

**Acceptance Scenarios**:

1. **Given** an active game with player scoreboards on screen, **When** the user looks
   at a scoreboard, **Then** four empty entry fields are shown in a single horizontal
   row, ordered red, yellow, green, blue, positioned below the penalty tracker
   ("Penalties: 0 of 4") and above the "Take Penalty" button.
2. **Given** the four colored entry fields on a player's board, **When** the user types
   a number into the red field, **Then** that number appears in the red field and the
   other three fields remain unchanged.
3. **Given** a player who has values entered in some colored fields, **When** the user
   enters values into the remaining fields, **Then** each field independently holds the
   value typed for its color.
4. **Given** colored entry fields with values typed in, **When** the user closes and
   re-opens the application for the same in-progress game, **Then** the previously
   entered values are still present in their respective fields.

---

### User Story 2 - Correct an entered value (Priority: P2)

After typing a per-color number, the scorekeeper notices a mistake (wrong value or
wrong color) and wants to change or clear it without affecting the other colors.

**Why this priority**: Manual entry invites typos; being able to fix a single field is
expected behavior but secondary to having the fields at all.

**Independent Test**: With values already entered, a tester can edit the value in one
field and clear another, leaving the remaining fields untouched.

**Acceptance Scenarios**:

1. **Given** a colored field containing a value, **When** the user replaces it with a
   different number, **Then** the field shows the new number and no other field changes.
2. **Given** a colored field containing a value, **When** the user clears the field,
   **Then** the field becomes empty and the others are unaffected.

---

### Edge Cases

- What happens when the user leaves one or more colored fields empty? Empty fields are
  permitted; they simply hold no value.
- What happens if the user types a non-numeric character into a colored field? The field
  accepts only numeric point values and ignores or rejects non-numeric input.
- What happens to entered values across multiple players? Each player's scoreboard has
  its own independent set of four colored fields; entries on one player's board never
  appear on another's.
- What happens when a new game is started? The colored fields begin empty for every
  player in the new game.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each player's scoreboard MUST display four manual point-entry fields, one
  per Qwixx color (red, yellow, green, blue).
- **FR-002**: The four fields MUST be arranged in a single horizontal row, ordered red,
  yellow, green, blue.
- **FR-003**: The fields MUST be positioned within the scoreboard between the penalty
  tracker ("Penalties: N of 4") and the "Take Penalty" button.
- **FR-004**: Each field MUST start empty when a game begins.
- **FR-005**: Users MUST be able to type a numeric point value into any of the four
  fields at any time during an active game.
- **FR-006**: Each field MUST hold its value independently — editing or clearing one
  field MUST NOT change any other field.
- **FR-007**: Each field MUST visually indicate which color it corresponds to.
- **FR-008**: Fields MUST accept only numeric point values; non-numeric input MUST NOT
  be stored.
- **FR-009**: Entered values MUST persist with the in-progress game so that they survive
  closing and re-opening the application, consistent with how existing game state is
  retained.
- **FR-010**: Each player MUST have an independent set of four fields; values entered on
  one player's board MUST NOT affect another player's fields.
- **FR-011**: Users MUST be able to clear a field, returning it to the empty state.
- **FR-012**: The manually entered per-color values MUST be purely informational. They
  MUST NOT feed into the player's grand total, the automatic per-color scoring, or the
  final-scores screen; the app's existing automatic scoring MUST remain unchanged.

### Key Entities *(include if data involved)*

- **Manual color score**: A user-entered point value associated with a specific player
  and a specific color (red, yellow, green, or blue). May be empty. Belongs to exactly
  one player's scoreboard.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On every player's scoreboard, a user can find four color-labeled entry
  fields in the specified location (between penalty tracker and "Take Penalty") without
  guidance.
- **SC-002**: A user can enter a point value for all four colors of a player in under 15
  seconds.
- **SC-003**: 100% of values typed into the fields are retained after the application is
  closed and re-opened for the same in-progress game.
- **SC-004**: Entering or changing a value in one field never alters the value shown in
  any other field or any other player's fields.

## Assumptions

- The fields are intended primarily for use at game end, but the user may enter or edit
  values at any time while a game is active; there is no enforced lock tied to game
  completion.
- The fields appear on the in-game scoreboard for every player, matching the user's
  description of placement relative to the penalty tracker and "Take Penalty" button.
- Values entered are non-negative whole numbers representing points; standard Qwixx
  per-color scoring produces such values.
- Manual values are persisted using the same local persistence mechanism already used
  for in-progress game state.
- This feature does not change the existing automatic marking, locking, penalty, or
  scoring behavior of the scoreboard; it adds a manual recording area alongside it.
- The manual fields are purely informational (per FR-012): they are a hand-entered note
  for the user and have no effect on computed totals or the final-scores screen.
