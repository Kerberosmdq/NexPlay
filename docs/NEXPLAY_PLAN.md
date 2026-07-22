# NexPlay — Master Plan (v1.0)

> **Status:** Ratified. This is the source of truth for what NexPlay is, how
> it is built, and how multiple AI agents collaborate on it without colliding.
> Architecture detail is formalized in ADR-0001/0002/0003
> (`docs/00_decisions/architecture/`). The milestone roadmap is maintained
> as a living document in `docs/ROADMAP.md` (this file's §6 is the original
> proposal; treat `ROADMAP.md` as current). Open ideas not yet scheduled go
> in `docs/BACKLOG.md`.

---

## 1. Vision (one paragraph)

NexPlay is a mobile-first web app for playing original party and logic games
together — starting with one family, designed to eventually welcome the world.
Every game runs in the browser (no install, no account), works on one phone
passed around **or** across many phones in the same room, and is built to feel
crafted, distinctive, and kid-friendly. NexPlay is the first product of the Nex
identity: a hexagon-marked family of thoughtfully made digital experiences.

**Primary users today:** a parent and two children (ages 7 and 9), plus guests.
**Future users:** any family or group of friends.

---

## 2. Scope

### In scope for v1
- A reusable **game platform** (rooms, players, device modes, real-time sync).
- Three games on top of that platform:
  1. **Impostor** (word + secret role, optional clue).
  2. **Who Am I** (guess your own hidden word by asking questions).
  3. **Battleship** (1 vs 1 board game).
- **Two device modes** for every game where it makes sense:
  - **Single-device** ("pass-and-play"): one phone, reveal-and-pass flow.
  - **Multi-device**: each player joins a room by code on their own phone.
- Internationalization (i18n) from day one (Spanish + English).
- A distinctive visual identity and design system.
- Free hosting and free infrastructure.

### Explicit non-goals for v1 (do NOT build these yet)
- No user accounts, passwords, or login. Entry is name + room code only.
- No other Nex products (NexFinance, NexHome, etc.). Not now.
- No monetization, ads, or payments.
- No native mobile app (web only; it works on phones via the browser).
- No public leaderboards, friend systems, or persistent profiles.
- No AI-generated gameplay content at runtime.

> **Rule for all agents:** if a task would touch a non-goal, stop and ask.
> Non-goals exist to keep everyone pointed at the same horizon.

---

## 3. The Shared Platform (the "base")

All games plug into one platform. This is the most important technical decision:
we build the shared machinery **once**, and each game is a small module on top.

### 3.1 Shared primitives
- **Room / Lobby** — created by a host, joined via a short code (e.g. `4F7K`).
- **Player roster** — names, ready state, host flag.
- **Device mode** — `single-device` or `multi-device`, chosen at room creation.
- **Game lifecycle** — the same phases for every game:
  `lobby → configure → in-round → interlude → results → (repeat or end)`.
- **Per-device private state** — what only *you* see (your word, your role).
- **Real-time sync** — votes, phase changes, eliminations propagate live.
- **Localization** — every string and every game's content is translatable.

### 3.2 The Game Module contract
Every game implements the **same interface** so the platform treats them
uniformly. Draft shape (to be finalized in an ADR before parallel work starts):

```
GameModule {
  id: string                       // "impostor" | "who-am-i" | "battleship"
  meta: { name, minPlayers, maxPlayers, supportedModes }
  config: ConfigSchema             // host-facing options (rounds, timer, clue...)
  content?: LocalizedContentPack   // categories, words, images
  setup(players, config): GameState
  reducer(state, action): GameState   // pure, testable
  views: { host, player, singleDevice } // how each screen renders a phase
}
```

Why this matters: a new game becomes "implement one module," not "reinvent
rooms, sync, and screens." It is also what keeps every game feeling like the
same product. **Define this contract first; it is the seam that lets multiple
agents work in parallel without colliding.**

### 3.3 Device-mode flows (concrete)
- **Single-device (Impostor example):** host enters player names → first player
  taps *Reveal* → sees word or "You are the impostor" → taps *Next* → hands the
  phone over → next player reveals. The platform owns this pass-and-reveal loop
  so every game reuses it.
- **Multi-device (Impostor example):** host creates room → others join by code →
  each phone privately shows that player's word/role → rounds, voting and
  eliminations sync live across devices.

---

## 4. Technology (all free tiers)

| Concern            | Choice                        | Why |
|--------------------|-------------------------------|-----|
| Language           | TypeScript                    | Type-safe contracts across many agents. |
| Framework          | Next.js (React)               | Mobile-first web, great DX, free on Vercel. |
| Styling            | Tailwind + custom design tokens | Fast, but themed to *avoid* the generic look. |
| Real-time / rooms  | Supabase Realtime (Broadcast + Presence) | Free tier, purpose-built for lobbies/sync. |
| Local game state   | Zustand                       | Simple, predictable, testable. |
| i18n               | next-intl                     | First-class localization from day one. |
| Testing            | Vitest (unit) + Playwright (e2e) | Reducers and flows must be provable. |
| Hosting            | Vercel (app) + Supabase (backend) | Both free at this scale. |
| CI                 | GitHub Actions                | Lint, typecheck, test on every PR. |

> Firebase is a valid alternative to Supabase. Recommendation is Supabase
> because its Presence/Broadcast model maps cleanly onto lobbies and needs no
> accounts. This is the one stack choice worth confirming before M0.

---

## 5. Design & distinctiveness (the "your touch" part)

