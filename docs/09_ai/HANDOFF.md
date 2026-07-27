# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0033
- **Title**: Battleship M4a Polish — Placement Preview, Ship Art, Hit/Sink Feedback, Fire Animation, Board Layout

## Current Branch
- `feat/battleship-polish-feedback-and-layout`, branched off `main` after
  PR #39 (M4a core) merged.

## What's in this task

Founder feedback from playing M4a live for the first time, addressed
*before* M4b (special weapons) rather than after — M4b's multi-cell shots
need the exact same hit/sink-feedback and fire-animation system this task
builds, so building it once here avoids retrofitting it under M4b's
pressure.

### 1. Live placement preview
Placement was tap-to-instantly-place before; the founder found that gave no
chance to see where a ship would land. Now: tap sets/moves a semi-transparent
ghost preview (green if valid, red if it would overlap/run off the board),
tapping elsewhere moves it, and an explicit "Confirmar barco" button commits
it. `games/battleship/views/Player.tsx`'s placing-phase block was rewritten
around a new `previewCell` state and `ghostCells`/`ghostValid` derived
values; the actual commit still goes through `setPrivateState`, unchanged
from M4a.

### 2. Real ship artwork
The founder generated a 5-ship reference image (all ships side by side, one
PNG, opaque parchment background — not transparent) via an external image
tool, from a prompt built collaboratively (felt-green board-game-token
style, matching `BDR-0001`). Two versions were generated (flat vs. a subtle
3D/bevel look); the founder chose the 3D/bevel one.

**`scripts/generate-ship-assets.mjs`** (new, mirrors
`scripts/generate-icons.mjs`'s pattern — `sharp` imported from its pnpm
store path) processes it into `public/battleship/<type>.png`:
- **Auto-detects each ship's bounding box** by scanning columns for
  non-background content and clustering them into 5 ranges (tolerant of
  small internal gaps), rather than hardcoding pixel coordinates — this
  is more robust than the hexagon-logo script's hardcoded `BBOX` and worth
  reusing as the pattern for any future multi-sprite source image.
- **Removes the background with a smoothly-ramped chroma key**, not a hard
  distance cutoff. The source art has a soft drop shadow under each ship (a
  gradient, not a hard edge); a binary cutoff either left a visible halo
  (threshold too low) or ate into the ship's own dark outline (threshold too
  high). Alpha now ramps linearly between two distance thresholds
  (`CUTOUT_LOW`/`CUTOUT_HIGH`), so the shadow fades out naturally.

Each ship then renders as **one image spanning its full cell footprint**
(a new `ShipOverlay` component in `Player.tsx`), not tiled flat-color
squares. The source art is bow-up (vertically oriented); a horizontal
placement is achieved by sizing the image to the *transposed* footprint and
rotating it 90° around its own center — the rotated bounding box then
exactly matches the horizontal cell span. Used on the placement grid, a
player's own board during firing, and the post-match revealed board — never
on the opponent's targeting board, which correctly shows no ship data at
all.

Hit markers (a small red dot) render as a separate overlay layered *above*
the ship art, since an opaque ship image would otherwise hide the
underlying hit/miss cell coloring.

### 3 & 4. Hit/sink feedback + fire animation
Two new named gestures in `app/motion.css` — `nx-strike` (drops in from
above and settles, for a shot landing) and `nx-shake` (a sharper jolt, for a
ship going down) — following the existing
`reveal`/`deal`/`celebrate`/`pulse` pattern exactly, including
`prefers-reduced-motion` fallbacks. Not one-off animations bolted on
outside the vocabulary.

`Player.tsx` diffs the *shared* `state.shots`/`state.sunkShips` against what
this device last saw (via `useRef`s, in a `useEffect`) to detect a new
result and show an announcement ("¡Tocado!"/"Agua..."/"¡Hundiste
{ship}!") plus trigger the strike/shake class on the affected cell — no new
reducer field needed, and both devices compute this independently from the
same shared state. **Designed for M4b's reuse**: the diffing loop already
handles multiple new cells appearing in one update (a single-shot game never
exercises that today, but a multi-cell weapon will).

### 5. Board layout preference
Stacked (default) / side-by-side / one-at-a-time, a per-device
`localStorage` preference (`nexplay:battleship-board-layout`) with a
3-button switcher. Deliberately **not** game state — it never touches the
reducer, never syncs between players, each device picks independently.

## A lint catch worth remembering
Initially wrote the layout-preference read as a mount `useEffect` calling
`setLayout` — `react-hooks/set-state-in-effect` correctly flagged this
("calling setState synchronously within an effect can trigger cascading
renders"). Fixed by reading `localStorage` in `useState`'s lazy initializer
instead (same pattern `usePrivateState` already uses) — no effect needed at
all for a value that's fully known before first render.

## Files Modified / Added
- `app/motion.css` (`nx-strike`, `nx-shake` gestures)
- `games/battleship/views/Player.tsx` (placement preview, ship art overlay,
  hit/sink feedback, board layout — most of this task's work)
- `scripts/generate-ship-assets.mjs` (new)
- `public/Battleship_Ships.png` (founder-provided source, kept for
  regeneration), `public/battleship/*.png` (5 generated assets)
- `i18n/es.json`, `i18n/en.json` (new keys: confirm/preview-hint, hit/miss/
  sunk announcements, 3 layout labels)
- `docs/09_ai/tasks/TASK-0033-battleship-polish.md` (new)
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, this file

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`, strict
  branch protection, GitHub Actions secrets `NEXT_PUBLIC_SUPABASE_URL`/
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` now configured (added for PR #39's e2e
  job, see that PR/HANDOFF history if this ever needs re-explaining).

## Pending Tasks
- **M4b — Special weapons.** Charges, the ship-bound weapon table, the four
  shot shapes (double horizontal, double vertical, triple, cross), and the
  aim → preview → confirm interaction they need. Reuses this task's
  hit/sink-announcement and fire-animation system directly — read
  `Player.tsx`'s diffing effect before reinventing it. No task spec written
  yet.
- **Founder playtest of Battleship (M4a + this polish) on real phones**,
  independent of M4b starting. Verification so far (both `TASK-0031` and
  this task) used two Playwright/browser contexts on one machine, not two
  real devices over a real network.
- Founder playtest of multi-device Who Am I on real phones (M3's last open
  item, independent of the above).
- M1's dedicated two-real-phones reconnection test (open since M1,
  independent of the above).
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice — the latent leak the ADR documents is real but not urgent.

## Next Suggested Task
- Write the M4b task spec, then implement it on top of M4a + this polish
  pass's reducer/view shape.
