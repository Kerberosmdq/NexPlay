-- Initial durable schema (ADR-0001 §3, ADR-0003).
-- These are the ONLY three durable tables in v1. No new durable table may be
-- added without amending ADR-0001 first.
--
-- Privacy posture (ADR-0003): no PII is ever stored here. Display names are
-- ephemeral (Realtime-only) and must never be written to any of these tables.

-- users: one row per anonymous Supabase Auth identity. No profile data.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users can insert their own row"
  on public.users for insert
  to authenticated
  with check (id = auth.uid());

create policy "users can read their own row"
  on public.users for select
  to authenticated
  using (id = auth.uid());

-- game_results: one summary row per finished match. Never the play-by-play.
create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  mode text not null check (mode in ('single-device', 'multi-device')),
  player_count integer not null check (player_count > 0),
  duration_seconds integer not null check (duration_seconds >= 0),
  outcome text,
  created_at timestamptz not null default now()
);

alter table public.game_results enable row level security;

-- Insert-only from the client. No select policy: reads happen via the
-- Supabase dashboard / service role, never through the public API
-- (ADR-0003 — reporting is a query written on demand, not exposed client-side).
create policy "authenticated clients can record a game result"
  on public.game_results for insert
  to authenticated
  with check (true);

-- events: anonymous analytics events. Enums and numbers only — no free text,
-- no names, no identifiers beyond the anonymous user_id (ADR-0003).
create table if not exists public.events (
  id bigint generated always as identity primary key,
  event_name text not null check (event_name in ('room_created', 'game_started', 'game_finished')),
  game_id text,
  mode text check (mode in ('single-device', 'multi-device')),
  player_count integer,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "authenticated clients can record an event"
  on public.events for insert
  to authenticated
  with check (true);
