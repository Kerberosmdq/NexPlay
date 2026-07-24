# Current State

Living status document tracking the current sprint, objectives, completed tasks, and immediate roadmap for NexPlay.

## Current Sprint
- Sprint: Sprint 6 - M3 Who Am I
- Status: Implemented, pending founder playtest

## Current Objective
M1 and M2 are both complete (see `docs/ROADMAP.md`). M3 — Who Am I (see `docs/NEXPLAY_PLAN.md` §6): second game, deliberately chosen to stress-test that the platform is truly reusable — should be "just a new GameModule."

## Completed Tasks
- [x] **TASK-0001**: Bootstrap Documentation Structure
- [x] **TASK-0001.1**: Documentation Architecture Improvements (V2)
- [x] **TASK-0002**: Create Core Documentation Infrastructure
- [x] **TASK-0003**: Write NexPlay Master Plan (`docs/NEXPLAY_PLAN.md`)
- [x] **TASK-0004**: Write ADR-0001, ADR-0002, ADR-0003
- [x] **TASK-0005**: Create `docs/ROADMAP.md` and `docs/BACKLOG.md`
- [x] **TASK-0006**: Write `docs/05_engineering/CONVENTIONS.md`
- [x] **TASK-0007**: Reconcile git state, first commit, remote configured
- [x] **TASK-0008**: Create `start-task` / `finish-task` skills
- [x] **TASK-0009**: Lock package manager to pnpm exclusively (amended ADR-0001)
- [x] **TASK-0010**: Scaffold Next.js 16 + TypeScript app with pnpm
- [x] **TASK-0011**: Design tokens skeleton (`app/tokens.css`)
- [x] **TASK-0012**: next-intl wired (ES/EN), verified in-browser
- [x] **TASK-0013**: Vitest + Playwright with real smoke tests
- [x] **TASK-0014**: GitHub Actions CI workflow
- [x] **TASK-0015**: Initial Supabase migration (`users`, `game_results`,
      `events`) with RLS policies per ADR-0001/ADR-0003; applied to the live
      project via the Supabase SQL Editor and confirmed present.
- [x] **TASK-0016**: `.env.example` + `.env.local` (local, gitignored) wired
      with the project's real Supabase URL/anon key.
- [x] **TASK-0017**: Vercel project connected and deployed — live at
      https://nex-play-one.vercel.app, verified working at both `/en` and
      `/es` with no console errors.
- [x] **TASK-0018**: GitHub branch protection enabled on `main` — strict:
      required status checks (`Lint, typecheck, unit tests`, `End-to-end
      tests`) must pass, enforced for admins too (no bypass), no force
      pushes or deletions.
- [x] **TASK-0020**: Wire Supabase Anonymous Auth on first load (`lib/auth/`,
      `AuthProvider`, `public.users` row creation, unit tests).
- [x] **TASK-0021**: Room creation and join-by-code primitives (`lib/realtime/`,
      room code generator, room state & presence management, host migration logic, unit tests).
- [x] **TASK-0022**: Multi-device & Single-device placeholder state synchronization UI (`games/placeholder/` & `components/platform/`).
- [x] **TASK-0023**: Reconnection resilience, host migration, and `lib/analytics` write helpers (`lib/realtime/hooks/useRoomConnection.ts`, `lib/analytics/`). No task spec doc was written for this one before starting — process gap, noted so it isn't repeated.
- [x] **TASK-0024**: Closed the M1 gap left by TASK-0023 — `recordGameResult`/`recordEvent` were defined but never called (dead code); wired real call sites into both device-mode lifecycles, added unit tests for `calculateHostMigration` edge cases, marked M1 ✅ in `docs/ROADMAP.md`.
- [x] **TASK-0025**: Impostor game (M2) — both device modes. Reworked an
      uncommitted, un-specced batch of prior work into ADR-0002 compliance
      (`GameModule` contract fixed, ES+EN `LocalizedContentPack`, all UI
      strings via `next-intl`, real reveal-and-pass `SingleDeviceView`, pure
      reducer), then iterated through several rounds of founder playtesting
      feedback: multi-round Mafia-style elimination (was ending after one
      vote), rebalanced scoring, a celebratory "impostor survived" screen,
      an impostor-count selector, turn-based discussion replacing a
      half-wired timer, no-repeat words within a match, and an
      alive/eliminated roster. 25 unit tests. Founder playtested a full
      match on 3 real devices and confirmed it plays well.
