# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0025
- **Title**: Impostor Game (M2)

## Current Branch
- `feat/impostor-game` (branched from `feat/close-m1-gap`, which itself
  branches from `main`)
- Remote `origin`: https://github.com/Kerberosmdq/NexPlay.git
- Neither branch has been pushed or opened as a PR yet — awaiting explicit
  go-ahead before pushing. Push/PR `feat/close-m1-gap` first, merge it, then
  rebase `feat/impostor-game` onto the updated `main` before opening its PR.

## Files Modified / Added
- `lib/types/room.ts` — `GameModule` contract rewritten to match ADR-0002
  exactly (`meta`, `configSchema`, `content`, typed `views`, no `any`).
- `games/placeholder/module.ts` — migrated to the corrected contract.
- `games/impostor/` — `module.ts`, `reducer.ts` (made pure — word/impostor
  selection now injected by the caller instead of `Math.random()` inside the
  reducer), `content/{types,es,en,index}.ts` (105-word `LocalizedContentPack`,
  replacing `words.ts`), `views/Player.tsx` (next-intl instead of hardcoded
  Spanish), `views/SingleDevice.tsx` (new — real reveal-and-pass loop).
- `lib/realtime/platformReducer.ts` — removed the unsafe
  `as unknown as GameModule` cast; added `toAnyGameModule`/
  `buildDefaultConfig` helpers instead.
- `components/platform/MultiDeviceRoom.tsx`, `RoomWaitingLobby.tsx` —
  i18n'd, analytics wiring adapted to the platform-wrapped game state.
- `app/[locale]/page.tsx` — single-device mode now goes through
  `platformReducer`/`AVAILABLE_GAMES` like multi-device, so Impostor (and
  any future game) is reachable in pass-and-play mode. Previously
  hardcoded to the placeholder game only.
- `i18n/en.json`, `i18n/es.json` — `Lobby.*`, `games.*`, `Impostor.*`
  namespaces (kept in parity, `checkMessageParity` test still passes).
- `tests/unit/impostor-game.test.ts` — 11 tests: full phase walkthrough, tie
  vote, correct/incorrect impostor guess, invalid-action guards.
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, this file.

## Process note for the next agent (carried forward, still relevant)
This session started by finding that a previous agent had built a game
selector + a first pass at Impostor directly on `main`, uncommitted, with no
task spec, skipping ahead to M2 before M1 was confirmed done, and not
conforming to the ADR-0002 `GameModule` contract (crash-on-select bug from a
type it didn't actually implement, hardcoded Spanish-only content, no
single-device view). That work was not discarded — its real game logic was
reworked into TASK-0025 above. **Takeaway, restated:** write the task spec
and open the branch before writing code; a human or agent reviewing a
"done" session should check that a feature's write functions have real
call sites and that hardcoded strings didn't slip past review, since green
CI doesn't catch either.

## External state (not in git, important for the next agent to know)
- **Supabase project** is live (`jamrubutlvsfvmqwhbpr`), Anonymous Sign-ins enabled.
- **Vercel** is connected to GitHub repo and auto-deploys `main`.
- **GitHub branch protection on `main`** is strict: required status checks must pass before merge.
- **RLS policy drift on `game_results`/`events`:** the live database is
  missing the INSERT policies for these two tables, even though they're
  present in `supabase/migrations/20260723000000_init_schema.sql`. Verified
  by hitting the REST API directly with a real anonymous-auth JWT: `users`
  insert succeeds (201), `game_results`/`events` insert fails with Postgres
  42501 ("new row violates row-level security policy"). Since `users`'
  policy works with the same session, the other two policies were most
  likely never actually applied when the migration was run by hand via the
  SQL Editor (TASK-0015) — this is a repo-vs-live-DB drift, not a code bug.
  Fix: re-run the two `create policy ... for insert to authenticated with
  check (true)` statements from the migration file in the SQL Editor. Once
  fixed, `recordEvent`/`recordGameResult` (already correctly wired and now
  passing a real auth UUID, not a presence id) should work end to end.
- The two-real-phones manual reconnection check (M1) has still never been
  performed.
- Multi-device Impostor was smoke-tested in this session only up to the
  config screen (this dev sandbox has no live Supabase connection, so
  Realtime presence sync across tabs couldn't be verified). **A real
  two-or-more-phone Impostor match (role reveal → discussion → voting →
  resolution, synced live) has not been manually verified.** Do this before
  telling the family M2 is ready to play.
- Single-device Impostor **was** verified end to end in-browser this
  session: name entry → config → reveal-and-pass for 3 players → discussion
  → voting → tie-vote resolution → scores. Worked correctly, no console
  errors beyond the expected analytics network failures (no Supabase in this
  sandbox).

## Pending Tasks
- None specced yet. Two open branches need to be pushed/PR'd/merged (see
  "Current Branch" above) before starting new work.

## Next Suggested Task
- Push and merge `feat/close-m1-gap`, then `feat/impostor-game`.
- Manually verify a real multi-phone Impostor match; only then mark M2 ✅ in
  `docs/ROADMAP.md`.
- Start M3 (Who Am I) per `docs/ROADMAP.md` — should be "just a new
  GameModule" if ADR-0002 compliance work in TASK-0025 was done right; if
  it isn't, that's a signal to revisit the ADR, not to patch around it.
