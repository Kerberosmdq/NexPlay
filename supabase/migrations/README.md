# Supabase Migrations

SQL migrations for the durable schema (`users`, `game_results`, `events` —
ADR-0001 §3). Row Level Security is enabled from the first migration
(ADR-0003). No other durable tables are added without an ADR update.
