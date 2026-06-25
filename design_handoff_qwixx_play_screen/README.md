# Handoff: Qwixx — Play / Scoreboard Screen (revised)

## Overview
This is the in-game play screen for a Qwixx scoreboard web app. It shows one
score board per player. Each board has the four Qwixx rows (red, yellow, green,
blue), each row a strip of number cells the player taps to cross off, plus a
lock cell at the end of each row. Below the rows is a penalty tracker. Each
board shows a live-computed score, and a top app bar holds turn info, a timer,
and Undo / History / Home actions.

## About the Design Files
The file in this bundle — `Qwixx Play Screen (revised).dc.html` — is a **design
reference created in HTML**. It is a prototype showing the intended look and
behavior, **not production code to copy directly**.

Your task is to **recreate this design in the target codebase's existing
environment** (the `tiagomorato/qwixx` web app), using its established
framework, component patterns, and styling approach. If the project has no
established UI layer yet, choose the most appropriate framework for it and
implement the design there. Treat the HTML/inline-style structure as a spec for
layout, color, type, spacing, and interaction — not as files to drop in.

> Note: The HTML uses a small custom templating runtime (`<x-dc>`, `<sc-for>`,
> `<sc-if>`, a `Component` logic class). **Ignore the runtime.** What matters is
> the rendered markup, the inline style values, and the game logic in the
> `Component` class (scoring, toggling, lock/penalty rules), all documented
> below so you don't need to reverse-engineer it.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions
are specified. Recreate the UI to match, using the codebase's existing
libraries and patterns.

## Screens / Views

### Play / Scoreboard
- **Name**: Play screen (active game)
- **Purpose**: During a game, each player crosses off numbers in their four
  rows, locks completed rows, and tracks penalties. Scores update live.
- **Layout**:
  - Page: `min-height:100%`, `padding:24px`, background `#fbfaf7`.
  - Centered content column: `max-width:1200px; margin:0 auto`.
  - **App bar** (top): horizontal flex row, `gap:14px`, wraps; `padding:14px 18px`;
    background `#fbfaf7`; `border:1px solid #e2dfd6`; `border-radius:16px`;
    shadow `0 1px 2px rgba(20,20,30,.06), 0 2px 6px rgba(20,20,30,.05)`;
    `margin-bottom:20px`.
  - **Boards grid**: `display:grid; gap:20px`. Side-by-side layout uses
    `grid-template-columns:repeat(auto-fit, minmax(440px, 1fr))`; stacked layout
    uses `grid-template-columns:1fr`. (Layout is a toggle — see Tweaks.)

#### App bar components (left → right)
- **Title** "Qwixx": Fraunces, weight 900, `1.6rem`, `letter-spacing:-0.01em`,
  color `#1a1a1c`.
- **Color dots**: four `9px` circles, `gap:5px`, colors `#c23232` (red),
  `#c8a420` (yellow), `#3b8d3f` (green), `#2e6cc2` (blue).
- **Turn label**: e.g. "Lena to roll · round 4". Inter Tight, weight 500,
  `0.9rem`, color `#5a5a62`.
- **Timer**: e.g. "14:08". Fraunces, weight 700, `1.1rem`, tabular-nums,
  pushed right with `margin-left:auto`.
- **Buttons** Undo / History / Home: `padding:8px 14px`;
  `border:1.5px solid #e2dfd6`; `border-radius:9px`; background `#fff`;
  Inter Tight, weight 600, `0.88rem`; `min-height:38px`.
  Hover: `border-color:#4338ca; color:#4338ca`.

#### Player board (one per player)
- Container: `position:relative; overflow:hidden`; background `#fff`;
  `border:1px solid #e2dfd6`; `border-radius:16px`; `padding:18px 18px 16px`;
  shadow `0 1px 2px rgba(20,20,30,.06), 0 2px 6px rgba(20,20,30,.05)`.
  Mount animation: fade + 8px rise, `320ms cubic-bezier(.22,1,.36,1)`.
- **Accent bar**: `4px` tall strip pinned to top edge, full width, linear
  gradient `90deg, #c23232, #c8a420 33%, #3b8d3f 66%, #2e6cc2`.
