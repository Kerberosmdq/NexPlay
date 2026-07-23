# TASK-0020: Anonymous identity on first load

### Goal
The platform needs every device to have a stable, durable identity before
any room/realtime work can happen (ADR-0001 §4 reconnection depends on it;
ADR-0003 Seam 1 defines the identity model). This task wires Supabase
Anonymous Auth so a `user_id` is issued and persisted on first app load,
with no visible login UI. It is the first slice of M1 (`docs/ROADMAP.md`).

### Scope — in
- A Supabase client factory in `lib/auth/` (browser client, using
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- On first load, if no active Supabase session exists, sign in anonymously
  (`supabase.auth.signInAnonymously()`) and persist the resulting session
  (Supabase's client handles persistence to `localStorage` by default).
- On subsequent loads, reuse the existing anonymous session instead of
  creating a new one.
- Insert the corresponding row into the durable `public.users` table on
  first sign-in (id = the auth user's id), matching the migration in
  `supabase/migrations/20260723000000_init_schema.sql`.
- A unit test for any pure logic extracted (e.g. "do we already have a
  session" decision), using a mocked Supabase client — no real network
  calls in tests.

### Scope — out (non-goals for this task)
- No room creation, no join-by-code, no Realtime wiring — that's the next
  task in M1.
- No UI for this beyond what's strictly needed to prove it works (e.g. no
  dedicated "your ID" screen). A temporary, removable debug line is
  acceptable if it helps verification, but should not be presented as a
  real feature.
- No changes to the database schema or RLS policies — the existing
  migration already covers this.
- No account upgrade flow (anonymous → real account) — deferred per
  ADR-0003, not part of v1.

### Files this task may touch
- `lib/auth/**` (new files)
- `app/[locale]/**` only if a minimal call-site is needed to trigger
  sign-in on load (keep this change minimal)
- `tests/unit/**` (new test file(s) for this task only)
- `package.json` / `pnpm-lock.yaml` only to add `@supabase/supabase-js`

Do not touch `games/`, `components/`, design tokens, i18n catalogs, or any
ADR/doc other than `CURRENT_STATE.md`/`HANDOFF.md` at handoff time.

### Relevant context
- ADR-0001 (`docs/00_decisions/architecture/ADR-0001-STACK-AND-PERSISTENCE.md`)
  §3 (persistence boundary) and §4 (reconnection is identity-based).
- ADR-0003 (`.../ADR-0003-SCALABILITY-AND-PRIVACY-SEAMS.md`) Seam 1 (identity)
  and the privacy posture (no PII, ever).
- `lib/auth/README.md` (already describes this folder's purpose).
- `.env.local` already has real Supabase credentials for local dev/testing
  (gitignored; not present if this task runs from a fresh clone — in that
  case, ask the founder for the values rather than inventing placeholders).

### Definition of Done
- Matches `docs/05_engineering/CONVENTIONS.md`'s Definition of Done in full.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run test` all pass.
- No hardcoded Supabase URL/key — only via env vars.
- `CURRENT_STATE.md` and `HANDOFF.md` updated.
- Branch pushed, PR opened, CI green, merged via PR (branch protection on
  `main` requires this — see `docs/09_ai/AI_ONBOARDING.md` Git Rules).

### How to verify
1. `pnpm dev`, load the app in a browser with dev tools open.
2. Confirm a Supabase session now exists (e.g. check `localStorage` for the
   Supabase auth token key, or log the session id once during development —
   remove any debug logging before finishing).
3. Reload the page; confirm the same `user_id` persists (no new sign-in).
4. In the Supabase dashboard's Table Editor, confirm exactly one new row
   appeared in `public.users` for that session, with no PII in it.
5. `pnpm run test` covers the pure "reuse vs. create session" decision.
