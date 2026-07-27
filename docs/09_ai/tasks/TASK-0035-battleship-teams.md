# TASK-0035: Battleship — Teams (M4c)

### Goal
Ship `docs/ROADMAP.md`'s M4c: two or more players per side sharing one
board, on top of M4a (`TASK-0031`) + its polish/fixes + M4b (`TASK-0034`).
`ADR-0005` §6 already anticipates and pre-approves the core mechanism (a
separate Realtime channel per side); this task is the implementation of
that mitigation, not a fresh architecture decision.

### Design decisions (confirmed with the founder before implementation,
not to be re-litigated mid-task)
- **Team size: fixed 2 vs 2** (4 players total). Not configurable in this
  task — if that's wanted later, it's a follow-up, not scope creep here.
- **Room size determines the mode, not a config toggle**: exactly 2 players
  in the room → today's 1 vs 1, completely unchanged (existing `sides`
  auto-assignment, no new phase, all M4a/M4b behavior untouched). Exactly 4
  players → teams. Any other count (0/1/3/5+) is out of scope for
  Battleship starting at all — `meta.minPlayers`/`maxPlayers` become 2/4,
  and a room with exactly 3 sees a friendly "need 2 or 4 players" message
  rather than a broken team-assignment screen (there's no `GameModule`
  hook to reject starting outright without a platform contract change,
  which is explicitly out of scope here — see Non-goals).
