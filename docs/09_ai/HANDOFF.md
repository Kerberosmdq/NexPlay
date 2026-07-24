# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: (unnumbered hotfixes, see below)
- **Title**: M2 (Impostor) fully verified live — connection bug fixed, RLS gap closed

## Current Branch
- `main` — everything below is merged and deployed. No open branches.

## What happened (read this before assuming M1/M2 are fully done)

TASK-0025 (Impostor, M2) merged, then the founder playtested on a real
deployment and hit two real production issues, both now resolved:

### 1. Rooms hung forever on "Conectando a la sala..."
Root cause: `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel had a **trailing
newline** baked into its value. Since `NEXT_PUBLIC_*` vars are inlined as
literal strings at build time, this corrupted the `apikey` query param on
every Realtime WebSocket URL (visible as `%0A` right before `&vsn=2.0.0`),
which Supabase rejected with `CHANNEL_ERROR`/"transport failure" — 100% of
the time, completely silently, because REST/Auth calls don't embed the key
in a URL the same way and kept working fine throughout, masking the issue.
Fixed via [PR #15](https://github.com/Kerberosmdq/NexPlay/pull/15)
(connection diagnostics — logging, a 12s subscribe timeout, a visible
error+retry UI instead of an infinite spinner — which is what revealed the
real error once the founder tested live) and
[PR #16](https://github.com/Kerberosmdq/NexPlay/pull/16) (`.trim()` on both
Supabase env vars in `lib/auth/client.ts`, so a stray newline can't do this
again regardless of how the Vercel dashboard value is pasted). The founder
also re-pasted the env vars cleanly in Vercel and redeployed.
**Confirmed fixed:** full multi-device match playtested on 4+ real devices.

### 2. `game_results`/`events` RLS policies were missing on the live DB
Known since TASK-0024/0025 (see prior handoffs) — the migration file always
had the right policies, but they were apparently never applied when
`supabase/migrations/20260723000000_init_schema.sql` was run by hand via
the SQL Editor back in TASK-0015. The founder re-ran the two `create
policy ... for insert to authenticated with check (true)` statements.

**Important process note on how this was verified**, because it caused a
confusing back-and-forth: my first few verification attempts (hitting the
REST API directly with a real anon-auth JWT) kept failing with
`42501 — new row violates row-level security policy`, even after the
founder confirmed the SQL ran successfully and `pg_policies`/
`information_schema.role_table_grants` all showed exactly the right
config. **The RLS policy and grants were correct the whole time** — my
test script was requesting `Prefer: return=representation` (to see the
inserted row for debugging), which requires a SELECT policy to be visible
after insert. These tables deliberately have no SELECT policy (reads are
dashboard/service-role-only, per ADR-0003) — so `return=representation`
will always 403 on these tables, even though a plain insert (what the real
app does — `supabase-js`'s `.insert()` without `.select()` uses
`Prefer: return=minimal` by default) succeeds fine. **Confirmed working**
once the verification script matched the app's actual request shape (201
on both tables). Lesson for next time: when verifying an RLS fix via raw
REST calls, match the exact `Prefer` header the real client library sends
— don't add `return=representation` "just to see the data," since it
changes what the RLS check actually has to satisfy.

## Files touched across this stretch
- `lib/realtime/hooks/useRoomConnection.ts` — diagnostic logging, subscribe
  timeout, `connectionError` state (PR #15).
- `components/platform/MultiDeviceRoom.tsx` — real error + retry UI instead
  of infinite spinner (PR #15).
- `i18n/en.json`, `i18n/es.json` — `Lobby.connectionError`, `Lobby.retryButton`.
- `lib/auth/client.ts` — `.trim()` on both Supabase env vars (PR #16).
- Live Supabase DB (not in git): `game_results`/`events` INSERT policies
  re-applied by the founder directly in the SQL Editor.
- Vercel env vars (not in git): `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and
  `NEXT_PUBLIC_SUPABASE_URL`) re-pasted cleanly by the founder, redeployed.

## External state (not in git, important for the next agent to know)
- **Supabase project** is live (`jamrubutlvsfvmqwhbpr`), Anonymous Sign-ins enabled.
- **Vercel** is connected to GitHub repo and auto-deploys `main`.
- **GitHub branch protection on `main`** is strict: required status checks must pass before merge.
- Both known production issues above are now resolved and confirmed live.
- The two-real-phones manual reconnection check (M1) has **still** never
  been performed — the only remaining open item from M1/M2's "Done when"
  criteria. Not blocking, but do it before assuming the platform's
  resilience story (host migration, reconnection) is proven beyond
  unit tests.

## Pending Tasks
- None specced yet.

## Next Suggested Task
- Do the two-real-phones reconnection check (kill one phone's connection
  mid-match, confirm it rejoins via its `user_id` without losing its role).
- Start M3 — Who Am I (`docs/ROADMAP.md`) — second game, deliberately
  chosen to stress-test that the platform is "just implement a new
  GameModule." If it isn't, that's a signal ADR-0002 needs revisiting, not
  a reason to patch around it.
