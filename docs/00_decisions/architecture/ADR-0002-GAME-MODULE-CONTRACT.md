---
id: ADR-0002
title: GameModule Contract
status: Accepted
version: 1.0.0
category: Architecture Decision Record

authors:
  - Miguel Giles (Founder & Product Owner)
  - Claude (AI Architect)

created: 2026-07-22
updated: 2026-07-22

language: English

depends_on:
  - ADR-0001

required_by:
  - all future game implementations (Impostor, Who Am I, Battleship, ...)

tags:
  - architecture
  - contract
  - games
---

# ADR-0002 — GameModule Contract

## Status
Accepted.

## Context
NexPlay's core bet is that games are cheap to add because they share one
platform. That only holds if there is one contract every game implements
identically. Without it, each game (and each agent building one) reinvents
room handling, device modes, and screen structure — the exact collision this
ADR exists to prevent. This contract is the seam that lets multiple AI agents
build different games in parallel safely.

## Decision

### 1. Platform vs. game responsibilities
The **platform** (built once, in `NEXPLAY_PLAN.md` §3) owns: room creation and
join-by-code, player roster, device-mode selection, realtime sync transport,
reconnection/host-migration (ADR-0001 §4), and localization plumbing.

A **game** owns only: its rules, its config options, its content, and how its
phases render. A game never talks to Supabase directly and never implements
its own reconnection handling — it consumes the platform's primitives.

### 2. The lifecycle every game inherits
Every game moves through the same phases, driven by the platform:

```
lobby → configure → in-round → interlude → results → (repeat round | end)
```

- **lobby** — players join/ready up.
- **configure** — host sets game-specific options (from the game's ConfigSchema).
- **in-round** — the active play state.
- **interlude** — between-round moments (e.g. reveal-the-impostor, voting
  results) before the next round or final results.
- **results** — end-of-match summary; triggers the durable `game_results` write
  (ADR-0001).

A game cannot invent new top-level phases; it customizes what happens inside
`in-round`/`interlude` via its own state machine.

### 3. The interface

```ts
interface GameModule<TConfig, TState, TAction> {
  id: string;                     // "impostor" | "who-am-i" | "battleship"
  meta: {
    name: string;                 // localization key, not raw text
    minPlayers: number;
    maxPlayers: number;
    supportedModes: Array<"single-device" | "multi-device">;
  };

  configSchema: ConfigSchema<TConfig>;      // host-facing options, typed + validated

  content?: LocalizedContentPack;           // categories/words/images; see ADR-0003

  setup(players: Player[], config: TConfig): TState;

  reducer(state: TState, action: TAction): TState;   // pure, unit-testable, no I/O

  views: {
    host: ComponentType<{ state: TState }>;
    player: ComponentType<{ state: TState; playerId: string }>;
    singleDevice: ComponentType<{ state: TState }>;  // pass-and-play flow
  };
}
```

Rules that make this enforceable, not just aspirational:
- `reducer` must be pure — no network calls, no `Date.now()`, no randomness
  without an injected seed. This is what makes game logic unit-testable in
  isolation and reviewable without spinning up the whole app.
- `views` render from `state` only. A view never reaches into Realtime or
  Supabase directly — the platform feeds it state and forwards its actions.
- Per-player private data (a secret word, a hidden role) lives in `TState`
  but is filtered by the platform before it reaches another player's `views`.
  A game never has to implement its own "don't leak this to other phones"
  logic — the platform does the filtering, once, correctly.

### 4. Device-mode flows are platform behavior, not game behavior
Both device modes are driven by the same `GameModule`, from the same `state`:
- **multi-device:** the platform routes each connected player's filtered state
  to their own `player` view in real time.
- **single-device:** the platform drives the `singleDevice` view through a
  reveal-and-pass loop (show current player's slice → host taps *Next* →
  advance to the next player) using the exact same `state`/`reducer`. A game
  does not write separate logic for single vs. multi-device — only one
  additional render path (`singleDevice`) on top of the same state.

### 5. Content is a first-class citizen, not an afterthought
`content` is a `LocalizedContentPack` (categories, words/prompts, optional
image references, per `locale`). Content ships as versioned files in the repo
(decision detail in ADR-0003), never hardcoded inside a view or reducer. This
is what lets the same `GameModule` support Spanish and English without a code
change, and lets word packs be reviewed via PR without touching game logic.

## Consequences
- **Positive:** adding a game is "implement this interface," which is
  independently assignable to a single agent without it needing to touch the
  platform. Reducers being pure means they are trivially unit-tested and
  reviewed for correctness by another agent without running the app.
- **Positive:** the single/multi-device duality is solved once, centrally,
  instead of once per game — directly serving the "same base for every game"
  requirement.
- **Negative:** any game whose rules genuinely don't fit this lifecycle (none
  identified yet among Impostor / Who Am I / Battleship) would require
  revisiting this ADR before implementation — that is an intentional gate,
  not a gap.

## Alternatives Considered
- **Each game as an independent mini-app with its own room/sync logic:**
  rejected — this is exactly the duplication the shared platform exists to
  avoid, and it is the source of the inter-agent collisions we're designing
  against.
- **A single mega-reducer for all games:** rejected — couples unrelated
  games, makes parallel agent work on different games conflict on one file.
  Per-game reducers behind one interface give isolation without duplication.

## Related Documents
- `docs/NEXPLAY_PLAN.md` §3 (Shared Platform)
- ADR-0001 — Stack and Persistence Boundary
- ADR-0003 — Scalability and Privacy Seams

## Changelog
### Version 1.0.0
- Initial accepted version.
