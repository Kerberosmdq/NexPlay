# Current State

Living status document tracking the current sprint, objectives, completed tasks, and immediate roadmap for NexPlay.

## Current Sprint
- Sprint: Sprint 5 - M2 Impostor
- Status: In Progress

## Current Objective
M1 is complete (see `docs/ROADMAP.md`). M2 — Impostor (see `docs/NEXPLAY_PLAN.md` §6): first real, playable game on top of the platform, both device modes.

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

## Tasks In Progress
- [ ] None.

## Known Issues
- M1's two-real-phones manual reconnection check was never performed; only unit-test coverage exists for host migration. Not blocking, but should be done before M2 ships to the family.
- The alive/eliminated roster (added in TASK-0025's last round of changes)
  needs 4+ devices to playtest — founder only had 3 available. Verify once
  this is live and reachable from a phone.
- **`game_results`/`events` INSERT policies are missing on the live
  database** (confirmed via direct REST API test with a real anon-auth JWT:
  `users` insert works, the other two fail with 42501). See `HANDOFF.md`
  for the SQL fix — needs to be run in the Supabase SQL Editor, it's not
  something a code change can fix. Still not applied as of this update.

## Next Task
- Push `feat/impostor-game`, open PR, get CI green, merge (`feat/close-m1-gap`
  already merged via PR #13). Then playtest the roster with 4+ devices,
  apply the RLS fix, and do the two-real-phones reconnection check before
  considering M1+M2 fully done. Then start M3 (Who Am I) per `docs/ROADMAP.md`.

## Last Updated
- 2026-07-24
