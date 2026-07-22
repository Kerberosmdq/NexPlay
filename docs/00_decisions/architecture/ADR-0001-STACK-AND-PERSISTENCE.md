---
id: ADR-0001
title: Stack Selection and Persistence Boundary
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
  - PDR-0001
  - NEXPLAY_PLAN

required_by:
  - ADR-0002
  - ADR-0003

tags:
  - architecture
  - stack
  - persistence
  - realtime
---

# ADR-0001 — Stack Selection and Persistence Boundary

## Status
Accepted.

## Context
NexPlay needs to run on any phone via the browser, support both single-device
("pass-and-play") and multi-device (room-code) modes, stay on free-tier
infrastructure, and be built by multiple AI agents working in parallel. That
last constraint means the stack must have clear, typed seams — ambiguity here
is what causes agents to collide.

## Decision

### 1. Application stack
- **Language:** TypeScript everywhere (app, shared logic, content packs).
  Types are the contract multiple agents check each other's work against.
- **Framework:** Next.js (React), mobile-first responsive layout.
- **Styling:** Tailwind CSS driven entirely by a design-tokens layer (see
  `docs/04_design/`). No component hardcodes a raw color/spacing value.
- **Client state:** Zustand for local/session state; kept separate from
  real-time room state (see below).
- **i18n:** next-intl for UI strings. Game content localization is a separate
  concern, addressed in ADR-0003.
- **Testing:** Vitest for game reducers and pure logic (these must be provable
  independent of UI); Playwright for end-to-end room/device-mode flows.
- **Hosting:** Vercel, free tier.

### 2. Backend: Supabase
Supabase is chosen over Firebase for one deciding reason: its
**Presence + Broadcast** primitives map directly onto "who's in this room and
what are they doing right now" without requiring any account system. Also:
Postgres (relational, easy to reason about for the small durable surface we
need), Row Level Security from day one, free tier sufficient at family/friends
scale, and native support for **anonymous auth that upgrades to a real account
later** (load-bearing for ADR-0003).

### 3. The persistence boundary (the core decision)
Every piece of state in NexPlay is classified as either **ephemeral** or
**durable**. This split is the single most important architectural decision in
the system — it determines cost, latency, and privacy exposure.

**Ephemeral — lives only in Supabase Realtime (Broadcast + Presence), never
written to Postgres:**
- Room membership, who is connected/disconnected right now.
- In-round state: current phase, whose turn, votes-in-progress, timers.
- Private per-player state (a player's word, a player's secret role).
- Display names entered for a session.

**Durable — written to Postgres, survives the room:**
- `users` — one row per anonymous identity (see ADR-0003). No PII.
- `game_results` — one summary row per finished match (game id, mode, player
  count, duration, outcome). Never the play-by-play.
- `events` — anonymous analytics events (see ADR-0003). Enums and numbers only.

**Rule for all agents:** if you are about to persist something and cannot
name which of these three durable tables it belongs to, it is ephemeral by
default. Do not create new durable tables without an ADR update — this is the
boundary that keeps the system cheap, fast, and private.

### 4. Realtime resilience policy
Party games have players losing signal, switching apps, or putting the phone
down mid-round. The platform must tolerate this by default, per game, not as
an afterthought:

- **Reconnection is identity-based, not connection-based.** Every player holds
  a Supabase anonymous-auth `user_id` (see ADR-0003) for the session. Losing
  and regaining network re-attaches to the same room and the same private
  state via that `user_id` — no new join, no lost role.
- **The room, not a single device, is the source of truth.** A disconnected
  player's last-known state persists in Realtime Presence until they return or
  a timeout elapses; the round does not hard-fail because one phone dropped.
- **Host migration.** If the host disconnects, host status transfers
  automatically to the next-longest-connected present player. "Host" is a
  role attached to the room, not a permanent property of one device.
- **Bounded grace, not indefinite waiting.** Each game defines a short grace
  period (config default, e.g. ~60s) after which an absent player is marked
  out for that round so the group isn't blocked. Rejoining the room is always
  possible until the room itself expires.
- **Rooms expire.** An idle room (no activity) is cleaned up after a fixed TTL.
  Nothing about a finished or abandoned room lingers in Realtime state.

This policy lives in the shared platform (§3 of `NEXPLAY_PLAN.md`), not in
individual games — every `GameModule` inherits it for free.

## Consequences
- **Positive:** clear cost model (free tier holds easily at this scale), no
  login friction, reconnection "just works" for every game without each game
  reinventing it, privacy posture is simple because durable data is minimal.
- **Negative:** anonymous-only identity means cross-device history for a
  single person requires them to reuse the same device/browser storage (a
  fully acceptable tradeoff for v1; revisit if real accounts are introduced).
- **Follow-up:** the exact grace-period default and room TTL are tuning
  parameters, not architecture — set them in the platform config during M1,
  not in this ADR.

## Alternatives Considered
- **Firebase (Firestore + RTDB):** viable alternative; rejected only in favor
  of Supabase's cleaner Postgres story for durable data and equally strong
  presence primitives. Not a correctness issue — a preference given the
  relational data we do need (`game_results`, `events`).
- **Persisting full round-by-round history:** rejected for v1. Adds cost and
  privacy surface with no current product need; `game_results` summaries are
  enough to support future analytics/monetization seams (ADR-0003).
- **Socket.io / custom WebSocket server:** rejected — requires a server to
  host and operate; Supabase Realtime gives the same capability on the free
  tier with no ops burden.

## Related Documents
- `docs/NEXPLAY_PLAN.md`
- ADR-0002 — GameModule Contract
- ADR-0003 — Scalability and Privacy Seams

## Changelog
### Version 1.0.0
- Initial accepted version.
