# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0034
- **Title**: Battleship — Special Weapons (M4b)

## Current Branch
- `feat/battleship-special-weapons`, branched off `main` after PR #44
  (the last of the M4a-polish playtest follow-up fixes) merged.

## What's in this task

M4b on top of M4a (`TASK-0031`) + its polish pass (`TASK-0033`) + four
playtest follow-up fixes (PRs #41–#44, documented in `CURRENT_STATE.md`
since they'd never gotten a state-doc update at the time they shipped).

### Design conversation before any code
Per `docs/ROADMAP.md`'s M4b bullet, the shot shapes were already fixed
(double horizontal, double vertical, triple, cross) but the weapon-to-ship
mapping and the charge economy's exact numbers weren't. Rather than
improvise these, they were worked out with the founder in conversation
first — same discipline M4's overall design used. Landed on:
- **Weapon table**: carrier→Cross, battleship→Triple (10×10 only, since
  8×8's fleet has no "battleship" ship type), destroyer→Double Vertical,
  submarine→Double Horizontal, patrol→no weapon.
- **Charges**: +1 automatically at the start of a side's own turn. A plain
  single-cell shot is always free (0 cost) — this was the resolving answer
  to a real structural question raised mid-conversation: if a plain shot
  also cost a charge, income and cost would net to zero every turn, and a
  "pass turn without firing" mechanic would be needed just to ever save up
  for a weapon. Making the plain shot free sidesteps that entirely; no pass
  mechanic exists or is needed.
- **Costs**: Double=2, Triple=3, Cross=4 (founder's own numbers, not the
  scaled proposal offered).
- **Anti-snowball compensation**: +2 charges to whichever side just lost a
  ship (the loser, not the attacker) — this is what makes it "anti-snowball"
  rather than a double reward for the side already ahead.
- All of the above numbers are explicitly playtest-tunable per
  `docs/ROADMAP.md`'s own framing; not treated as sacred.

### `games/battleship/weapons.ts` (new)
Pure functions, mirrors `placement.ts`'s pattern exactly (no reducer/React
involvement, fully unit-testable in isolation):
- `weaponCells(weapon, row, col, orientation, boardSize)` — the cells a
  shape hits, anchored on the tapped cell. `doubleHorizontal`/
  `doubleVertical` are each a *fixed*, non-rotating 2-cell shape (that's why
  they're two separate table entries rather than one "double" with a chosen
  orientation); only `triple` takes an orientation. `cross` is a fixed
  5-cell plus shape. Off-board cells are silently clipped rather than
  rejecting the whole shot — you're bombarding an area, not placing a
  physical object, so firing near an edge just wastes part of the shot.
- `SHIP_WEAPON`/`weaponForShipType` — the ship→weapon table above.
- `WEAPON_COST` — the cost table above.

### `games/battleship/reducer.ts`
- `BattleshipState.charges: Record<Side, number>`, initialized to 0, reset
  to 0 on `PLAY_AGAIN`.
- `pendingShot` changed from `{ shooterSide, cell }` to
  `{ shooterSide, cells: string[] }`. `FIRE` changed from `{ side, cell }`
  to `{ side, cells, weapon: WeaponType | null }` — `cells` is pre-computed
  by the firing device via `weaponCells` (geometry needs no private
  information, so trusting it here is the same trust model ship placement
  already uses for a private fleet's own `cells`). `FIRE` rejects: an
  unaffordable weapon, an empty/entirely-off-board shape, or a shot whose
  every cell is already fired-at (a *partially*-wasted shape is still
  allowed, same "some risk is on you" rule the plain shot already had).
- `RESOLVE_SHOT` changed from a single `cell`/`result`/`sunkShipType`/
  `sunkShipCells` to `results: {cell, result}[]` and
  `sunk: {type, cells}[]` — a multi-cell weapon (especially Cross) can
  complete more than one ship in a single shot, so this is now a list, not
  a nullable singular. Deducts nothing itself (cost is deducted at `FIRE`
  time, committed regardless of the eventual hit/miss outcome); grants the
  defender's turn-start income and any sink compensation in the same
  transition that flips `turn` to them.
- `answerPendingShot` rewritten to loop over `pendingShot.cells`, building
  up the results array and then checking every one of the defender's own
  ships (not already reported sunk in an earlier shot — a guard against
  reporting the same ship sunk twice, since its cells stay "hit" forever
  once fully hit) against the accumulated hit set.

### `games/battleship/views/Player.tsx`
- A weapon selector row during the firing phase (only shown on your own
  turn, no pending shot): "Disparo simple" always available, plus one
  button per weapon whose ship is still afloat on your own side (disabled,
  not hidden, if you can't currently afford it — so you can see what you're
  saving toward).
- Selecting a weapon arms an aim-then-confirm flow: tapping the target
  board sets an aim anchor (doesn't fire yet), a translucent tinted
  reticle (green if the shot is worth taking, red if every cell in it is
  already fired-at) previews the shape — a new `aim` prop on `BoardGrid`,
  deliberately *not* reusing the ship-art `ghost` overlay, since there's no
  ship to show for a bombardment shape. Triple gets an orientation toggle
  identical to placement's. A "¡Disparar!" button then commits it.
- A visible charge counter ("CARGAS: N").

### i18n
New keys under `Battleship.firing`: `chargesLabel`, `plainShotButton`,
`weapon.{doubleHorizontal,doubleVertical,triple,cross}`, `aimHint`,
`confirmShotButton` — `es.json`/`en.json` both updated.

### Tests
8 new/expanded unit tests: `weapons.ts` geometry (fixed vs. rotatable
shapes, edge-clipping, the ship-weapon table, cost table), the charge
economy (FIRE rejecting an unaffordable weapon or an entirely-wasted shot,
turn-start income, sink compensation, a single shot sinking two ships at
once without double-counting compensation). 128 unit tests total.

### Live verification
Two real, separately-connected browser tabs over actual Supabase Realtime
(not single-tab simulation) — the same "clear one tab's `localStorage`
before its first navigation, so it gets a distinct player identity instead
of inheriting the other tab's remembered session" technique used for the
#41–#44 fixes. Confirmed: charges accrue correctly turn over turn; the
weapon selector correctly disables unaffordable weapons and hides a
weapon the instant its own ship sinks (sank a carrier via four ordinary
hits, watched "Cruz" disappear from *that side's own* selector); firing a
Double weapon at a 2-cell ship resolves both cells as hits in one shot,
sinks it, shows the sunk modal with correct phrasing, leaves the sunk-ship
ghost on the target board, and lands compensation charges on the side that
lost the ship, not the one that fired. Zero console/server errors.

## Files Modified / Added
- `games/battleship/weapons.ts` (new)
- `games/battleship/reducer.ts` (charges, multi-cell `pendingShot`/
  `RESOLVE_SHOT`, `answerPendingShot` rewrite)
- `games/battleship/views/Player.tsx` (weapon selector, aim-then-confirm
  flow, charge counter)
- `i18n/es.json`, `i18n/en.json` (weapon/charge labels)
- `tests/unit/battleship-game.test.ts`, `tests/unit/private-state.test.ts`
  (updated for the new action shapes; new geometry/economy tests)
- `docs/09_ai/tasks/TASK-0034-battleship-special-weapons.md` (new)
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, this file (also
  reconciles the doc debt left by PRs #41–#44)

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`, strict
  branch protection, GitHub Actions secrets `NEXT_PUBLIC_SUPABASE_URL`/
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured (added for PR #39's e2e job).

## A testing-methodology note worth remembering
Verifying anything Battleship-specific requires two distinct player
identities, but two tabs of the same browser profile share one
`localStorage` (and therefore one remembered room session). Navigating a
second tab to the app *before* clearing its storage makes it silently
inherit the first tab's session — the fix is: create the tab, navigate it
once, then `localStorage.clear(); location.reload()` in the same script
call *before* interacting with it further, and always re-check the first
tab is still intact afterward. This is a real quirk of same-profile
multi-tab testing, not a product bug — two actual family phones never share
storage, so it can't happen in real play.

## Pending Tasks
- **M4c — Teams.** Two or more players per side sharing a board, via a
  per-side Realtime channel (`ADR-0005` §6 already documents why this is
  meaningfully less airtight than 1 vs 1, and why that's accepted). No task
  spec written yet.
- **Founder playtest of Battleship (M4a + M4b, full weapons and all) on
  real phones**, independent of M4c starting. Verification so far across
  every Battleship task has used two browser contexts on one machine, not
  two real devices over a real network.
- Founder playtest of multi-device Who Am I on real phones (M3's last open
  item, independent of the above).
- M1's dedicated two-real-phones reconnection test (open since M1,
  independent of the above).
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice — the latent leak the ADR documents is real but not urgent.

## Next Suggested Task
- Write the M4c task spec (teams/per-side Realtime channel), then implement
  it on top of M4a + M4b's reducer/view shape. Read `ADR-0005` §6 first —
  it already scopes what team play can and can't guarantee.
