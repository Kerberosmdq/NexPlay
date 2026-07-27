# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0035
- **Title**: Battleship — Teams (M4c)

## Current Branch
- `feat/battleship-teams`, branched off `main` after PR #45 (M4b special
  weapons) merged.

## What's in this task

M4c on top of M4a (`TASK-0031`) + its polish/fixes + M4b (`TASK-0034`).
Fixed 2-vs-2 team play — the biggest architectural addition to Battleship
since `ADR-0005` itself, because it's the first time more than one device
needs to share the same private data.

### Design conversation before any code
`docs/ROADMAP.md`'s M4c bullet only said "two or more players per side" and
pointed at `ADR-0005` §6 for the sharing mechanism — team size, assignment
method, how teammates collaborate on placement, and who fires on a team's
turn were all still open. Confirmed with the founder first:
- **Team size**: fixed 2 vs 2 (4 players total), not configurable.
- **Assignment**: host-assigned, not automatic/self-service.
- **Placement**: one "captain" per side places the fleet; the other
  teammate watches it appear live, read-only — avoids two people fighting
  over the same ship in real time.
- **Firing**: any teammate on the active side can fire, first tap wins, no
  forced rotation — matches the same "family self-regulates verbally"
  philosophy already used elsewhere (Impostor's discussion turns).

### The captain concept and why defense had to diverge from offense
Firing turned out to need **zero reducer changes** — `FIRE`'s existing
guard only ever checked `state.turn === action.side`, never a specific
player id, so "any teammate can fire" was already true by construction.
Defense is different: resolving a shot needs the actual private fleet, and
only one device per side ever really has it. So `sides[side][0]` — the
**captain**, whoever the host assigned to that side first — became the
one and only device `answerPendingShot` trusts; a non-captain teammate's
own `privateState` is never real, only a *mirror* of the captain's (see
below), and `answerPendingShot`'s "am I on the defending side" check
narrowed to "am I that side's captain." For a 1-vs-1 match this is a
no-op: the one player on a side is trivially `sides[side][0]`.

### `games/battleship/reducer.ts`
- New `"teamSetup"` phase, reachable only when `createInitialState`
  receives exactly 4 player ids (2 still goes straight to `"placing"`,
  byte-for-byte unchanged). New `rosterPlayerIds: string[]` field (the full
  roster, needed to know who's still unassigned — a 2-player match never
  reads it).
- New actions: `ASSIGN_SIDE` (removes the player from wherever they
  currently are, then adds them to the target side, capped at 2 — so
  re-assigning/fixing a mistake is just another dispatch, not a separate
  "unassign" step) and `START_TEAMS` (host-triggered once both sides have
  exactly 2, moves to `"placing"`).
- `answerPendingShot`'s defending-side check narrowed to the captain, as
  above.

### `lib/realtime/teamState.ts` (new)
`useTeamFleetChannel` — implements `ADR-0005` §6's already-pre-approved
mitigation for real: a Realtime **broadcast** channel scoped to one side
(`room:{code}:battleship:side:{side}`). The captain's device broadcasts its
own fleet on every change; every other teammate on that side only ever
receives, mirroring the broadcast into local state purely for rendering —
they never send anything back, so there's no risk of two devices
disagreeing about which fleet is authoritative. Deliberately built entirely
inside Battleship's own view code (called directly by `Player.tsx`, not
routed through `MultiDeviceRoom`/`usePrivateState`) so the platform
`GameModule` contract and the generic private-state mechanism stay exactly
as they were — the 1-vs-1 path has zero new code paths to regress.

### `games/battleship/views/Player.tsx`
- A `"teamSetup"` phase screen: shows both sides' current rosters, and
  (host-only) a per-player pair of "Bando A"/"Bando B" buttons — always
  shown for *every* roster player (not just unassigned ones), so the host
  can fix a mis-click any time before "¡Empezar!" (a real gap found and
  fixed during this task's own live verification — see below).
- `isCaptain = mySide ? state.sides[mySide][0] === playerId : false`, and
  `effectiveFleet = isCaptain ? fleet : mirroredFleet` — used everywhere a
  view needs to *display* a side's ships (own board during firing, the
  `REVEAL_FLEET` dispatch); the captain's own `privateState.fleet` is only
  ever used for the actual *editing* operations, which a non-captain's UI
  never exposes (placement renders an early, read-only return for them).

### Tests
6 new unit tests: team-assignment capping/reassignment, `ASSIGN_SIDE`/
`START_TEAMS` phase gating, and — the one that actually matters —
`answerPendingShot` returning `null` for a side's non-captain teammate even
though they're on the defending side, while the captain answers normally.
Every existing M4a/M4b reducer test passed **unmodified** (not just
re-verified — literally zero lines touched), proving the 2-player path
truly wasn't disturbed. 134 unit tests total.

