# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0031
- **Title**: Battleship — Core 1 vs 1 & Private State (M4a)

## Current Branch
- `feat/battleship-core-private-state`, branched off `main` after PR #38
  (M3.5 code task 3b) merged.

## What's in this task

M4a — the load-bearing first phase of Battleship. Two platform changes
(`ADR-0005`'s mechanism made real, plus a small platform gap it exposed)
and one new game.

### Platform: `ADR-0005` implemented, not just designed

`lib/types/room.ts` — `GameModule` gained a fourth type parameter
(`TPrivate = never`) and two optional members:
- `setupPrivate?: (playerId, state) => TPrivate` — a device's initial private
  slice. Note: the drafted signature in `ADR-0005` also took `config`; that
  was dropped during implementation because the platform never stores a
  started match's config separately from the `TState` `setup()` produced
  from it — there was nothing to actually pass. Any config-derived value a
  private slice needs (Battleship's board size) is already a field on
  `state`, same as every game already bakes config into `TState`. `ADR-0005`
  itself was updated to match — read the doc, not just this summary.
- `answerPending?: (state, privateState, playerId) => TAction | null` — pure,
  per `ADR-0005` §3's challenge/response flow.

Verified non-breaking: Impostor and Who Am I needed zero changes (`TPrivate`
defaults to `never`, `views.singleDevice` — also made optional here, see
below — stayed present on both).

`lib/realtime/privateState.ts` (new) — the actual mechanism:
- `usePrivateState(roomCode, gameId, playerId, initialize)` — device-local
  React state, mirrored to `localStorage` under
  `nexplay:private:<roomCode>:<gameId>:<playerId>`, restored on mount,
  re-initialized only when that key changes (not on every render — a
  fleet-in-progress must not get wiped by unrelated shared-state churn).
- `useAnswerPending(state, privateState, playerId, answerPending, dispatch)`
  — runs a game's `answerPending` whenever shared state changes, dispatching
  the result at most once per distinct pending request (a `JSON.stringify`
  signature ref, not just relying on natural convergence). **Guards against
  `privateState === undefined`** — see the bug below; this guard is why.

`components/platform/MultiDeviceRoom.tsx` — wires both in. Critical detail:
both hooks are called **unconditionally, before any phase-based early
return** (connectionError/!isConnected/LOBBY/!activeGame all return early
further down) — calling hooks after those would violate the Rules of Hooks.
`activeGame?.id ?? "none"` keys the private slice to "no game yet" while
still in the lobby.

`app/[locale]/page.tsx` — the single-device game picker now filters by
`meta.supportedModes` instead of listing every registered game
unconditionally. This is what makes Battleship's "no single-device support"
design decision (`ROADMAP.md` M4) actually true rather than merely declared;
without it, Battleship would have appeared in a mode it can't run in.
`views.singleDevice` is optional in the `GameModule` contract now, to match.

### The game: `games/battleship/`

- `reducer.ts` — pure. Phases `placing → firing → resolution`. Actions:
  `START_GAME`, `SIDE_READY` (carries **no fleet data** — placement is a
  purely private change, the room only learns a side finished), `FIRE`
  (records a `pendingShot` marker, doesn't resolve it), `RESOLVE_SHOT`
  (applies a hit/miss/sunk result, flips `turn` to the side just fired
  upon — official alternating-turn rule, no "go again on hit"), `REVEAL_FLEET`
  (resolution-only — the losing side's own device reveals its board once
  it's no longer secret), `PLAY_AGAIN`. Also exports `answerPendingShot`
  (the actual `answerPending` implementation: hit/miss/sunk computed from
  the *defending* device's own private fleet, argument-passed, never read
  from shared state) and `createInitialState` (the one place a fresh
  `BattleshipState` is built, shared by `START_GAME` and `GameModule.setup`
  so there's no second copy of the shape to keep in sync).
- `placement.ts` — pure validation (`shipCells` bounds-checks, `canPlaceShip`
  overlap-checks, `isFleetComplete`) plus `randomFleetPlacement` (uses
  `Math.random()`, kept outside the reducer — same rule as
  `games/who-am-i/pickRound.ts`). `FLEET_8`/`FLEET_10` are the two
  host-configurable board sizes' ship specs.
- `module.ts` — `meta.supportedModes: ["multi-device"]` only;
  `minPlayers`/`maxPlayers: 2` (M4c raises this once >1 player per side is
  supported); config schema is just `boardSize: "8" | "10"`.
- `views/Player.tsx` — placement grid (tap-to-place, rotate, random-fill,
  undo, a disabled-until-complete "ready" button), firing phase (two
  grids — opponent's targeting board is clickable when it's your turn and
  no shot is pending, your own board shows received hits/misses plus your
  own ship layout), and — **the `ADR-0005` §5 requirement made real** — an
  explicit "waiting for your opponent" state whenever `pendingShot` is
  yours, never a screen that just stops responding. Resolution reveals the
  loser's fleet once `REVEAL_FLEET` lands.
- Ship names live in `i18n/es.json`/`en.json` under `Battleship.ships.*` —
  deliberately **not** a `LocalizedContentPack` content-pack folder (that
  pattern is for large randomized word banks; five fixed ship names are
  ordinary UI strings).

## Files Modified / Added
- `lib/types/room.ts`, `lib/realtime/privateState.ts` (new)
- `components/platform/MultiDeviceRoom.tsx`, `app/[locale]/page.tsx`
- `lib/realtime/platformReducer.ts` (registry entry)
- `games/battleship/**` (new: `module.ts`, `reducer.ts`, `placement.ts`,
  `views/Player.tsx`)
- `i18n/es.json`, `i18n/en.json`
- `tests/unit/battleship-game.test.ts`, `tests/unit/private-state.test.ts`
  (new), `tests/e2e/battleship-multi-device.spec.ts` (new)
- `docs/00_decisions/architecture/ADR-0005-PRIVATE-GAME-STATE.md`
  (Proposed → Accepted, v1.1.0)
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, this file

## A real bug found by live testing (not by the test suite)

All 117 unit tests and 4 e2e tests passed the whole time this bug was live —
worth internalizing why. Manually running two real browser contexts through
a full match, `useAnswerPending`'s effect fired once against a
**not-yet-initialized** private slice — the exact instant a match starts,
before `usePrivateState`'s own key-change effect had caught up from `"none"`
to the real game id — and crashed calling `.fleet` on `undefined`.

No unit test caught this because `tests/unit/battleship-game.test.ts` tests
`answerPendingShot` (the pure function) directly, always with a well-formed
`BattleshipPrivate`, and `tests/unit/private-state.test.ts` can't exercise
`useAnswerPending` at all (this project has no React-hook testing
environment — no jsdom/`@testing-library/react` dependency; deliberately not
added in this task, see below). The gap was specifically in the *driver's*
handling of the transient undefined window between two hooks — a
timing/wiring bug, not a logic bug in either hook considered alone.

Fixed in `lib/realtime/privateState.ts`'s `useAnswerPending`: skip silently
when `privateState === undefined`, rather than let a game's `answerPending`
dereference it. Documented in `ADR-0005`'s changelog (v1.1.0) so the
reasoning outlives the one-line diff.

**Takeaway for future `GameModule`s using `TPrivate`:** the private slice is
not guaranteed initialized on the very first render(s) after a game starts.
Any code reading it (not just `answerPending`) needs the same guard, or
needs to tolerate `undefined`.

## A deliberate test-infrastructure gap, stated plainly

`usePrivateState`/`useAnswerPending` are verified **live in-browser**, not
via `renderHook` — this repo has no jsdom/`@testing-library/react`
dependency, and adding one was out of `TASK-0031`'s scope (not listed in its
task spec's touchable files). What IS unit-tested is everything
plain-function-testable that the hooks are built from
(`storageKeyFor`/`readStored`) and — the part that actually matters for
`ADR-0005`'s promise — that `battleshipReducer`'s output never contains
ship-position data (`tests/unit/private-state.test.ts`). If a future task
adds real hook-testing infrastructure, revisit whether these two hooks
deserve direct `renderHook` coverage; until then, live verification is the
check, and the bug above is exactly the kind of thing it's for.

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`, strict
  branch protection on `main`. Unchanged.

## Pending Tasks
- **M4b — Special weapons.** Charges, the ship-bound weapon table, the four
  shot shapes (double horizontal, double vertical, triple, cross), and the
  aim → preview → confirm interaction they need. No task spec written yet —
  write one before starting, following `TASK-0031`'s shape.
- **Founder playtest of Battleship M4a on real phones**, independent of M4b
  starting. This task's live verification used two Playwright/browser
  contexts on one machine, not two real devices over a real network — the
  privacy and reconnection claims are architecturally sound and
  browser-verified, but a real two-phone playtest is still the deferred
  M1-style confidence check, same category as the still-open two-real-phones
  reconnection test below.
- Founder playtest of multi-device Who Am I on real phones (M3's last open
  item, independent of the above).
- M1's dedicated two-real-phones reconnection test (open since M1,
  independent of the above).
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice — the latent leak the ADR documents is real but not urgent, and was
  deliberately kept out of `TASK-0031`'s scope to keep that PR reviewable.

## Next Suggested Task
- Write the M4b task spec, then implement it on top of M4a's reducer/state
  shape.
