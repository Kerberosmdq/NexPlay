# TASK-0024: Close M1 Persistence & Verification Gap

### Goal
TASK-0023 (`b0cdcfb`) implemented reconnection resilience, host migration, and
the `lib/analytics` write helpers, and was merged to `main` with green CI.
On review, `docs/ROADMAP.md`'s M1 "Done when" criteria are not actually met:
`recordGameResult`/`recordEvent` are defined but never called from any game
flow (dead code), and there is no automated test coverage for host migration
or the reconnection/full-state-sync path. This task closes that gap so M1 can
be honestly marked complete before M2 (Impostor) work proceeds, per
`docs/ROADMAP.md`'s "milestones ship in order" rule.

### Scope — in
- Call `recordEvent("room_created")` when a room is created, `recordEvent("game_started")`
  and `recordGameResult(...)` at the appropriate lifecycle points for the
  placeholder game (multi-device and single-device).
- Unit tests for `calculateHostMigration` (`lib/realtime/room.ts`) covering:
  host online (no-op), host offline with other players present (migration to
  oldest joiner), all players offline (no host).
- Unit tests for `lib/realtime/platformReducer.ts` reducer transitions.
- Mark M1 as `✅ Complete` in `docs/ROADMAP.md` with a short evidence note,
  once the above lands and passes.

### Scope — out (non-goals for this task)
- No changes to the Impostor game or the multi-game selector UI (tracked
  separately in TASK-0025).
- No new Supabase tables or schema changes — `game_results`/`events` already
  exist from TASK-0015.
- No manual two-phone verification script — automated test coverage is the
  bar for this task; a manual verification note is left in `HANDOFF.md` as a
  follow-up if desired, not blocking.

### Files this task may touch
- `lib/analytics/index.ts` (call sites only, no new exports)
- `components/platform/MultiDeviceRoom.tsx`
- `app/[locale]/page.tsx`
- `tests/unit/room.test.ts`
- `tests/unit/platform-reducer.test.ts` (new)
- `docs/ROADMAP.md`
- `docs/09_ai/CURRENT_STATE.md`
- `docs/09_ai/HANDOFF.md`

### Relevant context
- ADR-0001 §3 (persistence boundary) and §4 (realtime resilience policy).
- `docs/ROADMAP.md` M1 "Done when" criteria.

### Definition of Done
- Matches `docs/05_engineering/CONVENTIONS.md`'s Definition of Done in full.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run test` all pass.
- `recordGameResult`/`recordEvent` have at least one real call site each.
- `calculateHostMigration` and `platformReducer` have unit test coverage.
- `docs/ROADMAP.md` M1 marked complete; `CURRENT_STATE.md`/`HANDOFF.md` updated.

### How to verify
1. `pnpm run test` — new tests pass.
2. `pnpm run lint` / `pnpm run typecheck` — 0 errors.
3. Grep confirms `recordGameResult`/`recordEvent` have call sites outside their own file.
