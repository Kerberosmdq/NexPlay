# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0025
- **Title**: Impostor Game (M2)

## Current Branch
- `feat/impostor-game` (rebased onto `main` after TASK-0024/`feat/close-m1-gap`
  merged via [PR #13](https://github.com/Kerberosmdq/NexPlay/pull/13))
- Remote `origin`: https://github.com/Kerberosmdq/NexPlay.git
- About to be pushed and opened as a PR against `main`.

## Files Modified / Added
- `lib/types/room.ts` — `GameModule` contract rewritten to match ADR-0002
  exactly (`meta`, `configSchema`, `content`, typed `views`, no `any`).
- `games/placeholder/module.ts` — migrated to the corrected contract.
- `games/impostor/` — `module.ts`, `reducer.ts` (pure; word/impostor
  selection injected by the caller, multi-round elimination loop, turn-based
  discussion, no-repeat word tracking), `pickRound.ts` (shared word/impostor
  picker, dedup'd out of both views), `content/{types,es,en,index}.ts`
  (105-word `LocalizedContentPack`), `views/Player.tsx`, `views/SingleDevice.tsx`
  (real reveal-and-pass single-device flow), `views/PlayerRoster.tsx` (new —
  alive/eliminated strip shown during discussion/voting).
- `lib/realtime/platformReducer.ts` — removed the unsafe
  `as unknown as GameModule` cast; added `toAnyGameModule`/
  `buildDefaultConfig` helpers instead.
- `components/platform/MultiDeviceRoom.tsx`, `RoomWaitingLobby.tsx` —
  i18n'd, analytics wiring adapted to the platform-wrapped game state.
- `app/[locale]/page.tsx` — single-device mode now goes through
  `platformReducer`/`AVAILABLE_GAMES` like multi-device, so Impostor (and
  any future game) is reachable in pass-and-play mode.
- `lib/analytics/index.ts` — `recordEvent` now resolves the real Supabase
  auth user id itself instead of receiving a room's ephemeral presence id
  (was causing every insert to fail — presence ids aren't valid uuids).
- `i18n/en.json`, `i18n/es.json` — `Lobby.*`, `games.*`, `Impostor.*`
  namespaces (kept in parity, `checkMessageParity` test still passes).
- `tests/unit/impostor-game.test.ts`, `tests/unit/impostor-pick-round.test.ts`
  — 25 tests: full phase walkthrough, multi-round elimination (tie/wrong
  vote continues, majority-lock ends the match, 2 impostors need both
  caught), turn mechanic, word-repeat tracking, invalid-action guards.
- `docs/ROADMAP.md`, `docs/BACKLOG.md`, `docs/09_ai/CURRENT_STATE.md`, this file.

## Gameplay changes from playtesting feedback (post-initial-implementation)
The first working version only ran a single discussion+vote round per match
— a tie or a wrong elimination ended the game immediately as "impostor
survived," which isn't how the family actually plays. Reworked into a real
multi-round elimination loop (Mafia-style): each round eliminates one player
(or nobody, on a tie) and the match continues until the last impostor is
caught or impostors can no longer be out-voted (majority lock). Also added,
across a few rounds of feedback:
- Rebalanced scoring so a caught-but-correct-guess impostor doesn't walk
  away with full points while correct voters get nothing.
- A distinct celebratory resolution screen when the impostor survives.
- A configurable impostor count (1-3) — was in the reducer but never
  exposed in either config UI.
- Turn-based discussion (each alive player says one word/clue in order)
  replacing a free-form countdown timer, which didn't match how the family
  plays and left `discussionTimeSeconds` half-implemented.
- Words never repeat within one match, even across "play again" rounds.
- An alive/eliminated roster shown during discussion/voting so a group of
  5+ players across several rounds doesn't lose track of who's still in.

## Process note for the next agent (carried forward, still relevant)
This session started by finding that a previous agent had built a game
selector + a first pass at Impostor directly on `main`, uncommitted, with no
task spec, skipping ahead to M2 before M1 was confirmed done, and not
conforming to the ADR-0002 `GameModule` contract. That work was not
discarded — its real game logic was reworked into TASK-0025. **Takeaway:**
write the task spec and open the branch before writing code; check that a
feature's write functions have real call sites and that hardcoded strings
didn't slip past review, since green CI doesn't catch either.

## External state (not in git, important for the next agent to know)
- **Supabase project** is live (`jamrubutlvsfvmqwhbpr`), Anonymous Sign-ins enabled.
- **Vercel** is connected to GitHub repo and auto-deploys `main`.
- **GitHub branch protection on `main`** is strict: required status checks must pass before merge.
- **RLS policy drift on `game_results`/`events`:** the live database is
  missing the INSERT policies for these two tables, even though they're
  present in `supabase/migrations/20260723000000_init_schema.sql`. Verified
  by hitting the REST API directly with a real anonymous-auth JWT: `users`
  insert succeeds (201), `game_results`/`events` insert fails with Postgres
  42501 ("new row violates row-level security policy"). Fix: re-run the two
  `create policy ... for insert to authenticated with check (true)`
  statements from the migration file in the Supabase SQL Editor. **Still not
  applied as of this handoff** — confirm with the founder before assuming
  it's fixed.
- The two-real-phones manual reconnection check (M1) has still never been
  performed.
- Multi-device Impostor was smoke-tested only up to the config/lobby screens
  in dev sandboxes across this session (no reliable way to drive a full
  multi-tab Realtime match from the available tooling). **The founder
  playtested a real match on 3 real devices** (multi-round elimination,
  scoring, celebration screen) and confirmed it works well. The
  alive/eliminated roster specifically has NOT been playtested yet — needs
  4+ devices, which the founder didn't have on hand; do this once this PR
  is live so they can test from a phone.

## Pending Tasks
- None specced yet.

## Next Suggested Task
- Push and merge `feat/impostor-game` (PR to follow this handoff update).
- Once live, playtest the alive/eliminated roster with 4+ devices.
- Apply the RLS policy fix in Supabase SQL Editor (see above) and confirm
  `recordEvent`/`recordGameResult` actually write successfully.
- Manually verify a real multi-phone reconnection (kill one phone's
  connection mid-match); only then mark M1's remaining check done.
- Mark M2 ✅ in `docs/ROADMAP.md` once the above playtesting confirms it.
- Start M3 (Who Am I) per `docs/ROADMAP.md` — should be "just a new
  GameModule" if ADR-0002 compliance work in TASK-0025 was done right.
