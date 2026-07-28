# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0036
- **Title**: Platform Tournament Bracket (M4d)

## Current Branch
- `feat/platform-tournament`, branched off `main` after PR #46 (M4c teams)
  merged.

## What's in this task

M4d — the last of Battleship's four phases, and the last item in M4. A
single-elimination bracket of sequential 1-vs-1 matches, deliberately built
as a **platform** capability above `GameModule` rather than inside
`games/battleship/`, since a bracket applies to any two-side game
(Connect 4, Ludo, ¿Quién es Quién? — all in `BACKLOG.md`), not just this one.

### Design conversation before any code
`docs/ROADMAP.md`'s M4d bullet only said "a bracket of sequential 1-vs-1
matches." Confirmed with the founder first:
- **Entrants are individual players only**, not M4c teams — combining team
  play with a bracket is explicitly deferred, not silently folded in.
- **Bracket is random**: the host only confirms the roster and taps "start
  tournament"; matchups shuffle automatically, unlike M4c's host-arranged
  side assignment.
- **Automatic byes** for a non-power-of-2 player count.
- **At least 3 players** to start (2 is just a normal match).

### The one `GameModule` contract addition
The platform needs a generic way to ask an arbitrary game "is this match
over, and who won?" without knowing that game's concrete `TState` shape.
New optional member, same non-breaking pattern as `ADR-0005`'s
`setupPrivate`/`answerPending`:

```ts
getWinner?: (state: TState) => string[] | null;
```

Battleship implements it: `state.phase === "resolution" && state.winner ?
state.sides[state.winner] : null`. Impostor/Who Am I don't — they're group
deduction games, not 1-vs-1 duels, and simply aren't offered a tournament
(`RoomWaitingLobby` only shows "iniciar torneo" for a game whose module
defines `getWinner`).