- **Team assignment: host-assigned**, via a new Battleship-only pre-game
  phase (`"teamSetup"`), not a platform `configSchema` change (the platform's
  `ConfigFieldSchema` only supports `number`/`select` — a "bucket players
  into two groups" field type would be a shared-contract change affecting
  every game, which is out of scope; keeping this entirely inside
  Battleship's own reducer/view avoids it). `teamSetup` is skipped
  entirely — state starts straight at `"placing"` — when there are exactly
  2 players, so 1 vs 1 has zero new code paths to regress.
- **Fleet placement: one "captain" per side places, the other teammate
  watches live, read-only.** The captain is simply `sides[side][0]` — the
  first player assigned to that side during `teamSetup` (no separate field
  needed; for the 2-player/1-vs-1 case this is just that one player,
  unchanged). Avoids two people dragging the same ship at once.
- **Firing: any teammate on the active side can fire — first tap wins, no
  forced rotation.** This already works with **zero reducer changes**: the
  existing `FIRE` guard only checks `state.turn === action.side`, never a
  specific player id, and a view's `mySide` computation already tests
  `state.sides[mySide].includes(playerId)`, which is already array-based
  and already correct for more than one id per side.
- **Defending/answering shots: only the captain's device answers.** This
  is the one place offense/defense diverge: unlike firing, resolving a shot
  needs the actual private fleet, which only the captain's device holds as
  source of truth (the other teammate only ever has a *received mirror* of
  it — see below). `answerPendingShot`'s existing "am I on the defending
  side" check must narrow from "any teammate" to "am I that side's
  captain."

### The new plumbing this requires
`ADR-0005`'s existing `usePrivateState`/`useAnswerPending`
(`lib/realtime/privateState.ts`) assume exactly one device owns a side's
whole private slice, persisted only to that device's own `localStorage`.
Teams need a second device to *see* that slice without owning it:
- New `lib/realtime/teamState.ts` (or an addition to `privateState.ts` —
  decide while implementing, whichever keeps the single-device path
  untouched): a per-side Realtime **broadcast** channel
  (`room:{code}:battleship:side:{side}`), subscribed to only by that side's
  players — the opposing side never subscribes (`ADR-0005` §6: "obscurity,
  not authorization," an accepted, documented limit, not a gap).
  - The captain's device: behaves exactly like today's `usePrivateState`
    (owns it, persists to its own `localStorage`) **plus** broadcasts every
    change to the side channel.
  - The non-captain teammate's device: never calls `setPrivateState`
    itself (the placement UI renders read-only for them); instead mirrors
    whatever the captain broadcasts into its own local `privateState` purely
    for *rendering* — it does not persist to `localStorage` and is never
    the input to `answerPendingShot` (only the captain's device runs that).
- This is a genuine, load-bearing extension of `ADR-0005`'s mechanism —
  record it as a changelog entry (next minor version) once built, same
  discipline as the v1.2.0 sunk-ship-cells exception.

### Scope — in
- `games/battleship/reducer.ts`: a new `"teamSetup"` phase (only reachable
  when `setup()` receives 4 player ids), `ASSIGN_SIDE`/`UNASSIGN` (or
  reassign-in-place) actions capped at 2 per side, a `START_TEAMS`-style
  transition to `"placing"` once both sides have exactly 2. `sides` stays
  `Record<Side, string[]>` (unchanged shape, already supports this).
- `games/battleship/module.ts`: `meta.minPlayers`/`maxPlayers` → 2/4.
- `lib/realtime/teamState.ts` (new) or an addition to `privateState.ts`:
  the side-scoped broadcast channel and the captain/mirror hook(s).
- `games/battleship/views/`: a team-assignment screen (host-only controls,
  teammates see a waiting state) for the `"teamSetup"` phase; the placement
  view gated read-only for a non-captain teammate; the firing view already
  mostly works as-is (any teammate can tap to fire) — audit for anything
  that implicitly assumed exactly one player per side (e.g. `players.find
  ((p) => p.id === rawPlayerId)`-style lookups that only make sense
  single-player).
- `answerPendingShot`: narrow the defending-side check to the captain only.
- Unit tests: team assignment (capped at 2/side, transition gating),
  `answerPendingShot` correctly returns `null` for a non-captain teammate
  even though they're on the defending side, the 2-player path is
  byte-for-byte unchanged (every existing M4a/M4b reducer test must still
  pass with zero modification — this is the regression bar).
- A `docs/00_decisions/architecture/ADR-0005-PRIVATE-GAME-STATE.md`
  changelog entry documenting the side-channel mechanism once built.

### Scope — out (non-goals for this task)
- Any team size other than fixed 2v2.
- A platform `ConfigSchema` change to support player-bucketing generically
  — team assignment stays entirely inside Battleship's own phase/actions.
- Handling exactly 3 (or 5+) players gracefully beyond a friendly message —
  no partial-team or spectator mode.
- Making team play cryptographically sound against a determined attacker —
  `ADR-0005` §6 already scopes this out explicitly; the side channel is
  obscurity, not authorization, same as documented.
- M4d (tournament) — untouched.
- Migrating Impostor's/Who Am I's secrets onto `ADR-0005` — unrelated,
  already a separately tracked pending item.

### Files this task may touch
- `games/battleship/reducer.ts`
- `games/battleship/module.ts`
- `games/battleship/views/Player.tsx` (and/or a new component file if the
  team-assignment screen doesn't fit naturally in the existing one)
- `lib/realtime/teamState.ts` (new) or `lib/realtime/privateState.ts`
- `i18n/es.json`, `i18n/en.json`
- `tests/unit/battleship-game.test.ts`, `tests/unit/private-state.test.ts`
- `docs/00_decisions/architecture/ADR-0005-PRIVATE-GAME-STATE.md`
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md`

### Relevant context
- `docs/ROADMAP.md` — M4 section, M4c bullet.
- `docs/00_decisions/architecture/ADR-0005-PRIVATE-GAME-STATE.md` — §6
  (the exact mechanism/limits this task implements), and the v1.2.0
  changelog entry (the sunk-ship-cells exception, same documentation
  discipline this task's own changelog entry should follow).
- `TASK-0031-battleship-core.md`, `TASK-0034-battleship-special-weapons.md`
  — the reducer/view shape this builds on.
- `lib/realtime/privateState.ts` — the single-device mechanism this task
  extends; read it fully before designing the side-channel addition.

### Definition of Done
- Everything in `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.
- Every existing M4a/M4b unit test still passes unmodified — the 2-player
  path must be provably unaffected, not just "probably fine."
- New unit tests cover: team-assignment capping/transition, the captain-only
  defense-answering guard, and that a non-captain's `answerPendingShot` call
  returns `null`.
- Live verification with **four** real, separately-connected browser tabs
  (not two) over actual Supabase Realtime: host assigns all 4 to sides,
  captain places fleet while the teammate watches it appear live and can't
  edit it, either teammate can fire on their side's turn, only the captain's
  device visibly resolves a defending shot, privacy holds (the opposing
  side's two devices see zero fleet data, same proof standard as M4a).
- `ADR-0005` gets its changelog entry for the side-channel mechanism.
- `docs/ROADMAP.md`'s M4c bullet marked done; `CURRENT_STATE.md`/
  `HANDOFF.md` updated.

### How to verify
- `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm test:e2e`.
- Four-tab live browser check per the Definition of Done above — the
  existing "clear a new tab's `localStorage` before its first navigation"
  technique (documented in the M4b handoff) extends to needing 3 fresh
  tabs, not 1, alongside the original host tab.
