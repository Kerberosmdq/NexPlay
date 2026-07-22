---
id: ADR-0003
title: Scalability and Privacy Seams
status: Accepted
version: 1.0.0
category: Architecture Decision Record

authors:
  - Miguel Giles (Founder & Product Owner)
  - Claude (AI Architect)

created: 2026-07-22
updated: 2026-07-22

language: English

depends_on:
  - ADR-0001
  - ADR-0002

required_by: []

tags:
  - architecture
  - scalability
  - privacy
  - i18n
  - monetization
---

# ADR-0003 — Scalability and Privacy Seams

## Status
Accepted.

## Context
NexPlay starts as a game for one family but is explicitly intended to scale
to: counting/measuring usage, monetization, more languages, and eventually
public users including other people's children. None of that is built in v1.
The governing principle of this ADR:

> **Scalable means the seams exist from day one. It does not mean the future
> features are built now.** Building them early would repeat the exact
> over-planning mistake already identified and rejected in `NEXPLAY_PLAN.md`.

Each seam below is designed so the corresponding future feature is "wire it up
and turn it on," never "redesign the system."

## Decision

### Seam 1 — Identity (enables future accounts/usage-counting)
Every device gets a **Supabase Anonymous Auth** identity on first use — no
email, no password, no visible login screen. The child types a display name;
underneath, a durable, stable `user_id` already exists.
- This `user_id` is the key used for Realtime reconnection (ADR-0001 §4).
- The day real accounts are wanted, Supabase's anonymous-to-permanent upgrade
  attaches an email/provider to the *same* `user_id` — every table and every
  reference keyed on `user_id` needs zero migration.
- **v1 does not build:** login UI, profile pages, password reset, or any
  account-facing surface. The seam is the identity row existing, nothing more.

### Seam 2 — Analytics (enables future "how many people use this")
A durable `events` table records domain events only:
`room_created`, `game_started` (game id, mode, player count),
`game_finished` (duration, outcome). All access goes through one `track(event)`
function so the underlying store (self-hosted in this Supabase project, per
the privacy decision below) can change later without touching call sites.
- **v1 does not build:** dashboards, retention reports, or funnels — just the
  writes. Reporting is a query written when someone wants an answer, not
  infrastructure built speculatively now.
- Exact event taxonomy is a small, low-risk decision deferred to `BACKLOG.md`
  and finalized at M1 — it does not block architecture.

### Seam 3 — Entitlements (enables future monetization, model undecided)
Per the founder's explicit choice, no monetization model is picked yet. The
seam is a single, generic, server-side check:

```ts
function getEntitlements(userId: string): Entitlements
// v1: always returns "everything unlocked"
```

Every place that might one day gate a feature (a game, a content pack) calls
this function instead of hardcoding "always allowed." Turning on any future
model (pack purchases, feature unlocks, ads, donations — all were left open)
is changing what this function returns and adding a payment provider, not
touching call sites throughout the app.
- **v1 does not build:** any payment integration, pricing, or paywall UI.

### Seam 4 — Localization (enables future languages beyond ES/EN)
Two independent layers, both externalized from code:
- **UI strings:** next-intl catalogs, one file per locale.
- **Game content:** per the founder's choice, content is **curated by us, not
  user-generated**, and lives as versioned, typed files in the repo
  (`content/<game>/<locale>.ts` or equivalent), not in the database. Adding a
  language is adding files and opening a PR — never touching game logic or
  UI components. This directly supports the "add categories/words via PR"
  workflow already established as the review path for game content.
- **Hard rule for all agents:** no user-facing string and no game word/prompt
  may be hardcoded inside a component, reducer, or view. If it's visible to a
  player, it comes from a locale catalog or a content pack.

### Privacy posture: strict (explicit founder decision)
Given the primary players are children (ages 7 and 9) and the product may
become public, the following are binding constraints, not suggestions:
- **No PII, ever, in v1.** Anonymous auth only; no email/phone/birthdate
  collected.
- **Display names are ephemeral.** A name a player types for a session lives
  only in Realtime state (ADR-0001 §3) and is **never** written to any durable
  table, including `events`. A child's name never touches Postgres.
- **`events` contains only enums and numbers.** No free text, no names, no
  identifiers beyond the anonymous `user_id`.
- **Analytics stays first-party.** Events are stored in this project's own
  Supabase Postgres. No third-party analytics SDK (e.g. hosted PostHog,
  Google Analytics) is integrated in v1 — there is nothing to disclose to a
  processor because nothing leaves the project.
- **Rooms and their Realtime state expire** (ADR-0001 §4); nothing lingers.
- **Row Level Security is enabled from the first migration**, even while the
  durable surface is minimal — this is a default posture, not a reaction to a
  specific threat.

### Deferred, flagged for pre-public-launch review (not v1 blockers)
If NexPlay opens to the public with minors as users, real legal obligations
apply (e.g. COPPA in the US, GDPR-K in the EU) potentially including
verifiable parental consent and age-gating. This ADR's strict-by-default
posture is deliberately chosen because it makes that future review cheap —
but the review itself is out of scope until M5 ("Presentable") is approached
with real public rollout in mind. Tracked in `BACKLOG.md`.

## Consequences
- **Positive:** every future ask the founder listed (usage counting,
  monetization, more languages) has a defined attachment point today, at
  effectively zero build cost in v1.
- **Positive:** the strict privacy posture is also the cheapest posture
  (minimal data = minimal infrastructure = minimal compliance surface) — there
  is no tradeoff being made against cost or speed here.
- **Negative:** anonymous-only identity means no cross-device history for a
  single person until real accounts exist (accepted, consistent with ADR-0001).

## Alternatives Considered
- **Third-party analytics (PostHog Cloud, Mixpanel, GA) now:** rejected — adds
  a data processor and an external dependency for a feature (dashboards) not
  needed yet; conflicts with the strict/first-party privacy decision.
- **User-generated content packs in v1:** rejected per founder's explicit
  choice — would require DB-backed content, permissions, and moderation
  before there is any user base to justify it. Revisit if `BACKLOG.md` promotes
  it to a milestone.
- **Deciding a monetization model now:** rejected per founder's explicit
  choice — the generic entitlements seam avoids locking in a model prematurely
  while still leaving the attachment point ready.

## Related Documents
- `docs/NEXPLAY_PLAN.md`
- ADR-0001 — Stack and Persistence Boundary
- ADR-0002 — GameModule Contract
- `docs/BACKLOG.md`

## Changelog
### Version 1.0.0
- Initial accepted version.
