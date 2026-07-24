# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: (unnumbered hotfix, see below)
- **Title**: Fix room connection failure (trailing newline in Supabase env var)

## Current Branch
- `fix/trim-supabase-env-vars` (branched from `main`, after TASK-0025/
  `feat/impostor-game` merged via [PR #14](https://github.com/Kerberosmdq/NexPlay/pull/14)
  and the diagnostics hotfix merged via [PR #15](https://github.com/Kerberosmdq/NexPlay/pull/15))
- About to be pushed and opened as a PR against `main`.

## What happened (read this before touching `lib/auth/client.ts` again)
After TASK-0025 (Impostor) went live, the founder reported multi-device room
creation hanging forever on "Conectando a la sala...", reproduced on their
phone and PC. PR #15 added connection diagnostics (console logs at each step,
a 12s subscribe timeout, a visible error state instead of an infinite
spinner) since the failure was completely silent — no console errors, no
WebSocket connection attempt even detectable via a `WebSocket` constructor
proxy across three different browser sessions used to investigate.

**Root cause, found once the founder tested with PR #15's logging live:**
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel's environment variables has a
**trailing newline** baked into its value (almost certainly pasted from a
terminal/file that included the `\n`). Since `NEXT_PUBLIC_*` vars are
inlined as literal strings at build time, this corrupted the `apikey` query
param on every Realtime WebSocket URL
(`...AMLM6XqxICMaMbsBeaY%0A&vsn=2.0.0` — that `%0A` is the newline), which
the server rejected with `CHANNEL_ERROR` / "transport failure". Plain
REST/Auth calls (sign-in, `/rest/v1/*` inserts) kept working fine throughout,
because they don't put the key into a URL query string the same way —
that's why sign-in, `users` inserts, and even the (separately broken) RLS
policy investigation on `events`/`game_results` all looked normal while
Realtime silently failed 100% of the time.

**Fix in this PR:** `.trim()` both `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in `lib/auth/client.ts` so a stray
newline/whitespace in the env var can never do this again.

**Still needs doing manually (not fixable from code):** the founder should
open Vercel → Project Settings → Environment Variables, re-paste
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (and ideally `NEXT_PUBLIC_SUPABASE_URL` too,
just in case) making sure no trailing newline sneaks in, and redeploy.
`.trim()` should make this moot going forward regardless, but the dashboard
value is still messy and worth cleaning up. **Confirm with the founder
whether they've done this before assuming the underlying Vercel value is
clean** — the code fix alone is sufficient, so this is a nice-to-have, not
blocking.

## Files Modified / Added (this fix)
- `lib/auth/client.ts` — `.trim()` on both Supabase env vars.
- `lib/realtime/hooks/useRoomConnection.ts` (PR #15, already merged) —
  diagnostic logging, subscribe timeout, `connectionError` state.
- `components/platform/MultiDeviceRoom.tsx` (PR #15) — renders a real error
  + retry button instead of an infinite "Conectando..." spinner.
- `i18n/en.json`, `i18n/es.json` (PR #15) — `Lobby.connectionError`,
  `Lobby.retryButton`.

## External state (not in git, important for the next agent to know)
- **Supabase project** is live (`jamrubutlvsfvmqwhbpr`), Anonymous Sign-ins enabled.
- **Vercel** is connected to GitHub repo and auto-deploys `main`.
- **GitHub branch protection on `main`** is strict: required status checks must pass before merge.
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel likely still has a trailing
  newline in the dashboard value** (see above) — the `.trim()` fix makes
  this harmless, but it's worth the founder cleaning up the actual value
  next time they're in Vercel settings, and doing one more redeploy+test to
  confirm multi-device rooms connect cleanly end to end.
- **RLS policy drift on `game_results`/`events`:** the live database is
  missing the INSERT policies for these two tables, even though they're
  present in `supabase/migrations/20260723000000_init_schema.sql`. Verified
  by hitting the REST API directly with a real anonymous-auth JWT: `users`
  insert succeeds (201), `game_results`/`events` insert fails with Postgres
  42501 ("new row violates row-level security policy"). Fix: re-run the two
  `create policy ... for insert to authenticated with check (true)`
  statements from the migration file in the Supabase SQL Editor. **Still not
  applied as of this handoff.**
- The two-real-phones manual reconnection check (M1) has still never been
  performed.
- The alive/eliminated roster (Impostor, TASK-0025) hasn't been playtested
  with 4+ devices yet — blocked on the connection bug above until now.

## Pending Tasks
- None specced yet.

## Next Suggested Task
- Push and merge `fix/trim-supabase-env-vars`.
- Founder re-tests multi-device room creation on a real phone; if it now
  connects, playtest the alive/eliminated roster with 4+ devices.
- Clean up the trailing newline in Vercel's `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  dashboard value directly (belt-and-suspenders with the `.trim()` fix).
- Apply the RLS policy fix in Supabase SQL Editor and confirm
  `recordEvent`/`recordGameResult` write successfully.
- Manually verify a real multi-phone reconnection; only then mark M1's
  remaining check done and M2 ✅ in `docs/ROADMAP.md`.
- Start M3 (Who Am I) per `docs/ROADMAP.md`.
