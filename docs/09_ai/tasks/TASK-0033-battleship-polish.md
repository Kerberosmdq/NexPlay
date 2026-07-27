# TASK-0033: Battleship M4a Polish — Placement Preview, Ship Art, Hit/Sink Feedback, Fire Animation, Board Layout

### Goal
Founder feedback from the first live playtest of M4a (`TASK-0031`), taken
before starting M4b (special weapons) because M4b's multi-cell shots need
the same hit/sink-feedback and fire-animation system this task builds —
better to build it once here than retrofit it under M4b's pressure.

### Scope — in
1. **Live placement preview.** While placing a ship, show a semi-transparent
   "ghost" of the ship at the currently-targeted cell (following
   tap/drag), so the player sees exactly where it will land before
   confirming — not the current "tap and it's just placed" flow.
2. **Real ship artwork.** Founder is generating a custom image (5 ship
   silhouettes, felt-green board-game-token style, matching `BDR-0001`) via
   an external tool, to be dropped at `public/Battleship_Ships.png`.
   Process it (a `scripts/`-based script, same pattern as
   `scripts/generate-icons.mjs`) into per-ship-type image assets and use
   them in place of the current plain colored squares for ships (both
   during placement and on the owner's own board during firing).
3. **Hit/sink feedback.** An explicit, animated notification when a shot
   lands: "hit" vs "miss" distinctly, and — the specific gap reported —
   when a hit sinks a ship, a clear announcement naming which ship type
   was sunk (`Battleship.ships.*` already has localized names).
4. **Fire animation.** When a cell is targeted/fired at, something visibly
   "falls from the sky" onto that cell (a `motion.css`-vocabulary gesture,
   consistent with the project's named-gesture convention — not an ad-hoc
   one-off animation). Must also make sense for a future multi-cell shot
   (M4b), i.e. designed to run per-cell, not assuming exactly one cell.
5. **Board layout preference.** Let each player choose how their own two
   boards (their own board, the targeting board) are arranged: stacked
   (current default), side-by-side, or one-at-a-time with a toggle. This
   is a per-device *view* preference, not shared/game state — it never
   needs to sync between players or go through the reducer.

### Scope — out (non-goals for this task)
- Anything from M4b (charges, ship-bound weapons, the four shot shapes) —
  this task only builds the feedback/animation *system* those will reuse,
  not the weapons themselves.
- Re-litigating M4a's core rules (turn order, one-shot-per-turn, board
  sizes) — none of that changes here.
- Teams/tournament (M4c/M4d) — unrelated.

### Files this task may touch
- `games/battleship/views/Player.tsx`
- `games/battleship/placement.ts` (only if the ghost-preview needs a new
  pure helper)
- `app/motion.css` (new named gesture(s) for the fire animation)
- `scripts/generate-ship-assets.mjs` (new, mirrors
  `scripts/generate-icons.mjs`)
- `public/Battleship_Ships.png` (founder-provided source, once generated),
  processed output assets under `public/battleship/`
- `i18n/es.json`, `i18n/en.json` (new keys: sink announcement, layout
  preference labels)
- `tests/unit/battleship-game.test.ts` (only if new pure helpers are added)

### Relevant context
- `BDR-0001` — the visual direction the ship art must match (Paper & Felt;
  felt-green primary `#1F6B52`, ink `#2B2118`).
- `app/motion.css` / `ADR-0004` — the existing named-gesture motion
  vocabulary (`reveal`/`deal`/`celebrate`/`pulse`) and its mandatory
  `prefers-reduced-motion` fallback; new gestures must follow this pattern,
  not introduce a one-off animation outside it.
- `TASK-0031` / `HANDOFF.md` — M4a's current state, including the two live
  bugs found and fixed there (useful context for how this game's view is
  structured).

### Definition of Done
All seven items in `CONVENTIONS.md` §Definition of Done, plus:
- The fire animation and hit/sink feedback both respect
  `prefers-reduced-motion` (per `ADR-0004`'s existing rule for every named
  gesture).
- Board layout preference persists per-device (localStorage is fine — it's
  a display preference, not game state) and doesn't require any reducer or
  `GameModule` contract change.
- Ship art renders correctly for all 5 ship types at both board sizes
  (8×8 and 10×10).
- Zero hardcoded user-facing strings.

### How to verify
```bash
pnpm lint && pnpm typecheck && pnpm vitest run && pnpm test:e2e
```
Manually, in two browser profiles: place a fleet and confirm the live
preview follows the pointer before confirming; fire and confirm the
sky-drop animation plays on the targeted cell; sink a ship and confirm an
explicit, named announcement appears; switch board layout and confirm it
changes only on that device.