The goal: **not** look like a generic AI-generated app. This is a deliberate,
documented design language — kept as *guidance*, not dogma.

- **Identity:** the Nex hexagon is the anchor. Each game reinterprets the
  *inside* of the hexagon while the outer shape stays constant.
- **Design tokens first:** one source of truth for color, type, spacing, radius,
  motion. Every screen consumes tokens — no ad-hoc styling. This is what makes
  ten screens built by five agents feel like one product.
- **Motion & feedback:** deliberate transitions on reveal, vote, elimination.
  The "reveal" moment in Impostor should feel like an event, not a page load.
- **Kid-aware:** large tap targets, high contrast, minimal reading load. Support
  words-with-images so the 7-year-old plays on equal footing with the 9-year-old.
- **A living "Feel" doc** (`docs/04_design/`) captures the personality in words
  and examples so every agent designs toward the same vibe.
- **Original, not trendy-by-default:** avoid defaulting to glassmorphism or
  stock dashboard aesthetics *because they are the AI default*, not because any
  single style is banned. Distinctiveness is the requirement; the specific
  direction is a design decision, explored (2–3 quick options) for signature
  screens, then committed.

---

## 6. Roadmap (milestones, each one shippable)

- **M0 — Foundations.** Repo hygiene, Next.js + TS scaffold, design tokens, i18n
  wiring, CI, and the ADRs that lock the stack and the Game Module contract.
  *Done when:* the empty app deploys to Vercel and CI is green.
- **M1 — Platform walking skeleton.** Create/join room by code; single-device and
  multi-device both work; two phones sync in real time; lobby → results loop with
  a trivial placeholder game.
  *Done when:* two devices join a room and see synced state end to end.
- **M2 — Impostor.** First real game, both device modes, categories + words (with
  images), optional clue, timers, voting, elimination reveal.
  *Done when:* the family can play a full Impostor match on real phones.
- **M3 — Who Am I.** Second game. *Purpose:* prove the platform is truly reusable
  — this should be mostly "a new module," not new plumbing.
- **M4 — Battleship.** 1 vs 1 board game. *Purpose:* prove the platform stretches
  beyond word games.
- **M5 — Presentable.** Landing page, polish, accessibility pass, full ES/EN,
  ready to show the world.

> Games ship one at a time. We do not start M3 until M2 is genuinely playable.

---

## 7. How multiple AI agents work together

This is the coordination layer you asked for. It is intentionally lightweight —
enough to keep agents in sync, not enough to become a second job.

### 7.1 Sources of truth (read before any task)
1. `docs/NEXPLAY_PLAN.md` — this file (the horizon).
2. `docs/09_ai/CURRENT_STATE.md` — what is done, in progress, and next.
3. The task spec for the assigned task.
4. Relevant ADR(s) for the area being touched.

### 7.2 The six working rules (replaces the 10-article "constitution")
1. **Never work on `main`.** One task = one branch (`feat/…`, `fix/…`, `docs/…`).
2. **Stay in scope.** Build exactly the task's definition of done — no extra
   features, no refactors outside the task, no touching non-goals. When in doubt,
   ask; do not improvise.
3. **Contracts before parallel work.** Shared interfaces (Game Module contract,
   room API, design tokens) are decided in an ADR *before* multiple agents build
   against them. Changing a contract is its own task, not a side effect.
4. **Document decisions, not everything.** A real decision → an ADR/PDR. Routine
   work → a short journal entry. No ceremony for ceremony's sake.
5. **Leave the repo better and truthful.** Tests and typecheck pass; the git
   history matches what the state files claim.
6. **Hand off cleanly.** Every finished task updates `CURRENT_STATE.md` and
   `HANDOFF.md` so the next agent starts where you stopped.

### 7.3 Task specs (how work is assigned)
Each task is a small, self-contained spec (see `docs/08_templates/TASK_TEMPLATE.md`)
with: goal, scope boundaries (in/out), files allowed to change, definition of
done, and how to verify. Small tasks with hard boundaries are what keep agents
from stepping on each other.

### 7.4 Conventions (so all output looks like one author)
A `docs/05_engineering/` conventions doc fixes: folder structure, naming, commit
format, component patterns, and "definition of done." Agents follow it instead of
inventing their own style — this is the single biggest lever against the
"every-AI-app-looks-the-same-but-inconsistent" problem.

---

## 8. What we keep vs. cut from the ChatGPT scaffold

| Keep (valuable)                                  | Cut / defer (premature) |
|--------------------------------------------------|--------------------------|
| Documentation-first + decision records (ADR/PDR) | The "Nex ecosystem" doc with 4 future products |
| AI onboarding + `CURRENT_STATE` / `HANDOFF`      | The 10-article "constitution" (trimmed to §7.2) |
| Numbered docs structure (00–09)                  | Empty stub folders until they have real content |
| English repo + i18n from day one                 | Rigid design bans stated as law |
| Nex identity + hexagon (gives distinctiveness)   | Corporate roles ("Chief Architect") for a solo project |
| Task templates                                   | Any planning that outpaces the first playable game |

---

## 9. Immediate next steps (before writing feature code)

1. **Confirm the stack** (§4) — especially Supabase vs Firebase.
2. **Reconcile reality:** make the first git commit; align branch names with the
   state files so §7.2 rule 5 is actually true.
3. **Write the two founding ADRs:** ADR-0001 (stack) and ADR-0002 (Game Module
   contract). These are the seams that let agents work in parallel.
4. **M0 kickoff:** scaffold the app, deploy an empty version, turn CI green.

Only after 1–4 do agents start building M1.
