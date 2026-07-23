# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0020
- **Title**: Wire Supabase Anonymous Auth on first app load

## Current Branch
- `feat/anonymous-auth`
- Remote `origin`: https://github.com/Kerberosmdq/NexPlay.git

## Files Modified / Added
- `package.json`, `pnpm-lock.yaml` — added `@supabase/supabase-js` dependency.
- `lib/auth/client.ts` — browser Supabase client factory using `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `lib/auth/session.ts` — `ensureAnonymousSession(client)` helper for reusing/signing-in anonymously and writing user ID row to `public.users`.
- `lib/auth/index.ts` — re-exported auth methods and types.
- `components/platform/AuthProvider.tsx` — client component triggering silent auth initialization on mount.
- `app/[locale]/layout.tsx` — wrapped layout with `<AuthProvider>`.
- `tests/unit/auth.test.ts` — Vitest unit test suite covering session reuse, new session sign-in, duplicate row handling, and error cases (100% green).
- `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md` (this file).

## External state (not in git, important for the next agent to know)
- **Supabase project** is live (`jamrubutlvsfvmqwhbpr`), Anonymous Sign-ins enabled.
- **Vercel** is connected to GitHub repo and auto-deploys `main`.
- **GitHub branch protection on `main`** is strict: required status checks must pass before merge.

## Pending Tasks
- **TASK-0021**: Room creation and join-by-code (`lib/realtime/`) — the second slice of **M1 — Platform walking skeleton**.

## Next Suggested Task
- Push `feat/anonymous-auth` branch to origin, open PR on GitHub, wait for CI to turn green, and merge into `main`.
- Begin TASK-0021: implement room code generation and Supabase Realtime channel setup under `lib/realtime/`.

