# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0014
- **Title**: M0 code scaffold — Next.js app, design tokens, i18n, tests, CI

## Current Branch
- `feat/m0-app-scaffold` (not yet merged to `main` — pending merge/push)
- Remote `origin`: https://github.com/Kerberosmdq/NexPlay.git

## Files Modified
- Root: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`,
  `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`,
  `playwright.config.ts`, `proxy.ts` (Next.js 16 renamed `middleware.ts` →
  `proxy.ts` — see AGENTS.md warning about version drift), `.gitignore`,
  `README.md`, `CLAUDE.md`, `AGENTS.md`, `.claude/launch.json`.
- `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`, `app/globals.css`,
  `app/tokens.css` (design tokens skeleton), `app/favicon.ico`.
- `i18n/routing.ts`, `request.ts`, `navigation.ts`, `en.json`, `es.json`,
  `checkMessageParity.ts` (+ unit test).
- `components/ui/`, `components/platform/`, `games/`, `lib/realtime/`,
  `lib/auth/`, `lib/analytics/`, `supabase/migrations/`, `tests/unit/`,
  `tests/e2e/` — folder skeleton per `docs/05_engineering/CONVENTIONS.md`,
  each with a README explaining its purpose (all currently empty of code —
  first real game is M2).
- `tests/unit/checkMessageParity.test.ts`, `tests/e2e/locale-routing.spec.ts`.
- `.github/workflows/ci.yml` — lint/typecheck/unit-test job + separate e2e job.
- `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md` (this file) — updated.

## Verification done
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run test` all pass locally.
- `pnpm run build` succeeds; app manually verified in a real browser at
  `/en` and `/es` — correct locale content rendered on each.
- `pnpm run test:e2e` passes (2/2) against a dedicated port (3100).

## Pending Tasks
1. Merge `feat/m0-app-scaffold` into `main`, push, delete the branch (same
   clean-branch pattern used for the architecture pre-flight).
2. **Vercel**: connect the GitHub repo, deploy `main`. Requires the
   founder's own Vercel account — an AI agent cannot create accounts or log
   in on the founder's behalf.
3. **Supabase**: create the project, enable Anonymous Auth, write the first
   RLS-enabled migration for `users`/`game_results`/`events` (ADR-0001 §3,
   ADR-0003). Also requires the founder's own account.
4. **GitHub branch protection** on `main` — requires explicit permission
   before changing repo settings; ask before running via `gh` or guide
   through the GitHub UI.
5. Once 2-4 land, M0 is done and M1 (platform walking skeleton) starts.

## Warnings
- Do not attempt to work on `main` branch.
- Maintain English as the mandatory repository language for all documentation files.
- Any change to the `GameModule` contract (ADR-0002) or the persistence
  boundary (ADR-0001 §3) requires updating the relevant ADR, not a silent
  code change.
- New durable Supabase tables beyond `users`, `game_results`, `events`
  require an ADR update first (ADR-0001).
- Child-privacy posture is strict (ADR-0003): no PII, display names are
  ephemeral only, analytics events are enums/numbers only, no third-party
  analytics SDKs.
- **Next.js 16 renamed `middleware.ts` to `proxy.ts`.** `AGENTS.md` at the
  repo root warns that this Next.js version may differ from an agent's
  training data — check `node_modules/next/dist/docs/` before assuming any
  Next.js API/convention.
- An unrelated app ("NexIndu") was found running on `localhost:3000` on the
  founder's machine during testing — not part of this repo. `playwright.config.ts`
  deliberately uses port 3100 to avoid ever colliding with whatever else may
  be running locally.

## Recommendations
- Before starting Vercel/Supabase setup, run the `start-task` skill.
- Ideas that surface but aren't in scope go to `docs/BACKLOG.md`.

## Next Suggested Task
- Merge this branch, then walk the founder through Vercel + Supabase setup
  (steps 2-3 above) and get explicit permission for branch protection (step 4).
