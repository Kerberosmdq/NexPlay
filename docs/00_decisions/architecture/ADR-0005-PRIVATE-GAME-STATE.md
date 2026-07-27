---
id: ADR-0005
title: Private Per-Player Game State
status: Accepted
version: 1.1.0
category: Architecture Decision Record

authors:
  - Miguel Giles (Founder & Product Owner)
  - Claude (AI Architect)

created: 2026-07-26
updated: 2026-07-26

language: English

depends_on:
  - ADR-0001
  - ADR-0002

required_by:
  - M4 (Battleship)
  - any future game whose hidden information is the game itself

tags:
  - architecture
  - contract
  - games
  - privacy
---

# ADR-0005 — Private Per-Player Game State

## Status
Accepted. Implemented in `TASK-0031` (M4a — Battleship core 1 vs 1): the
contract additions in §2, the challenge/response driver in §3, and the
visible-waiting-state requirement in §5 all ship there, exercised for real by
Battleship's fleet placement and firing.

Supersedes the third bullet of ADR-0002 §3 ("Per-player private data lives in
`TState` but is filtered by the platform before it reaches another player's
`views`"). That sentence describes a capability that was never built. This ADR
replaces the aspiration with a mechanism.

## Context

ADR-0002 §3 promises the platform filters per-player private data before it
reaches another player's views, so "a game never has to implement its own
'don't leak this to other phones' logic."

**That filtering does not exist.** As shipped through M3:

- `useRoomConnection` broadcasts every `game_action` to the whole room channel,
  and the elected host broadcasts `full_state_sync` containing the entire
  game state.
- `MultiDeviceRoom.tsx` passes `gameState.gameState` — the complete, unfiltered
  state — straight into every connected player's view.

For Impostor and Who Am I this is **latent**: the secret word and the impostor
ids really are sitting in every player's browser memory, but no view renders
them, so ordinary play is unaffected. It has never caused a visible problem.

For Battleship it is **fatal**. The hidden information is not a decoration on
the game — it *is* the game. Broadcasting each player's ship layout to their
opponent's device means anyone willing to open browser devtools wins every
match, permanently. There is no view-level workaround, because the leak is in
the transport, not the rendering.

ADR-0002's own Consequences section anticipated exactly this: a game that
doesn't fit the contract "would require revisiting this ADR before
implementation — that is an intentional gate, not a gap." This ADR is that
gate being used as designed.

A second forcing factor is product-level. The founder's stated goal for the
backlog games is that children play with friends **in other houses**
(`docs/BACKLOG.md`). Once players are outside one living room, "nobody in this
family would cheat" stops being a safe assumption.

## Decision

### 1. Private state lives outside the broadcast state object

A game may declare a **private slice** that is never placed in `PlatformState`
and therefore never crosses the network. This is the core of the design: the
platform does not "filter" a shared object on the way out (which is
error-prone and easy to regress). The private data is simply never in the
object that gets broadcast.

Private state lives in React state on the owning device, mirrored to
`localStorage` under `nexplay:private:<roomCode>:<gameId>:<playerId>` so a
reload or reconnection does not destroy it.

### 2. Contract additions

```ts
interface GameModule<TConfig, TState, TAction, TPrivate = never> {
  // ...existing members unchanged...

  /** Produces this device's private slice at game start. Runs locally on
   * each device, for its own player only. Never broadcast. Takes `state`,
   * not `config` — the platform never stores a started match's config
   * separately from the `TState` it produced, so any config-derived value
   * (e.g. board size) must already be a field on `state`, same as every
   * existing game already does via `setup(players, config): TState`. */
  setupPrivate?: (playerId: string, state: TState) => TPrivate;

  /** When the shared state is waiting on information only this device holds,
   * returns the action that answers it — or null if this device is not the
   * one being asked. Pure: the private data arrives as an argument. */
  answerPending?: (
    state: TState,
    privateState: TPrivate,
    playerId: string
  ) => TAction | null;
}
```

`views` additionally receive `privateState` alongside `state`, plus a
`setPrivateState` updater. The updater matters because some moves are
*purely* private and produce no shared action at all — placing your fleet
changes only your own device's slice; all the room ever learns is that your
side is ready.

### 3. The challenge/response flow

Actions that depend on another player's private data resolve in two steps
instead of one:

1. The acting player dispatches a normal action (e.g. `FIRE`). The shared
   state records a **pending** marker describing what is being asked.
2. Every device runs `answerPending` against the new shared state. On the
   device that owns the relevant private slice it returns an action
   (e.g. `RESOLVE_SHOT`); everywhere else it returns `null`. That action is
   dispatched and broadcast like any other, and the pending marker clears.

Only the *result* ("hit, and that sank the destroyer") travels. The layout
that produced it never does.

This is exactly how the physical board game works: each player is the referee
of their own board and answers out loud.

### 4. Purity is preserved

`answerPending` is pure — the private state is an explicit argument, not
ambient. This is the same pattern the codebase already uses to keep
`Math.random()` out of reducers (`games/who-am-i/pickRound.ts` picks outside
the reducer and passes the result in as part of the action). Reducers remain
unit-testable with no I/O and no mocking, per ADR-0002 §3.

### 5. Absence must be visible, never silent

A pending resolution depends on the answering device being reachable. The
platform must surface this state in the UI ("waiting for your opponent")
rather than appearing frozen.

This is a direct, non-negotiable lesson from the 2026-07-25 family playtest,
where three separate bugs (a blank speaker name, a vote that could never be
revealed, a match that could never resolve) all presented identically to the
players: a screen that simply stopped responding with no explanation and no
way forward. Every pending state introduced by this ADR ships with both a
visible explanation and a host-level escape hatch.

### 6. Honest limits

This mechanism is genuinely airtight **only when one device owns the private
slice**. In 1-vs-1 Battleship, ship positions never leave the owner's phone,
full stop.

For team play, teammates must see their shared board, so it necessarily
travels to their devices. The practical mitigation is a **separate Realtime
channel per side**, which the opposing side is not subscribed to. That is
obscurity, not authorization: it defeats casual cheating, not a determined
attacker who guesses the channel name.

Making team play cryptographically sound requires a server-side authority to
hold boards and adjudicate shots. That crosses ADR-0001's persistence boundary
(ephemeral state stays in Realtime; there is no game server) and is
**explicitly out of scope**. If it ever becomes necessary, it is a new ADR,
not a quiet extension of this one.

This limit is documented rather than hidden: team mode is for people in the
same room or the same family, which is what it is for.

## Consequences

- **Positive:** ADR-0002 §3's promise becomes true instead of aspirational,
  and it becomes true structurally — a future game cannot accidentally leak a
  secret by forgetting to filter, because the secret is never in the shared
  object to begin with.
- **Positive:** Impostor and Who Am I can migrate their secrets to the private
  slice later, closing the latent leak, with no change to their rules.
- **Positive:** Any future hidden-information game (¿Quién es Quién? in the
  backlog is one) inherits this rather than reinventing it.
- **Negative:** a shot cannot resolve while the opponent's device is
  unreachable. In 1-vs-1 this is acceptable — if the opponent is gone there is
  no game to play — but it must be *shown*, per §5.
- **Negative:** private state is device-local. A player who joins a match in
  progress from a genuinely new device cannot recover their board. Persisting
  to `localStorage` covers reload and reconnection on the same device, which
  is the realistic case; the rest is a documented limitation.
- **Negative:** `TPrivate` adds a fourth type parameter to `GameModule`. It
  defaults to `never` so the two existing games and the type-erased
  `AnyGameModule` registry are unaffected.

## Alternatives Considered

- **Filter the shared state on the way out.** Rejected: the host would have to
  produce a per-recipient view of state, but Realtime broadcast is one message
  to all subscribers — the data would still be on the wire. It also makes
  correctness depend on remembering to filter every new field, which is the
  kind of promise that silently rots (as ADR-0002 §3 itself demonstrates).
- **Commitment/hash scheme** (publish a hash of your board, reveal at the
  end). Rejected: it prevents a player from *changing* their board mid-match,
  which is not the threat here. It does nothing to stop an opponent reading a
  board that was broadcast.
- **Server-authoritative game state.** Rejected for now: it solves the problem
  completely, including for teams, but crosses ADR-0001's persistence boundary
  and introduces a backend to operate and pay for, for a family game. Revisit
  only if NexPlay goes genuinely public and competitive.

## Related Documents
- ADR-0001 — Stack and Persistence Boundary (§3 persistence, §4 reconnection)
- ADR-0002 — GameModule Contract (§3, third bullet — superseded here)
- `docs/ROADMAP.md` — M4 (Battleship)
- `docs/09_ai/tasks/TASK-0031-battleship-core.md`

## Changelog
### Version 1.1.0
- Accepted — implemented in `TASK-0031`. `setupPrivate`'s signature dropped
  the `config` parameter drafted in the proposal: the platform never stores
  a started match's config separately from the `TState` it produced, so it
  wasn't actually available to pass; any config-derived value a private
  slice needs is a field on `state` instead, matching how every game's own
  `setup(players, config)` already bakes config into `TState`.
- A real bug surfaced during live two-device verification, worth recording:
  the answerPending driver could run once with this device's private slice
  still uninitialized (the instant a match starts, before `usePrivateState`'s
  own effect catches up to a new game id), calling a game's `answerPending`
  with `undefined` and crashing. Fixed by having the driver skip silently
  until the slice exists, rather than by changing the mechanism itself.

### Version 1.0.0
- Initial proposed version.