### `lib/realtime/tournament.ts` (new)
Pure bracket construction, zero React/`GameModule` dependency, deliberately:
`buildFirstRound` (pads to the next power of 2 with byes, pre-resolves each
bye's `winner` immediately), `buildNextRound` (pairs winners, returns `null`
once only the champion's match remains), `nextPlayableMatch`,
`isRoundComplete`, and `advanceTournament` — the actual per-match
advancement bookkeeping. `advanceTournament` was pulled out of
`platformReducer.ts`'s `PLATFORM_ADVANCE_TOURNAMENT` case specifically
because importing `platformReducer.ts` directly in a Vitest test pulls in
the whole game registry (`AVAILABLE_GAMES`) → each game's view components →
`next-intl`/`next/navigation`, which don't resolve in this project's
Node-only Vitest environment (no jsdom, no Next.js runtime — confirmed via
`vitest.config.ts`). A `platform-reducer.test.ts` written against the real
reducer hit this wall, was deleted, and its coverage moved onto
`advanceTournament` directly instead. Any future platform-level testable
logic should follow the same pattern: pure logic in a file with no
game-registry imports.

### `lib/realtime/platformReducer.ts`
- `PlatformStatus` gained `"TOURNAMENT_COMPLETE"`.
- New `TournamentState { gameId, rounds: TournamentMatch[][], champion }`
  and `PlatformState.tournament: TournamentState | null`.
- `PLATFORM_START_TOURNAMENT { gameId, shuffledPlayers }` — shuffling
  happens in the *view* (`MultiDeviceRoom`'s `shuffled()`, Fisher-Yates),
  same "`Math.random()` stays out of the reducer" rule as
  `randomFleetPlacement`; builds round 1, starts the first playable match
  reusing the exact same `activeGameId`/`gameState`/`status: "PLAYING"`
  path a normal match already uses — running one match doesn't change at
  all.
- `PLATFORM_ADVANCE_TOURNAMENT { winnerId, players }` — delegates the
  actual bookkeeping to `advanceTournament`, then either starts the next
  match or, once the bracket has no next match, sets `tournament.champion`
  and flips `status` to `"TOURNAMENT_COMPLETE"` (not back to `"LOBBY"`, so
  the result stays visible until the host explicitly returns).
- `useTournamentAdvance(platformState, players, isHost, dispatch)` — watches
  the active match's `getWinner()` via the active game module, dedupes by
  object-identity ref on `gameState` (same "answer exactly once" shape as
  `useAnswerPending`), and dispatches the advance action.

### The critical bug found during live verification, and its fix
First live 4-tab run (room `GLFS`, players T1–T4): after T4 beat T1 in
round 1's very first real match, the system immediately and incorrectly
declared T4 champion — round 1's *other* match (T3 vs T2) never got played,
and round 2 showed T4 playing against itself, already resolved.

**Root cause**: every connected device runs `platformReducer` against
every broadcast `GAME_ACTION` regardless of what it's currently rendering
— a spectating player's device (showing `TournamentBracket` instead of the
game view) still tracks `gameState.gameState` under the hood. With
`useTournamentAdvance` called unconditionally, all 4 devices independently
noticed `getWinner()` turn non-null at nearly the same moment and all 4
dispatched `PLATFORM_ADVANCE_TOURNAMENT` with the same `winnerId`. The
reducer resolves "whichever match in the current round still has
`winner === null`," without checking that the given `winnerId` actually
belongs to that specific match — so the first (correct) dispatch resolved
match 1 and started match 2; a second, near-simultaneous dispatch from a
different device then resolved match 2 too, using match 1's stale winner,
completing round 1 with an invalid result and cascading straight into
building and resolving round 2.

**Fix**: added an `isHost: boolean` parameter to `useTournamentAdvance`,
gated the whole effect on `if (!isHost) return;` — mirroring how
`PLATFORM_START_GAME`/`PLATFORM_START_TOURNAMENT` are already host-only
dispatches. One authoritative device, not "any device that notices."
Verified by abandoning the corrupted room and restarting fresh (room
`AYNK`): after the first real match, the bracket advanced by exactly one
step, confirmed via a non-winning player's tab showing only that one match
resolved (`"→"`), the other still `"vs"`.

### `components/platform/MultiDeviceRoom.tsx`
- `shuffled<T>()` (Fisher-Yates, local to this file).
- `useTournamentAdvance(gameState, players, isHost, dispatchAction)` wired
  in unconditionally, alongside the existing `usePrivateState`/
  `useAnswerPending` calls, before any phase-based early return (Rules of
  Hooks).
- `onStartTournament` handler dispatching `PLATFORM_START_TOURNAMENT` with
  a freshly shuffled roster.
- `TOURNAMENT_COMPLETE` render branch → `TournamentBracket` with a
  host-only "volver al lobby" action.
- `isMatchParticipant` check: while a tournament is running, a player not
  in the currently-playing match sees `TournamentBracket` instead of a
  frozen/blank game view (`ADR-0005` §5's "absence must be visible"
  spirit, extended to "you're not in this match either").

### `components/platform/TournamentBracket.tsx` (new)
Shown to non-participants during a running tournament, and to everyone
once a champion is decided (doubles as the champion screen). Renders every
round, bold text on winners, "bye"/"vs"/"→" indicators, host-only "volver
al lobby" once `tournament.champion` is set.

### `components/platform/RoomWaitingLobby.tsx`
New `onStartTournament` prop; an additional host-only "iniciar torneo"
button, shown only when `game.getWinner` is defined and
`players.length >= 3`.

### Tests
13 new unit tests in `tests/unit/tournament.test.ts`: `buildFirstRound` for
4/3/5 players (0/1/3 byes), `buildNextRound`, `nextPlayableMatch`/
`isRoundComplete`, a full 5-player simulation round-by-round to a champion,
and `advanceTournament`'s within-round-advance/new-round-build/champion-
crowning/non-mutation behavior. 147 unit tests total, all passing.

### Live verification
Four real, separately-connected browser tabs over actual Supabase
Realtime. Full run: tournament start (host taps "iniciar torneo" with 4
players), round 1 (one bye-free match played through to a winner plus the
cascading-bug fix verified as above), round 2/final (played through to a
winner), champion screen rendered identically and correctly on all four
tabs (`"¡CAMPEÓN!"`, full two-round bracket history, host-only "volver al
lobby"). A non-participant correctly saw `TournamentBracket` instead of a
frozen game view while a match between the other two players was in
progress. Also confirmed, on a clean dev-server restart (no prior
Fast-Refresh history) with a fresh 3-player room: no errors at any stage
— lobby, tournament start, fleet placement dispatch — matching the
already-completed full run's correctness.

### A dev-only console warning investigated and ruled out
The first live run showed a repeating React dev warning ("the final
argument passed to useEffect changed size between renders") after the
match completed. Investigated at length: present on reload in the
long-running dev session (which had accumulated dozens of Fast-Refresh
cycles from this session's many live edits), but completely absent — zero
console errors at any stage of a fresh tournament run — after stopping and
restarting the dev server clean. Concluded this is a Fast-Refresh/HMR
artifact of live-editing a long-running dev server, not a real product
bug. Worth remembering for any future agent who hits a similar dev-only
console warning: before treating it as a real regression, try reproducing
it against a freshly-restarted dev server with no edit history.

## Files Modified / Added
- `lib/types/room.ts` (`getWinner?` addition to `GameModule`)
- `games/battleship/module.ts` (implements `getWinner`)
- `lib/realtime/tournament.ts` (new)
- `lib/realtime/platformReducer.ts` (`TournamentState`, two new actions,
  `"TOURNAMENT_COMPLETE"` status, `useTournamentAdvance`)
- `components/platform/MultiDeviceRoom.tsx` (`shuffled`, tournament wiring,
  `isMatchParticipant`, `TOURNAMENT_COMPLETE` branch)
- `components/platform/TournamentBracket.tsx` (new)
- `components/platform/RoomWaitingLobby.tsx` (`onStartTournament` prop,
  "iniciar torneo" button)
- `i18n/es.json`, `i18n/en.json` (tournament strings under `Lobby`)
- `tests/unit/tournament.test.ts` (new)
- `docs/09_ai/tasks/TASK-0036-platform-tournament.md` (new)
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, this file

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`, strict
  branch protection, GitHub Actions secrets `NEXT_PUBLIC_SUPABASE_URL`/
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured (added for PR #39's e2e job).

## A testing-methodology note worth remembering (carried forward, reused again)
Same-profile multi-tab testing needs a distinct player identity per tab,
but all tabs share one `localStorage`. Navigate the new tab once, then in
the *same* script call, `localStorage.clear(); location.reload();` before
doing anything else with it — and re-check every *previously* set-up tab is
still intact afterward (occasional unexplained flakiness resets a tab's
session; when it happens, abandon that room and start a fresh one rather
than debugging the flakiness itself). New this task: a device's private
fleet cells can be read directly from `localStorage`
(`nexplay:private:{roomCode}:battleship:{playerId}`, shared across
same-profile tabs) to fire precise sinking shots instead of random ones —
much faster than playing a full match out blind. Also new: a dev-only
React console warning that persists across reloads *within* a long-running,
much-edited dev session can still be a false positive — the decisive test
is reproducing (or failing to reproduce) it against a freshly restarted
dev server, not just a page reload.

## Update (2026-07-27/28, after this task merged)
The founder's family played an extended real multi-device session (real
phones, not browser tabs) covering both Who Am I and Battleship, and
reported reconnection held up with no dropped-room incidents and Who Am I's
multi-device path working correctly. This closes two items that had been
open since M1/M3 respectively: **M1's two-real-phones reconnection check**
and **M3's outstanding multi-device Who Am I playtest**. Both are now
marked done in `docs/ROADMAP.md`/`docs/09_ai/CURRENT_STATE.md`. No specific
bugs were reported, so no code changed alongside this update.

## Pending Tasks
- A dedicated founder playtest of Battleship's full feature set specifically
  (M4a–M4d — weapons, 2-vs-2 teams, tournament) is still worth doing —
  the family session above covered Battleship but wasn't a dedicated pass
  through every mechanic, and every Battleship verification in this repo's
  history so far has used up to four browser contexts on one machine, not
  a dedicated real-device pass.
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice — the latent leak the ADR documents is real but not urgent.

## Next Suggested Task
- With M4 fully closed and both outstanding founder-playtest items (M1
  reconnection, M3 Who Am I) now confirmed, the next milestone per
  `docs/ROADMAP.md` is **M5 (presentable)** — landing/marketing surface,
  full ES/EN content coverage, pre-launch privacy/legal review.