- [x] **Hotfix (unnumbered)**: Multi-device rooms hung forever on "Conectando
      a la sala..." in production — `NEXT_PUBLIC_SUPABASE_ANON_KEY` had a
      trailing newline in Vercel, corrupting the Realtime WebSocket
      `apikey` query param (`CHANNEL_ERROR`/"transport failure" on every
      attempt, silent because REST/Auth calls don't embed the key in a URL
      the same way). Fixed in two PRs: #15 added connection diagnostics
      (logging, timeout, visible error+retry UI) that revealed the real
      error once tested live; #16 added `.trim()` on both Supabase env vars
      so a stray newline can't do this again. Founder also re-pasted the
      env vars cleanly in Vercel and redeployed. Confirmed working: full
      multi-device match on 4+ real devices, including the
      alive/eliminated roster.
- [x] **`game_results`/`events` RLS policies applied** to the live database
      (the founder re-ran the migration's `create policy` statements — they
      really were missing). Verified with a real anon-auth JWT hitting the
      REST API directly the same way the app's `supabase-js` client does
      (`Prefer: return=minimal`, no `.select()`): both tables now insert
      successfully (201). An earlier round of "still failing" reports during
      this verification was a false alarm from the verification script
      itself requesting `return=representation`, which requires a SELECT
      policy that was deliberately never added (reads happen via the
      dashboard/service role, per ADR-0003) — not a real bug.
- [x] **Remember the room on this device** (`lib/realtime/session.ts`) — a
      real gap the founder found while doing M1's reconnection check: if a
      phone's connection dropped and nobody wrote down the room code, that
      player was locked out for good. Multi-device sessions now persist to
      `localStorage` and silently rejoin on load via the existing
      presence-based reconnection (ADR-0001 §4). Same-device only. Founder
      confirmed it works (killed the connection mid-match, reopened, landed
      back in the same room). This exercises the same presence-based
      rejoin code path M1's reconnection check cares about, but solo — it
      doesn't confirm the specific multi-phone host-migration scenario
      (one phone drops while others stay connected). See Known Issues.
- [x] **TASK-0026**: Who Am I (M3) — second game, designed collaboratively
      with the founder before writing any code (turn-order rotation +
      anytime self-reported guessing, shared/per-turn timer, Heads-Up-style
      single-device, dedicated word bank with emoji instead of real art).
      Built with zero changes to the shared platform beyond one additive
      registry line and one lookup-table entry (the documented
      `TERMINAL_PHASE_BY_GAME` extension point) — the reuse test M3 exists
      for passed. 15 unit tests. Playtested locally end to end
      (single-device full round; multi-device only to the lobby/config
      screen — no live Supabase in this dev sandbox).
- [x] **Post-merge fixes found by the founder on the live deployment**:
      (1) Who Am I's card in the room lobby showed the raw i18n key
      `games.who-am-i.description` instead of translated text — the
      catalog used `whoAmI` (camelCase) under `games.*`, but
      `RoomWaitingLobby.tsx` derives the description key from `game.id`
      directly (`"who-am-i"`, kebab-case, matching Impostor/placeholder's
      convention where id and i18n key were always identical). Renamed the
      catalog key and every `games.whoAmI.*` reference to match. (2)
      Removed `games/placeholder/` entirely (game, tests, i18n keys,
      registry entry) — its only purpose was scaffolding for M1 and the
      founder asked for it gone now that two real games exist.
- [x] **Multi-device Who Am I redesigned to match the real physical game**:
      the founder caught that the first version had every device showing a
      *list* of everyone else's words — but the actual intended play
      pattern is Heads-Up style per device: each phone shows only its own
      owner's word, held facing outward so everyone but the owner can read
      it (to learn someone else's word, you look at *their* phone, not
      your own). Reworked `games/who-am-i/views/Player.tsx` to show the
      viewer's own word big (with emoji, matching single-device's Heads-Up
      screen) instead of a roster. Also dropped the turn-rotation UI/state
      entirely (`turnOrder`/`turnIndex`/`NEXT_TURN`) — it was purely
      cosmetic (never affected scoring) and the founder wants the family to
      self-regulate who asks next verbally, same as they already do for
      single-device. 60 tests (turn-rotation tests removed, since that
      mechanic no longer exists).

## Tasks In Progress
- [ ] None.

## Known Issues
- M1's two-real-phones reconnection check (multiple devices in a room,
  one drops, others stay connected, host migration if needed) has still
  never been dedicatedly tested. The "remember the room" feature confirms
  a single device can drop and silently rejoin, which is reassuring but
  not the same test. Not blocking, but worth doing for real confidence in
  the resilience story before relying on it under real family chaos.
- Who Am I's multi-device path hasn't been playtested by the founder yet
  (only single-device was, locally). Do this before calling M3 done.

## Next Task
- Push/merge the Who Am I branch, then have the founder playtest a real
  multi-device Who Am I match. Mark M3 ✅ in `docs/ROADMAP.md` once
  confirmed, then start M4 (Battleship) per `docs/ROADMAP.md`.

## Last Updated
- 2026-07-24
