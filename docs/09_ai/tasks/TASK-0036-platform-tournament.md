# TASK-0036: Platform Tournament Bracket (M4d)

### Goal
Ship `docs/ROADMAP.md`'s M4d: a bracket of sequential 1-vs-1 matches, built
as a **platform** capability above `GameModule` (not inside Battleship),
since it applies to any current or future two-side game. Battleship is the
only game that plugs into it today.

### Design decisions (confirmed with the founder before implementation)
- **Entrants are individual players only**, not M4c teams — a tournament
  slot is always exactly one player. Combining team play with a bracket is
  explicitly deferred, not silently folded in.
- **Bracket is random**: the host only confirms the roster and taps "start
  tournament"; the matchups are shuffled automatically, not host-arranged
  (unlike M4c's host-assigned sides).
- **Automatic byes** for a non-power-of-2 player count — standard
  single-elimination behavior: a leftover player in a round advances
  without playing that round.
- **At least 3 players** to start a tournament (2 is just a normal match;
  a 1-match "tournament" is degenerate and not offered).
- Only offered for a game that declares it supports this (see below) —
  Impostor/Who Am I are group deduction games, not 1-vs-1 duels, and don't
  plug into a bracket.

### The one GameModule contract addition this requires
The platform needs a generic way to ask an arbitrary game "is this match
over, and who won?" without knowing that game's concrete `TState` shape.
New **optional** member on `GameModule` (defaults to `undefined`, so every
existing game is unaffected — same non-breaking pattern `setupPrivate`/
`answerPending` used for `ADR-0005`):

```ts
/** Returns the player ids of the winning side once this match has a
 * decided winner, or null if it's still undecided. Used by the platform's
 * tournament orchestration (M4d) to know when to advance the bracket —
 * a game that never implements this simply can't be offered as a
 * tournament game. */
getWinner?: (state: TState) => string[] | null;
```

Battleship implements it: `state.phase === "resolution" && state.winner
? state.sides[state.winner] : null`.

### Bracket construction (pure, unit-testable, no I/O)
New `lib/realtime/tournament.ts`:
- `buildFirstRound(shuffledPlayerIds: string[]): TournamentMatch[]` — pads
  to the next power of 2 with byes (given to the first N entrants of the
  already-shuffled list — fine, since the list is random, there's no seed
  to protect), each bye match's `winner` is pre-filled immediately (no game
  is ever played for it).
- `buildNextRound(previousRound: TournamentMatch[]): TournamentMatch[] |
  null` — pairs up the previous round's winners; returns `null` when the
  previous round had exactly one match (that match's winner is the
  tournament champion, not a new round).
- Shuffling itself (`Math.random()`) happens in the *view*, same rule as
  `randomFleetPlacement`/`pickRound.ts` — the result is passed into the
  `PLATFORM_START_TOURNAMENT` action, never generated inside a reducer.

### Orchestration (`lib/realtime/platformReducer.ts`)
- `PlatformState` gains `tournament: TournamentState | null`.
- `PLATFORM_START_TOURNAMENT { gameId, shuffledPlayerIds }`: builds round 1,
  and starts the first *playable* match (skipping any pre-resolved byes) by
  calling that `gameId`'s own `setup()` with just those 2 players — reusing
  `activeGameId`/`gameState`/`status: "PLAYING"` exactly as a normal match
  already does; nothing about running one match changes.
- `PLATFORM_ADVANCE_TOURNAMENT { winnerId }`: records the winner into the
  current match, then either starts the next playable match in the same
  round, builds and starts the next round, or — if `buildNextRound`
  returned `null` — sets `tournament.champion` and moves `status` to a new
  `"TOURNAMENT_COMPLETE"` value (not back to `"LOBBY"`, so the bracket
  result stays visible until the host explicitly returns to the lobby).
- A new hook (`useTournamentAdvance`, alongside the existing
  `usePrivateState`/`useAnswerPending` calls in `MultiDeviceRoom.tsx`)
  watches `gameState.gameState` via the active game's `getWinner`, and
  dispatches `PLATFORM_ADVANCE_TOURNAMENT` exactly once per match (same
  "answer exactly once, tolerate re-renders" shape as `useAnswerPending`).