### Live verification
Four real, separately-connected browser tabs over actual Supabase Realtime
(the established "clear a new tab's `localStorage` before its first
navigation" technique, now needing 3 fresh tabs alongside the original
host tab — see the testing-methodology note below, which got a real
workout this time). Confirmed: host assigns all 4 players to sides; the
captain's fleet appears on the teammate's screen the instant it's placed,
read-only, no edit controls; either teammate independently fires on their
side's turn; the shot resolves via the defending side's captain and syncs
correctly to all 4 devices; the opposing side's screens show zero ship
data throughout (same privacy proof standard as every earlier Battleship
task). Zero console/server errors (one batch of console errors turned out
to be stale entries from before an i18n key rename hot-reloaded, confirmed
by checking a tab that never rendered the old code path — see below).

### A real UX gap found and fixed during this task's own verification
The first version of the team-assignment screen only rendered side-picker
buttons for players still in the *unassigned* list — once someone was
placed, there was no control left to move them, so a host mis-click (which
happened during this task's own live testing) had no fix short of
restarting. Reworked to always list every roster player with their current
side highlighted (`active` on whichever button matches), reassignable any
time before "¡Empezar!" — the reducer's `ASSIGN_SIDE` already supported
reassignment correctly; only the UI was missing the affordance.

## Files Modified / Added
- `games/battleship/reducer.ts` (`"teamSetup"` phase, `ASSIGN_SIDE`/
  `START_TEAMS`, `rosterPlayerIds`, captain-only `answerPendingShot`)
- `games/battleship/module.ts` (`meta.maxPlayers` 2 → 4)
- `lib/realtime/teamState.ts` (new)
- `games/battleship/views/Player.tsx` (team-assignment screen, read-only
  teammate placement view, `effectiveFleet`/mirror wiring)
- `i18n/es.json`, `i18n/en.json` (`teamSetup.*`, `placing.watchingCaptainHint`)
- `tests/unit/battleship-game.test.ts` (team-assignment + captain-guard tests)
- `docs/09_ai/tasks/TASK-0035-battleship-teams.md` (new)
- `docs/00_decisions/architecture/ADR-0005-PRIVATE-GAME-STATE.md` (v1.3.0)
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, this file

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`, strict
  branch protection, GitHub Actions secrets `NEXT_PUBLIC_SUPABASE_URL`/
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured (added for PR #39's e2e job).

## A testing-methodology note worth remembering (expanded from M4b)
Same-profile multi-tab testing needs a distinct player identity per tab,
but all tabs share one `localStorage`. The fix, now exercised for 4 tabs
instead of 2: navigate the new tab once, then in the *same* script call,
`localStorage.clear(); location.reload();` before doing anything else with
it — and re-check every *previously* set-up tab is still intact afterward.
Batching multiple `dispatch`-triggering clicks together in one script (no
gap between them) can also produce misleading results — React's state
updates aren't necessarily visible to a synchronous script's very next line
even though they're correctly ordered under the hood; fire one user action,
then re-read the DOM, rather than chaining several `.click()` calls back to
back and trusting the immediate read. Also: a console error that persists
across a `console.clear()` + reload in one tab, but is entirely absent in a
different tab that never hit the same code path, is very likely a stale
buffered log tied to that specific tab's earlier state, not a live bug —
cross-check against a tab that never rendered the old code before treating
it as real.

## Pending Tasks
- **M4d — Tournament.** A bracket of sequential 1-vs-1 matches, built as a
  **platform** capability above `GameModule` (not inside Battleship, since
  it applies to any future two-side game — Connect 4, Ludo, ¿Quién es
  Quién?, all in `BACKLOG.md`). No task spec written yet.
- **Founder playtest of Battleship (M4a through M4c — full weapons and
  2-vs-2 teams) on real phones**, independent of M4d starting. Verification
  so far across every Battleship task has used up to four browser contexts
  on one machine, never real separate devices over a real network.
- Founder playtest of multi-device Who Am I on real phones (M3's last open
  item, independent of the above).
- M1's dedicated two-real-phones reconnection test (open since M1,
  independent of the above).
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice — the latent leak the ADR documents is real but not urgent.

## Next Suggested Task
- Write the M4d task spec (tournament bracket, as a platform capability),
  then implement it. Since it's platform-level rather than Battleship-
  specific, expect it to touch `lib/types/room.ts`/the room lobby rather
  than `games/battleship/` — read `ADR-0002` (the `GameModule` contract)
  first, since a bracket almost certainly needs a way to run several
  matches of the *same* game back to back, which nothing today provides.
