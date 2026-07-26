# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: M4 design & specification (planning, no product code)
- **Title**: Battleship scope, `ADR-0005` private game state, `TASK-0031`

## Current Branch
- `docs/battleship-m4-plan`, branched off `main` after PR #36 merged.

## What's in this task

Two things, in this order: reconciling the documentation debt from the
previous night's live-bug firefight, and then designing M4 properly.

### Part 1 — the 2026-07-25/26 playtest hotfixes (PRs #33–#36)

Four production bugs, all reported by the founder *during* a real 8-player
family match and fixed while the family waited. They are written up in full
in `CURRENT_STATE.md`; the short version:

| PR | Bug |
|----|-----|
| #33 | Discussion could strand on a blank speaker name with no way forward |
| #34 | Voting could never be closed if one voter never voted |
| #35 | Majority lock never fired when the elimination caught an impostor |
| #36 | Rejoining minted a new identity, orphaning the player from the match |

**Process note, stated plainly rather than buried:** none of these four PRs
updated `CURRENT_STATE.md`/`HANDOFF.md` at merge time, which the DoD requires.
The reason was real (a family was mid-game waiting on each fix) but it is not
a precedent — the debt was repaid here, in the next non-urgent task, and that
is the pattern to follow if it happens again.

Two of these are worth remembering beyond their fix, because they are the same
failure shape:

- **#33, #34 and #35 all presented to players identically** — a screen that
  simply stopped responding, with no explanation and no way forward. Three
  unrelated root causes, one user-visible symptom. That is why `ADR-0005` §5
  makes "absence must be visible, never silent" a hard requirement for the
  pending-resolution states Battleship introduces, rather than leaving it to
  each game's judgement.
- **#35 was invisible to code reading.** The reducer looked correct, and a
  first probe test of the obvious scenario (clean majority vote, 3 players
  down to 2) passed. The bug only appeared when the probe was rewritten to
  reach the same 2-alive state by catching an *impostor* rather than an
  innocent. Lesson: when a founder's live report contradicts a code trace,
  the code trace is the thing to doubt.

### Part 2 — M4 (Battleship) design

Researched the official Hasbro variants before designing anything, because the
founder's request ("disparos de a dos horizontal, otro vertical, otro de a
tres, capaz uno en cruz") turned out to be almost exactly **Battleship:
Advanced Mission**'s real weapon set (Exocet: 5 cells in an X or cross;
Apache: 3 in a row, either orientation), plus the **Salvo** variant's
multi-shot idea.

Both official variants tie firepower to surviving ships, which snowballs — the
player already winning shoots more, the player losing shoots less. With a
7- and a 9-year-old in the family that produces long, hopeless second halves.
Flagged this to the founder rather than implementing it silently.

Four decisions taken with the founder, now recorded in `ROADMAP.md` M4:

1. **Sides, not modes.** Two sides, each with one or more players. "1 vs 1" is
   one player per side — there is no separate teams codepath. This is why
   `TASK-0031` insists on `Record<Side, string[]>` from the start even though
   M4a only ever puts one id in each.
2. **No single-device support.** Confirmed rather than forced (the roadmap had
   left it open): pass-and-play on one phone cannot hide a board between
   turns. Battleship is the first game to not support both modes, which
   exposes a small platform gap — `app/[locale]/page.tsx:209` lists every
   registered game in the single-device picker with no `supportedModes`
   filter.
3. **Weapons: charges + ship-bound**, the founder's explicit combination of
   both official variants. Charges accrue per turn (economy); each weapon
   lives on a ship and dies with it (tension). Sinking a ship grants
   compensation charges — the anti-snowball correction. The numbers are
   playtest-tuned; the intent is not negotiable.
4. **Fix hidden information properly, now.** → `ADR-0005`.

### `ADR-0005` — the important one

`ADR-0002` §3 promises the platform filters per-player private data before it
reaches another player's views. **That filtering was never built.**
`useRoomConnection` broadcasts the full state and `MultiDeviceRoom.tsx` hands
it unfiltered to every view.

Latent for Impostor and Who Am I (secrets sit in every browser's memory but no
view renders them). Fatal for Battleship, where the hidden information *is*
the game — anyone opening devtools would see every ship.

`ADR-0005`'s mechanism: rather than filtering a shared object on the way out
(error-prone, and easy to silently regress — as ADR-0002 §3 itself proves),
the private slice is **never in the broadcast object at all**. It lives in
device-local state, mirrored to `localStorage`. Actions needing another
player's private data resolve in two steps: the shooter records a pending
marker, the target's device answers it via a new pure `answerPending` member.
Only the result travels. This is precisely how the physical board game works —
each player referees their own board.

**Read `ADR-0005` §6 before implementing.** It is honest about what this does
not achieve: it is airtight only when one device owns the slice (true 1 vs 1).
Team play requires the board to reach teammates, mitigated by a per-side
channel — obscurity, not authorization. Making that sound needs a server,
which crosses ADR-0001's persistence boundary and is explicitly out of scope.

## Files Modified / Added
- `docs/00_decisions/architecture/ADR-0005-PRIVATE-GAME-STATE.md` (new)
- `docs/09_ai/tasks/TASK-0031-battleship-core.md` (new)
- `docs/ROADMAP.md` (M4 section rewritten with scope and the four phases)
- `docs/09_ai/CURRENT_STATE.md`, this file

No product code changed in this task.

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`, strict
  branch protection on `main` (enforced for the founder too). Unchanged.

## Pending Tasks
- **`TASK-0031` (M4a)** — Battleship core 1 vs 1 + `ADR-0005` private state.
  Specced and ready. `ADR-0005` moves Proposed → Accepted in that same PR.
- **Ordering question for the founder:** `ROADMAP.md`'s rule is that
  milestones ship in order, and M3.5's code task 3b (language switcher,
  room-code copy/share, accessibility pass) is still open. Starting M4a ahead
  of it is a deliberate reordering — it was raised, not assumed.
- Founder playtest of multi-device Who Am I on real phones (M3's last open
  item).
- M1's dedicated two-real-phones reconnection test (open since M1).
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private slice.
  Not urgent (the leak is latent), deliberately excluded from `TASK-0031` to
  keep that PR reviewable, but it is the change that makes ADR-0002 §3 true
  everywhere rather than just in Battleship.

## Next Suggested Task
- `TASK-0031`, once the founder confirms the M3.5-vs-M4 ordering above.
