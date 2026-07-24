# TASK-0025: Impostor Game (M2)

### Goal
Implement the `impostor` `GameModule` (`games/impostor/`) as the first real,
playable game per `docs/ROADMAP.md` M2, both device modes, conforming to the
ADR-0002 `GameModule` contract. This task also formalizes and corrects a
substantial batch of uncommitted work found already sitting in the working
tree (see `HANDOFF.md`'s process note) — a game selector in the multi-device
lobby, and a first pass at the Impostor reducer/views. That work had real
gameplay logic worth keeping but did not conform to ADR-0002 (no `meta`, no
`configSchema`, no `content` as a `LocalizedContentPack`, hardcoded
Spanish-only strings, a crash-on-select bug from casting `placeholderGameModule`
to a type it didn't implement, and no single-device view). This task brings
it into compliance rather than discarding it.

### Scope — in
- Fix `GameModule<TConfig, TState, TAction>` in `lib/types/room.ts` to match
  ADR-0002 §3 exactly (`meta`, `configSchema`, optional `content`, typed
  `views` — no `any`).
- Migrate `games/placeholder/module.ts` to the corrected contract (minimal
  `meta`/`configSchema`) so `AVAILABLE_GAMES` no longer needs an unsafe cast.
- `games/impostor/`: `meta`, a `configSchema` for host-facing options
  (impostor count, discussion/voting timers, hint difficulty), and a real
  `content` `LocalizedContentPack` (ES + EN word lists, moved out of
  `words.ts` into `content/es.ts` / `content/en.ts`).
- Move all Impostor UI strings into `i18n/en.json` / `i18n/es.json` under an
  `impostor.*` namespace; views consume them via `next-intl`.
- A real `games/impostor/views/SingleDevice.tsx` implementing the
  reveal-and-pass loop (ADR-0002 §4, `NEXPLAY_PLAN.md` §3.3) — no longer
  reusing the placeholder game's single-device view.
- Wire `app/[locale]/page.tsx`'s single-device path to the same
  `AVAILABLE_GAMES` registry/selector used by multi-device, so Impostor is
  reachable in pass-and-play mode too (currently only multi-device can reach
  it).
- Unit tests for `impostorReducer` covering normal play through all phases,
  the tie-vote edge case, the minimum-players guard, and at least one
  invalid-action case.

### Scope — out (non-goals for this task)
- Word/category images (tracked in `BACKLOG.md` per `ROADMAP.md` M2 note).
- Who Am I / Battleship (M3/M4).
- Changing the shared lifecycle phase names in ADR-0002 itself.

### Files this task may touch
- `lib/types/room.ts`
- `games/placeholder/module.ts`
- `games/impostor/**`
- `components/platform/MultiDeviceRoom.tsx`, `RoomWaitingLobby.tsx`
- `lib/realtime/platformReducer.ts`
- `app/[locale]/page.tsx`
- `i18n/en.json`, `i18n/es.json`
- `tests/unit/impostor-game.test.ts` (new)
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md`

### Relevant context
- ADR-0002 (GameModule Contract) — the contract this task must satisfy.
- ADR-0001 §4 (realtime resilience — inherited for free, not reimplemented).
- `docs/09_ai/HANDOFF.md` process note on how this work was found.

### Definition of Done
- Matches `docs/05_engineering/CONVENTIONS.md`'s Definition of Done in full.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run test` all pass with 0
  errors and no `any`.
- No hardcoded user-facing strings or word content in components.
- Both device modes reach Impostor and are manually smoke-tested in-browser.
- `docs/09_ai/CURRENT_STATE.md` / `HANDOFF.md` updated.

### How to verify
1. `pnpm run test` — reducer + platform tests pass.
2. `pnpm run lint` / `pnpm run typecheck` — 0 errors.
3. `pnpm dev` — create a multi-device room, select Impostor, play a full
   round (config → reveal → discussion → voting → resolution) across two
   browser tabs; then verify single-device pass-and-play also reaches
   Impostor.
