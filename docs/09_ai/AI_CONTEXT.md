# Permanent AI Context

## Purpose
Summarizes permanent system architecture, core domain knowledge, and ecosystem rules that every AI Developer working on NexPlay should know.

## System Identity
NexPlay is a mobile-first web app for playing original party/logic games,
built on one shared platform (rooms, device modes, realtime sync) that every
game plugs into. First product of the Nex identity (hexagon mark). Full
vision and scope: `docs/NEXPLAY_PLAN.md`.

## Architectural Stack
Next.js + TypeScript, Tailwind on design tokens, Zustand, next-intl, Vitest +
Playwright, hosted on Vercel. Backend: Supabase (Postgres + Realtime +
Anonymous Auth). Full rationale: `docs/00_decisions/architecture/ADR-0001-STACK-AND-PERSISTENCE.md`.

## Core Architectural Contracts
- **Persistence boundary** (ephemeral Realtime vs. durable Postgres:
  `users`, `game_results`, `events` only) — ADR-0001 §3.
- **Realtime resilience** (identity-based reconnection, host migration,
  bounded grace period, room TTL) — ADR-0001 §4.
- **GameModule contract** (every game implements the same interface; platform
  owns rooms/sync/device-modes, game owns rules/config/content/views) —
  ADR-0002.
- **Scalability seams** (anonymous identity → future accounts, `events` →
  future analytics, generic entitlements → future monetization, locale
  catalogs + repo-versioned content packs → future languages) — ADR-0003.

## Ecosystem Governance
Six working rules replace the original 10-article constitution's ceremony
(full rationale in `docs/NEXPLAY_PLAN.md` §7.2): never work on `main`; stay in
scope (non-goals are binding, see `NEXPLAY_PLAN.md` §2); shared contracts are
decided via ADR before parallel work starts on them; document real decisions,
not routine work; keep the repo truthful (tests pass, git history matches
state docs); hand off cleanly via `CURRENT_STATE.md`/`HANDOFF.md`. Naming,
folder structure, and Definition of Done: `docs/05_engineering/CONVENTIONS.md`.

## Permanent Design Rules
- One design-tokens source of truth; no component hardcodes raw color/spacing.
- Distinctiveness is a requirement, not a specific banned style — avoid
  defaulting to generic/trendy patterns because they're the AI default, not
  because any one style is outlawed by decree.
- Kid-aware by default: large tap targets, high contrast, low reading load;
  support word+image content so younger players (age ~7) play evenly with
  older ones (age ~9).
- Full design language: `docs/NEXPLAY_PLAN.md` §5 (living detail moves to
  `docs/04_design/` once M0/M1 produce real design artifacts).

## Privacy Posture (binding, not a suggestion)
No PII; anonymous auth only; display names are ephemeral (Realtime-only,
never written durably); analytics events are enums/numbers only; no
third-party analytics SDKs; RLS on from the first migration. Full detail:
ADR-0003.