### UI
- `RoomWaitingLobby`: for a game whose module defines `getWinner`, and with
  ≥3 players present, an additional "iniciar torneo" action alongside the
  existing "jugar este" (which still starts a normal, non-bracket match).
- A new `TournamentBracket` platform component (not inside any game's
  folder): shown to every player *not* part of the currently-playing match
  — the two active participants see the normal game view exactly as
  before; everyone else sees the bracket (rounds, matchups, who's playing
  right now, byes marked as such) instead of a blank/frozen screen (same
  `ADR-0005` §5 "absence must be visible" spirit, now applied to "you're
  not in this match either, but here's what's happening").
- A tournament-complete screen once `status === "TOURNAMENT_COMPLETE"`,
  naming the champion, with a host-only "volver al lobby" action.

### Scope — in
- `lib/types/room.ts`: `getWinner?` addition to `GameModule`.
- `games/battleship/module.ts`: implements `getWinner`.
- `lib/realtime/tournament.ts` (new): bracket construction, pure.
- `lib/realtime/platformReducer.ts`: `TournamentState`, the two new
  actions, orchestration logic.
- `components/platform/`: the tournament-start control in
  `RoomWaitingLobby`, the new `TournamentBracket` component, the
  tournament-complete screen, wiring `useTournamentAdvance` into
  `MultiDeviceRoom.tsx`.
- `i18n/es.json`, `i18n/en.json`: tournament-related strings under `Lobby`
  (platform-level, not under `Battleship`, since this is generic).
- Unit tests: bracket construction (byes, odd/even counts, multi-round
  advancement to a champion), the two new reducer actions.

### Scope — out (non-goals for this task)
- Team entrants in a bracket (M4c teams stay a separate, un-combined mode).
- Host-arranged (non-random) bracket seeding.
- Double-elimination, round-robin, or any format besides single-elimination.
- A config-selection UI for the per-match game config (`buildDefaultConfig`
  is still used, same as every existing match today — this task does not
  add the missing config-picker UI; that's a pre-existing gap, flagged
  separately, not part of M4d).
- Persisting tournament results to Supabase (`game_results`) beyond what
  each individual match already records — a tournament-level summary row
  is a possible follow-up, not required here.

### Files this task may touch
- `lib/types/room.ts`
- `games/battleship/module.ts`
- `lib/realtime/tournament.ts` (new)
- `lib/realtime/platformReducer.ts`
- `components/platform/RoomWaitingLobby.tsx`
- `components/platform/MultiDeviceRoom.tsx`
- `components/platform/TournamentBracket.tsx` (new)
- `i18n/es.json`, `i18n/en.json`
- `tests/unit/tournament.test.ts` (new), `tests/unit/platform-reducer.test.ts`
  (new, if one doesn't already exist for `platformReducer`)
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md`

### Relevant context
- `docs/ROADMAP.md` — M4 section, M4d bullet.
- `docs/00_decisions/architecture/ADR-0002-GAME-MODULE-CONTRACT.md` — the
  contract this task adds one optional member to.
- `lib/realtime/platformReducer.ts`, `components/platform/MultiDeviceRoom.tsx`
  — read fully before changing; this task's orchestration sits directly on
  top of the existing single-match flow, which must keep working unchanged
  when no tournament is active.
- `games/battleship/reducer.ts` — `state.phase`/`state.winner`/`state.sides`,
  which `getWinner`'s implementation reads.

### Definition of Done
- Everything in `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.
- A normal (non-tournament) match — any existing game — is provably
  unaffected: existing tests for `platformReducer`-adjacent behavior (if
  any) and every game's own reducer tests pass unmodified.
- New unit tests cover bracket construction for at least: 4 players (no
  byes), 3 players (one bye), 5 players (three byes), and a full run from
  first round to champion.
- Live verification with several real, separately-connected browser tabs
  (at least 4 players, to force at least one bye and two rounds): starting
  a tournament, playing through a bye-having round and a full round,
  reaching a champion screen, confirming a non-participating player sees
  the bracket status (not a frozen/blank screen) while a match between two
  others is in progress.
- `docs/ROADMAP.md`'s M4d bullet marked done; `CURRENT_STATE.md`/
  `HANDOFF.md` updated.

### How to verify
- `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm test:e2e`.
- Multi-tab live browser check per the Definition of Done above.
