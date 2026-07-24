# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0026
- **Title**: Who Am I Game (M3)

## Current Branch
- `feat/who-am-i-game` — about to be pushed and opened as a PR against `main`.
- Everything before this (M1, M2, the connection/RLS hotfixes, the
  "remember the room" feature) is already merged to `main` and live.

## What's in this task
Full design was worked out with the founder in conversation *before*
writing any code (see `docs/09_ai/tasks/TASK-0026-who-am-i-game.md` for the
agreed spec). Summary of the game:
- Everyone gets a secret word; every device shows everyone *else's* word.
- Questions rotate one player at a time (fixed turn order), but *guessing*
  is not turn-locked — anyone can declare "I think I know" at any moment,
  say it out loud, and self-report correct/wrong (same honor-system
  pattern as Impostor's voting).
- Correct guess → that word is revealed to them, fixed points awarded,
  they drop out of the question-turn rotation but keep watching/helping.
- Timer expires → anyone who never guessed gets their word revealed with
  0 points.
- Single-device: sequential per-player turns, Heads-Up style — phone shown
  to everyone but the current guesser, per-turn timer, "¡Adivinó!"/"Pasar".
- Content: a **separate** word bank from Impostor's (founder's explicit
  call, not shared), same categories minus Professions, each word tagged
  with an emoji as a lightweight "picture" (no real art, no AI-generated
  content at runtime — consistent with `NEXPLAY_PLAN.md`'s non-goals).

## Why this task matters beyond "one more game"
M3 exists specifically to prove ADR-0002's `GameModule` contract is real —
that a second game is "just a new module," not new platform plumbing. It
held: the only platform-adjacent touches were one additive line in
`AVAILABLE_GAMES` and one entry in the `TERMINAL_PHASE_BY_GAME` lookup
table in `MultiDeviceRoom.tsx`/`page.tsx` — a table that already documents
itself as the intended per-game extension point (added during Impostor's
build). `lib/types/room.ts`, `platformReducer.ts`'s actual logic, and
`useRoomConnection.ts` were untouched. If M4 (Battleship) needs more than
this, that's a real signal to revisit ADR-0002, not a reason to improvise.

## Files Modified / Added
- `games/who-am-i/`: `reducer.ts` (pure — turn rotation skips guessed
  players, anytime-guess scoring, timer-driven or manual `END_ROUND`),
  `module.ts`, `pickRound.ts` (word/turn-order picker, mirrors Impostor's),
  `content/{types,es,en,index}.ts` (85-word bank with emoji, Impostor's
  animals/food/household/toys-vehicles-nature categories minus
  Professions), `views/Player.tsx` (multi-device), `views/SingleDevice.tsx`
  (Heads-Up-style sequential turns).
- `lib/realtime/platformReducer.ts` — additive `AVAILABLE_GAMES` registration.
- `components/platform/MultiDeviceRoom.tsx`, `app/[locale]/page.tsx` —
  one `TERMINAL_PHASE_BY_GAME` entry each (`"who-am-i": "resolution"`).
- `i18n/en.json`, `i18n/es.json` — `WhoAmI.*` and `games.whoAmI.*`
  namespaces, kept in parity.
- `tests/unit/who-am-i-game.test.ts` — 15 tests.
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, this file.

## Bug found and fixed during this task's own verification
Single-device's config screen initially offered timer options (1/2/3 min)
that didn't include the module's actual default (`300` seconds, 5 min,
shared with multi-device's config schema) — the `<select>` silently had no
matching option while the countdown still ran off the real 300s value.
Fixed by unifying both device modes' timer option lists (3/5/7/10 min +
unlimited). Also caught (via `read_console_messages` during manual
testing) a `dispatch()` call happening directly in a component's render
body instead of inside a `useEffect` — a real React anti-pattern
(`Cannot update a component while rendering a different component`) in
`SingleDevice.tsx`'s "round exhausted" safety net. Fixed by moving the
`roundExhausted` check + `dispatch` into a proper effect, hooks declared
unconditionally before any early return. Both fixed and re-verified live
before committing — see the reducer/view diffs.

## External state (not in git, important for the next agent to know)
- **Supabase project** is live (`jamrubutlvsfvmqwhbpr`), Anonymous Sign-ins enabled.
- **Vercel** is connected to GitHub repo and auto-deploys `main`.
- **GitHub branch protection on `main`** is strict: required status checks must pass before merge.
- The Realtime connection bug (trailing newline env var) and the
  `game_results`/`events` RLS gap are both resolved and confirmed live —
  see prior handoffs in git history if the details are needed again.
- Who Am I was playtested locally end to end in **single-device** mode only
  (this dev environment has no live Supabase connection to test
  multi-device Realtime). **Multi-device Who Am I has not been played by
  the founder on real devices yet** — do this before marking M3 done.
- M1's two-real-phones *dedicated* reconnection test (multiple devices,
  one drops while others stay connected, host migration) still hasn't
  happened — the "remember the room" feature (merged earlier) proved a
  *single* device can drop and silently rejoin, which is related but not
  the same scenario.

## Pending Tasks
- None specced yet.

## Next Suggested Task
- Push and merge `feat/who-am-i-game`.
- Founder playtests a real multi-device Who Am I match; mark M3 ✅ in
  `docs/ROADMAP.md` once confirmed.
- Do M1's dedicated two-real-phones reconnection test if it hasn't
  happened by then.
- Start M4 — Battleship (`docs/ROADMAP.md`) — deliberately a structurally
  different game (board state, 1v1 only, no hidden-role mechanic) to prove
  the platform stretches beyond word/party games. If ADR-0002 needs to
  grow to support it, that's expected and fine — just do it as a real ADR
  amendment, not a quiet workaround.