- **Header row**: flex space-between.
  - Player name: Fraunces, weight 900, `1.45rem`, `letter-spacing:-0.01em`,
    `#1a1a1c`.
  - Score pill: number in Fraunces weight 900, `1.9rem`, tabular-nums, on a
    `#f1eee7` chip with `padding:3px 12px; border-radius:9px`. Followed by a
    small "PTS" label (Inter Tight, weight 700, `0.72rem`, uppercase,
    `letter-spacing:0.06em`, `#5a5a62`).
- **Rows wrapper**: `display:flex; flex-direction:column; gap:6px;
  margin-top:14px`.

#### Number row (one per color)
- Row container: `display:grid; grid-template-columns:2.4rem repeat(12, minmax(0,1fr)); gap:5px; align-items:center; padding:7px 9px; border-radius:11px`.
  First grid column is the color label; next 11 are number cells; the final
  (12th repeat) is the lock cell.
- Row background tints (light): red `#fde2e2`, yellow `#fdf4c8`,
  green `#d8f1d0`, blue `#d6e4f6`.
- Row label colors (dark, used for label text + cell numerals): red `#8a1414`,
  yellow `#7a5a07`, green `#16511f`, blue `#16345c`. Label is Inter Tight,
  weight 800, `0.64rem`, uppercase, `letter-spacing:0.04em`, centered.
- **Number cell** (button): `aspect-ratio:1`; `border-radius:7px`;
  background `#fff`; `border:1.5px solid rgba(20,20,30,0.08)`; Inter Tight,
  weight 600, tabular-nums; font-size `clamp(0.7rem, 1.5vw, 0.92rem)`; numeral
  in the row's dark color.
  - Hover: `transform:translateY(-1px) scale(1.06)` + the standard card shadow.
  - Active: `transform:translateY(1px) scale(0.93)` + inset shadow
    `inset 0 2px 4px rgba(20,20,30,.12)`. Transition `120ms cubic-bezier(.22,1,.36,1)`.
  - **Marked state**: numeral replaced by a Fraunces weight-900 ✕ (`1.25rem`)
    in the row's *bright* color (red `#c23232`, yellow `#c8a420`,
    green `#3b8d3f`, blue `#2e6cc2`).
- **Row number values**: red & yellow run **ascending** 2→12; green & blue run
  **descending** 12→2. (11 cells each.)
- **Lock cell** (button, last column): `aspect-ratio:1`; `border-radius:7px`;
  background `rgba(255,255,255,0.5)`; `border:1.5px dashed` in the row's bright
  color; same hover/active scale transforms.
  - Default (not locked): outline padlock SVG icon, `15×15`, `stroke-width:2.2`,
    current color = row bright color.
  - **Ready** (5+ cells crossed in that row and not yet locked): shows a focus
    ring — `position:absolute; inset:-3px; border-radius:10px;
    box-shadow:0 0 0 2.5px currentColor`. Optionally pulses (see Tweaks).
  - **Locked**: shows a Fraunces weight-900 ✕ (`1.2rem`) in the row's bright color.

#### Penalty tracker (bottom of board)
- Row: `display:flex; align-items:center; gap:8px; margin-top:12px;
  padding-top:12px; border-top:1px solid #e2dfd6`.
- Label "PENALTIES": Inter Tight, weight 800, `0.64rem`, uppercase,
  `letter-spacing:0.05em`, `#5a5a62`.
- **4 penalty boxes** (buttons): `28×28px`; `border-radius:7px`;
  `border:1.5px solid #e2dfd6`; background `#fff`.
  - Hover: `transform:scale(1.08); border-color:#b51919`.
  - Active: `transform:scale(0.92)`.
  - Filled: Fraunces weight-900 ✕ (`1.05rem`) in `#b51919`.
- **Penalty score** (right, `margin-left:auto`): `−{n}` where n = penalties × 5;
  Inter Tight, weight 600, `0.8rem`, tabular-nums, `#b51919`.

## Interactions & Behavior
- **Tap a number cell** → toggles that cell marked / unmarked. (In real Qwixx,
  crossing a cell also implies all cells to its left in that row are no longer
  available; the prototype only toggles the single cell — match your app's real
  rules.)
- **Tap a lock cell** → toggles the row locked / unlocked. A row becomes "ready"
  (ring shown) once it has 5+ crossed cells and isn't locked.
