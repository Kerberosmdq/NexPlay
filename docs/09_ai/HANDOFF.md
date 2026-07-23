# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0018
- **Title**: M0 — Foundations (complete: app scaffold, Supabase, Vercel, branch protection)

## Current Branch
- `main`
- Remote `origin`: https://github.com/Kerberosmdq/NexPlay.git (pushed)
- No other branches exist locally or on origin. Every task branch so far has
  been merged and deleted immediately after landing on `main`.

## Files Modified (this session, since the architecture pre-flight)
- Full Next.js app scaffold (`app/`, `components/`, `games/`, `lib/`,
  `i18n/`, `tests/`, config files) — see the previous handoff entry for the
  full list; superseded by this one.
- `supabase/migrations/20260723000000_init_schema.sql` — `users`,
  `game_results`, `events` with RLS, applied to the live Supabase project.
- `.env.example` (committed) and `.env.local` (gitignored, holds the real
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` for this
  project — already populated, do not overwrite blindly).
- `docs/ROADMAP.md` — M0 marked complete.
- `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md` (this file).

## External state (not in git, important for the next agent to know)
- **Supabase project** is live (`jamrubutlvsfvmqwhbpr`), Anonymous Sign-ins
  enabled, migration applied, RLS confirmed on all three tables.
- **Vercel** is connected to this GitHub repo and auto-deploys `main`. Live
  at https://nex-play-one.vercel.app — verified working at `/en` and `/es`.
- **GitHub branch protection on `main`** is strict: required status checks
  (`Lint, typecheck, unit tests`, `End-to-end tests` from `.github/workflows/ci.yml`)
  must pass before merge, `enforce_admins: true` (no bypass, not even for the
  repo owner), no force pushes, no deletions. **Every change from here on —
  including the founder's own — must go through a PR with green CI.** Direct
  pushes to `main` will now be rejected by GitHub itself.

## Pending Tasks
- **M1 — Platform walking skeleton** is next (`docs/ROADMAP.md`): room
  creation/join-by-code, both device modes, realtime sync of a placeholder
  state across two real devices, reconnection/host-migration (ADR-0001 §4)
  manually verified, and durable writes to `game_results`/`events` wired for
  a placeholder game.
- No Supabase client code exists in the app yet — that's the first real work
  of M1 (`lib/auth/`, `lib/realtime/`), consuming the env vars now in place.

## Warnings
- Because branch protection now enforces PRs even for the owner, the
  "checkout branch → work → merge --ff-only → push → delete branch" flow
  used so far will need to become "checkout branch → work → push → open PR
  → wait for CI → merge via GitHub" going forward. Update this workflow
  expectation for the next agent/session.
- Do not commit `.env.local` or any real secret. `.env.example` is the only
  env file that belongs in git.
- Any change to the `GameModule` contract (ADR-0002) or the persistence
  boundary (ADR-0001 §3) requires updating the relevant ADR first.
- New durable Supabase tables beyond `users`, `game_results`, `events`
  require an ADR update first.
- Child-privacy posture is strict (ADR-0003): no PII, ephemeral display
  names only, enum/number-only analytics, no third-party analytics SDKs.
- Next.js 16 uses `proxy.ts`, not `middleware.ts` — see `AGENTS.md`.

## Recommendations
- Before M1 work starts, run the `start-task` skill.
- Ideas that surface but aren't in scope go to `docs/BACKLOG.md`.

## Next Suggested Task
- Kick off M1: implement `lib/auth/` (anonymous sign-in on first load) and
  `lib/realtime/` (room creation/join-by-code), per ADR-0001/ADR-0002.
