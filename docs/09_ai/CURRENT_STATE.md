# Current State

Living status document tracking the current sprint, objectives, completed tasks, and immediate roadmap for NexPlay.

## Current Sprint
- Sprint: Sprint 3 - M0 Foundations
- Status: In Progress (code scaffold done; external account setup pending)

## Current Objective
Ship M0 per `docs/ROADMAP.md`: an empty, deployable Next.js app with the
platform's foundational wiring (design tokens, i18n, tests, CI), plus
Supabase and Vercel connected and branch protection enabled on `main`.

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
- [x] **TASK-0010**: Scaffold Next.js 16 + TypeScript app with pnpm (`app/`, `components/`, `games/`, `lib/`, `supabase/migrations/`, `tests/` per CONVENTIONS.md folder structure). Root `CLAUDE.md`/`AGENTS.md` added as agent entry points (Next.js's generator produces version-specific agent warnings — kept and pointed at our onboarding docs).
- [x] **TASK-0011**: Design tokens skeleton (`app/tokens.css`) — placeholder color/type/radius/motion tokens wired through Tailwind v4 `@theme`; real brand direction deferred to M2 per PROJECT_CONSTITUTION.md Article 10.
- [x] **TASK-0012**: next-intl wired (`i18n/routing.ts`, `request.ts`, `navigation.ts`, `en.json`/`es.json`); `app/[locale]/` routing verified working for both locales in a real browser.
- [x] **TASK-0013**: Vitest + Playwright configured, each with a real (not placeholder) test: a message-catalog parity check (`i18n/checkMessageParity.ts`) and an e2e locale-routing smoke test.
- [x] **TASK-0014**: GitHub Actions CI workflow (`.github/workflows/ci.yml`) — lint, typecheck, unit tests, and e2e as separate jobs.

## Tasks In Progress
- [ ] None (code portion of M0 complete; awaiting merge)

## Known Issues
- None. Note: while running the Playwright e2e smoke test, port 3000 on the
  developer's machine was found occupied by an unrelated running app
  ("NexIndu"). Not a NexPlay issue — `playwright.config.ts` now runs against
  a dedicated port (3100) to avoid any collision, regardless of what else is
  running locally.

## Next Task
- **Vercel**: connect the GitHub repo, deploy the current `main` (empty app)
  to confirm it goes live.
- **Supabase**: create the project, enable Anonymous Auth, write the first
  migration (RLS enabled) for `users`/`game_results`/`events` per ADR-0001 §3.
- **GitHub branch protection** on `main` before multiple agents open PRs
  against it.
- These three require the founder's own accounts/credentials and cannot be
  done by an AI agent directly — see `docs/09_ai/HANDOFF.md`.
- Once those land, M0 is done and M1 (platform walking skeleton) starts.

## Last Updated
- 2026-07-22