- **Tap a penalty box** → sets penalty count. Clicking box _i_ (0-indexed): if
  the count already equals i+1 it drops to i, otherwise it becomes i+1. (i.e.
  clicking the current highest filled box un-fills it; clicking a higher box
  fills up to it.)
- **Hover** states on every interactive element as specified above.
- **Mount animation**: each board fades in and rises 8px over `320ms`.
- **Reduced motion**: all animations/transitions disabled under
  `prefers-reduced-motion: reduce`.

## State Management
Per player:
- `marks`: `{ red:boolean[11], yellow:boolean[11], green:boolean[11], blue:boolean[11] }`
  — which cells in each row are crossed.
- `locked`: `{ red:boolean, yellow:boolean, green:boolean, blue:boolean }`.
- `penalties`: integer 0–4.

Derived (computed each render):
- **Per-row crossed count** = number of `true` in that row's marks.
- **Row "ready"** = count ≥ 5 AND not locked.
- **Score**: for each color, let `m` = crossed count, plus 1 if the row is
  locked (the lock counts as an extra mark). Row points = the triangular number
  `m·(m+1)/2`. Sum the four rows, then subtract `penalties × 5`. That total is
  the score pill value.
- **Penalty score display** = `penalties × 5`.

Sample data in the prototype (round 4): Tiago — red 5, yellow 3, green 2,
blue 0 crossed, 1 penalty, no locks. Lena — red 3, yellow 6, green 6 (locked),
blue 2 crossed, 0 penalties.

## Tweaks / Variants
The prototype exposes two configuration options — implement as props/settings if
useful:
- **Board layout**: `side-by-side` (auto-fit grid, min 440px columns) vs
  `stacked` (single column).
- **Lock cue**: `calm` (static ready ring) vs `pulse` (ring animates —
  keyframes scale the ring's outer box-shadow from `2.5px` to `6px` and back
  over `1.6s`, infinite, `ease-in-out`).

## Design Tokens
**Colors**
- Background: `#fbfaf7`
- Surface (cards/buttons): `#fff`
- Border: `#e2dfd6`
- Text primary: `#1a1a1c`
- Text muted: `#5a5a62`
- Score chip bg: `#f1eee7`
- Focus ring (keyboard): `rgba(67,56,202,0.28)`; accent indigo `#4338ca`
- Qwixx bright: red `#c23232`, yellow `#c8a420`, green `#3b8d3f`, blue `#2e6cc2`
- Qwixx row tint: red `#fde2e2`, yellow `#fdf4c8`, green `#d8f1d0`, blue `#d6e4f6`
- Qwixx dark (numerals/labels): red `#8a1414`, yellow `#7a5a07`,
  green `#16511f`, blue `#16345c`
- Penalty red: `#b51919`

**Typography**
- Display / numerals: **Fraunces** (Google Fonts), weights 500 / 700 / 900,
  optical sizing 9..144.
- UI / body: **Inter Tight** (Google Fonts), weights 400 / 500 / 600 / 700.
- Use `font-variant-numeric: tabular-nums` for all scores, timer, and cell
  numbers.

**Radius**: cards/app bar `16px`; row strips `11px`; buttons `9px`; cells &
penalty boxes `7px`; ready ring `10px`.

**Shadows**
- Card / raised: `0 1px 2px rgba(20,20,30,.06), 0 2px 6px rgba(20,20,30,.05)`
- Pressed (inset): `inset 0 2px 4px rgba(20,20,30,.12)`

**Spacing**: page pad `24px`; board pad `18px 18px 16px`; boards gap `20px`;
row gap `6px`; cells gap `5px`.

**Motion**: standard ease `cubic-bezier(.22,1,.36,1)`; cell/lock transitions
`120ms`; board entrance `320ms`; lock pulse `1.6s ease-in-out infinite`.

## Assets
No external images. The only graphics are:
- Inline SVG padlock icon (outline, `stroke-width:2.2`) on unlocked rows.
- The ✕ marks and lock ✕ are the Fraunces "✕" glyph, not an asset.
Fonts loaded from Google Fonts (Fraunces, Inter Tight).

## Files
- `Qwixx Play Screen (revised).dc.html` — the full hifi prototype (markup +
  inline styles + game logic). Open it in a browser to see live behavior and
  inspect exact values.
