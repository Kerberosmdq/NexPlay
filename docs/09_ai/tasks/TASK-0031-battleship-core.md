# TASK-0031: Battleship — Core 1 vs 1 & Private State

### Goal
Ship M4a from `docs/ROADMAP.md`: a fully playable 1-vs-1 Battleship on two
phones, and — because the game is impossible to build honestly without it —
the private-per-player-state mechanism specified in `ADR-0005`. This is the
milestone's load-bearing phase: special weapons (M4b), teams (M4c) and the
tournament bracket (M4d) all build on what lands here.

### Scope — in

**Platform (ADR-0005):**
- Add a fourth type parameter `TPrivate = never` to `GameModule`, with
  optional `setupPrivate` and `answerPending` members exactly as specified in
  `ADR-0005` §2. `AnyGameModule` and the two existing games must be
  unaffected (the default makes this a non-breaking change — verify, don't
  assume).
- A private-state module (`lib/realtime/privateState.ts`) owning the slice:
  local React state, mirrored to `localStorage` under
  `nexplay:private:<roomCode>:<gameId>:<playerId>`, restored on mount. It is
  never placed in `PlatformState` and therefore never broadcast — assert this
  with a test, not just a comment.
- Wire `privateState` and `setPrivateState` through `MultiDeviceRoom` into the
  `player`/`host` views.
- The `answerPending` driver: when shared state changes, run the active
  game's `answerPending` against this device's private slice and dispatch the
  result if it is non-null. Must be idempotent — the same pending marker must
  not produce two dispatches (broadcast echo and re-render both re-run it).
- Filter the single-device game picker by `meta.supportedModes`
  (`app/[locale]/page.tsx:209` currently lists every registered game
  unconditionally, which would surface Battleship in a mode it does not
  support). Make `views.singleDevice` optional in the contract accordingly.
- A visible waiting state whenever a pending resolution is outstanding
  (`ADR-0005` §5) — never a screen that just stops responding.

**Game (`games/battleship/`):**
- `module.ts`, pure `reducer.ts`, `views/Player.tsx`, ES/EN content for ship
  names.
- Config (host-facing, per the founder's "que lo elija el anfitrión"):
  board size `8` ("rápido": Portaaviones 4, Destructor 3, Submarino 3, Lancha
  2) or `10` ("clásico": Portaaviones 5, Acorazado 4, Destructor 3, Submarino
  3, Lancha 2).
- Two sides, one player each. Model sides as `Record<Side, string[]>` from the
  start — M4c adds players to a side, it must not have to reshape state.
- Phases: `placing` → `firing` → `resolution`.
- Placement: tap-to-place with rotate, a "colocar al azar" helper (outside the
  reducer — `Math.random()` stays out of pure code, same rule as
  `games/who-am-i/pickRound.ts`), overlap/bounds validation, then ready-up.
  The fleet layout itself is a purely private change; only `SIDE_READY`
  is broadcast.
- Firing: tap a cell on the opponent's grid → confirm → `FIRE` records a
  pending shot → the target's device answers via `answerPending` with
  `RESOLVE_SHOT` (per-cell hit/miss, plus which ship sank, if any) → turn
  passes.
- Win detection when every ship on a side is sunk; resolution screen reveals
  the loser's board (the losing device broadcasts it at that point — it is no
  longer secret).
- Scoring via the existing points helpers, and `PLAY_AGAIN`.

### Scope — out (non-goals for this task)
- **Special weapons of any kind** — charges, ship-bound weapons, the four shot
  shapes, aim-preview. Single-cell shots only. That is M4b, and it is the next
  task, not an opportunistic addition to this one.
- **Teams** (more than one player per side) and the per-side channel — M4c.
- **Tournament brackets** — M4d, and a platform concern, not a game one.
- **A `singleDevice` view for Battleship.** Deliberately unsupported.
- **Migrating Impostor's and Who Am I's secrets onto the private slice.** The
  latent leak documented in `ADR-0005` is real but harmless today; converting
  them is a separate, independently-reviewable task.
- **Any server-side authority.** Explicitly rejected in `ADR-0005` §6.
- Recovering a player's board on a genuinely new device (documented
  limitation, not a bug to fix here).

### Files this task may touch
- `lib/types/room.ts`
- `lib/realtime/privateState.ts` (new)
- `lib/realtime/hooks/useRoomConnection.ts`
- `components/platform/MultiDeviceRoom.tsx`
- `app/[locale]/page.tsx`
- `games/battleship/**` (new)
- `i18n/es.json`, `i18n/en.json`
- `tests/unit/battleship-game.test.ts` (new),
  `tests/unit/private-state.test.ts` (new)
- `tests/e2e/**`
- `docs/00_decisions/architecture/ADR-0005-PRIVATE-GAME-STATE.md`
  (Proposed → Accepted on merge)
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md`

Touching another game's folder means the contract change was designed wrong —
stop and revisit `ADR-0005` rather than editing Impostor or Who Am I to
compensate (`CONVENTIONS.md` §Folder structure).

### Relevant context
- `ADR-0005` — the whole mechanism, including its §6 honest limits. Read it
  before writing any of the platform half.
- `ADR-0002` §3 — the contract being extended, and the third bullet this
  supersedes.
- `ADR-0001` §4 — reconnection; private state must survive the same
  drop-and-rejoin path, now covered by the identity fix in PR #36.
- `docs/ROADMAP.md` M4 — the four-phase split and the design decisions taken
  with the founder on 2026-07-26.
- The 2026-07-25 playtest bug cluster (see `HANDOFF.md`): three separate
  "the screen just stopped" failures. `ADR-0005` §5 exists because of them.

### Definition of Done
All seven items in `CONVENTIONS.md` §Definition of Done, plus:
- Unit tests cover: placement validation (overlap, out of bounds), the full
  fire → resolve → turn-flip cycle, sinking the last ship ends the match,
  `answerPending` returns `null` on the non-owning device, and at least one
  invalid action per `CONVENTIONS.md` §Testing expectations.
- A test asserts the private slice never appears in any broadcast payload.
- An e2e test covers two players joining, placing, and firing at least one
  shot each.
- Zero hardcoded user-facing strings; ship names come from the content pack.
- `ADR-0005` moved to Accepted in the same PR that implements it.

### How to verify
```bash
pnpm lint && pnpm typecheck && pnpm vitest run && pnpm test:e2e
```
Then manually, in two separate browser profiles against one room:
1. Both players place a fleet; confirm neither sees the other's ships in the
   UI **or** in the Realtime payloads (`read_network_requests`) — the second
   check is the one that actually matters.
2. Fire a shot; confirm hit/miss resolves on both devices and the turn passes.
3. Close the target's tab mid-shot; confirm the shooter sees an explicit
   "waiting for your opponent" state rather than a frozen screen, and that
   reopening resolves it.
4. Sink a full fleet; confirm the match ends and the loser's board is
   revealed.
