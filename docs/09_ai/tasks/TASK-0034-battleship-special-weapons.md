# TASK-0034: Battleship — Special Weapons (M4b)

### Goal
Ship `docs/ROADMAP.md`'s M4b: charges, a ship-bound weapon table, the four
shot shapes (double horizontal, double vertical, triple, cross), and the
aim → preview → confirm interaction they need — on top of M4a's core 1 vs 1
(`TASK-0031`) and its polish pass (`TASK-0033`).

### Design decisions (confirmed with the founder before implementation,
not to be re-litigated mid-task)
- **Shot shapes**, anchored on the tapped cell:
  - Double Horizontal — 2 horizontally-adjacent cells.
  - Double Vertical — 2 vertically-adjacent cells.
  - Triple — 3 cells in a line; the firing side picks horizontal/vertical at
    aim time (same orientation-toggle pattern as ship placement).
  - Cross — the anchor cell plus its four orthogonal neighbors (5 cells,
    doesn't rotate).
  - Any shape cell that falls off the board is silently clipped (not
    rejected) — you're bombarding an area, not placing a physical object;
    wasted cells are the cost of firing near an edge.
- **Ship-bound weapon table** (a ship's weapon is unusable once that ship is
  sunk — this is the "tension" half of the founder's charges+ship-bound
  combination):
  | Ship type   | Weapon           | Fleets it exists in |
  |-------------|------------------|----------------------|
  | carrier     | Cross            | 8×8 and 10×10        |
  | battleship  | Triple           | 10×10 only           |
  | destroyer   | Double Vertical  | 8×8 and 10×10        |
  | submarine   | Double Horizontal| 8×8 and 10×10        |
  | patrol      | *(none)*         | 8×8 and 10×10        |

  On an 8×8 board (no "battleship" ship type) only 3 of the 4 weapons are
  ever in play in a given match — confirmed acceptable to the founder,
  not a gap to fix.
- **Charges** (the "economy" half):
  - Per side, starts at 0. A side gains **+1 charge automatically the
    instant its turn begins** (i.e. in the same `RESOLVE_SHOT` transition
    that flips `turn` to that side).
  - The plain single-cell shot (M4a's existing `FIRE`) **costs 0 charges,
    always available** — charges are never required just to keep playing
    normally.
  - Special-weapon costs: Double (either orientation) = 2, Triple = 3,
    Cross = 4.
  - **Anti-snowball compensation**: when a side's own ship is sunk, *that
    side* (the one who just lost the ship) immediately gains **+2 bonus
    charges** — a catch-up mechanic, not a reward for the attacker.
  - The charge pool is shared per side (not per-ship) — only *weapon
    availability* is gated per-ship, not the currency itself.
  - All the numbers above (+1/turn, +2 compensation, 2/3/4 costs) are
    explicitly playtest-tunable, per `docs/ROADMAP.md`'s own framing
    ("the exact numbers are playtest-tuned, the anti-snowball intent is
    not") — don't treat them as sacred if the founder wants to adjust
    after playing.
- **Aim → preview → confirm interaction**: a weapon selector (plain shot +
  any weapon whose ship is still afloat and whose cost the side can
  currently afford) above the target board during the firing phase.
  Selecting a weapon enters an aiming mode: tapping/dragging on the target
  board shows a ghost overlay of the shape's cells (reusing the same
  ghost-rendering pattern `TASK-0033`/the drag-placement fix already built
  for ship placement — translucent, tinted by validity), Triple gets an
  orientation toggle identical to placement's, and releasing/confirming
  fires it and deducts the charge. Reject (don't let the player confirm) a
  shot whose every cell is out-of-bounds or already-fired-at on the whole
  board size (a shape that's *entirely* wasted); a partially-wasted shape
  (some cells already fired at, or off-board) is allowed, same "some risk
  is on you" logic as the plain shot already has via `shotsIFired[cell]`.

### Scope — in
- `games/battleship/reducer.ts`: `BattleshipState` gains `charges: Record<
  BattleshipSide, number>`. `FIRE` gains an optional weapon+orientation (or
  equivalent shape descriptor); `pendingShot` carries a `cells: string[]`
  array instead of a single `cell`. `RESOLVE_SHOT` carries an array of
  per-cell results and (potentially) more than one sunk ship type in a
  single shot, deducts the weapon's charge cost, grants the +1/turn income
  on the same transition, and grants the +2 sink-compensation bonus to the
  defending side.
- `games/battleship/weapons.ts` (new): the shape-geometry pure functions
  (mirrors `placement.ts`'s `shipCells`) and the ship-type → weapon → cost
  table, unit-testable with no reducer/React involvement.
- `games/battleship/views/Player.tsx`: weapon selector UI, aiming-mode ghost
  preview (shape, not a single cell), Triple's orientation toggle, a
  visible charge counter per side, wiring the new `FIRE` shape into the
  existing dispatch.
- `answerPendingShot` (`reducer.ts`): resolves every cell in `pendingShot.
  cells` against the defending device's own private fleet in one pass,
  same "only the result travels, never the layout" rule as M4a — extended
  to possibly multiple sunk-ship entries in one resolution.
- Unit tests: weapon geometry (`weapons.ts`), the charge economy (income,
  cost deduction, compensation, weapon unavailable once its ship is sunk),
  multi-cell `RESOLVE_SHOT` (including a shot that sinks two ships at once).
- i18n: weapon names/labels in `i18n/es.json`/`en.json`.

### Scope — out (non-goals for this task)
- M4c (teams) and M4d (tournament) — untouched.
- Any change to placement, hit/sink-announcement, or board-layout UI beyond
  what's needed to add the weapon selector/aiming mode alongside them.
- Rebalancing the confirmed numbers pre-emptively — ship as specified above,
  let the founder's next playtest drive any rebalancing.
- Any change to `GameModule`'s contract shape itself (`TPrivate`,
  `setupPrivate`, `answerPending`'s signature) — M4a's mechanism already
  supports everything this task needs.

### Files this task may touch
- `games/battleship/reducer.ts`
- `games/battleship/weapons.ts` (new)
- `games/battleship/views/Player.tsx`
- `i18n/es.json`, `i18n/en.json`
- `tests/unit/battleship-game.test.ts`
- `tests/unit/private-state.test.ts` (only if the `pendingShot`/
  `RESOLVE_SHOT` shape change touches its existing assertions)
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md`
  (Definition of Done)

### Relevant context
- `docs/ROADMAP.md` — M4 section, M4b bullet.
- `docs/00_decisions/architecture/ADR-0005-PRIVATE-GAME-STATE.md` — the
  challenge/response flow this task's multi-cell resolution extends; also
  read its v1.2.0 changelog entry (the sunk-ship-cells exception this
  task's multi-sink case will produce more of).
- `TASK-0031-battleship-core.md`, `TASK-0033-battleship-polish.md` — the
  mechanism and UI patterns (ghost overlay, drag placement, hit/sink
  announcement loop) this task builds directly on top of.

### Definition of Done
- Everything in `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.
- Every reducer change ships with unit tests: normal play, a weapon whose
  ship has been sunk correctly becomes unavailable, charge income/cost/
  compensation math, a multi-ship-sinking single shot.
- Live two-real-tab verification (same method as `TASK-0033`'s fixes): both
  sides can fire every weapon type at least once, charges track correctly
  on both devices independently, a sunk ship's weapon disappears from the
  selector, privacy holds (no ship layout leaks beyond what a fully-sunk
  ship's own cells already reveal, per ADR-0005 v1.2.0).
- `docs/ROADMAP.md`'s M4b bullet marked done; `CURRENT_STATE.md`/
  `HANDOFF.md` updated — including reconciling the still-outstanding doc
  debt from PRs #41–44 in the same pass, since this task's own DoD would
  otherwise leave three untracked PRs stacked on top of each other.

### How to verify
- `pnpm typecheck && pnpm lint && pnpm vitest run`.
- Live two-tab browser check (per the established pattern this session):
  place fleets, accrue charges over several turns, fire each weapon shape
  at least once, sink a weapon-carrying ship and confirm that ship's
  weapon disappears from its own owner's selector (not the attacker's —
  the attacker never had it to begin with), and confirm compensation
  charges land on the side that just lost the ship.
