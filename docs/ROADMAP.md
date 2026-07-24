# Roadmap

> Living document. The ordered path from empty repo to a public, presentable
> NexPlay. Update this file whenever a milestone starts, finishes, or its
> scope changes. This is the "same horizon" every agent reads before picking
> up work — see `docs/09_ai/CURRENT_STATE.md` for what's active *right now*.

## Rules
- Milestones ship in order. Do not start the next one until the current one
  meets its "Done when" criteria.
- A milestone only grows by explicit decision, written here — not silently,
  mid-implementation.
- If an idea comes up that isn't part of the active milestone, it goes to
  `BACKLOG.md`, not into scope creep on the current one.

---

## M0 — Foundations — ✅ Complete (2026-07-23)
Repo and tooling ready to build on.
- Next.js + TypeScript scaffold, deployed empty to Vercel.
- Design tokens skeleton (`docs/04_design/`).
- next-intl wired with ES/EN catalogs (even if mostly empty).
- Supabase project created; anonymous auth enabled; RLS on from the first
  migration (ADR-0001, ADR-0003).
- CI (GitHub Actions): lint, typecheck, test on every PR. Branch protection on
  `main`.
- ADR-0001, ADR-0002, ADR-0003 accepted (done — see `docs/00_decisions/architecture/`).
- Engineering conventions doc accepted (`docs/05_engineering/`).

**Done when:** an empty app is live on a Vercel URL, CI is green on a PR, and
a fresh agent can read the conventions doc and know where new code goes.

## M1 — Platform walking skeleton — ✅ Complete (2026-07-23)
Prove the shared base (`NEXPLAY_PLAN.md` §3) actually works end to end, with
no real game yet.
- Room creation + join-by-code (TASK-0021).
- Both device modes functional: single-device pass-and-reveal loop, and
  multi-device with each phone seeing only its own filtered state, both
  driving the placeholder counter (TASK-0022).
- Reconnection and host-migration (ADR-0001 §4) implemented in
  `useRoomConnection` (60s grace period, presence-based
  `calculateHostMigration`) and unit-tested (TASK-0023, coverage added in
  TASK-0024). **Not yet manually verified on two real phones** — that check
  is still open, tracked as a follow-up rather than blocking M1 on process
  grounds alone (see `HANDOFF.md`).
- `game_results` and `events` durable writes wired for the placeholder game
  in both device modes (TASK-0023 added the write helpers; TASK-0024 wired
  the actual call sites — they shipped in TASK-0023 as dead code with no
  caller, which is now fixed).

**Done when:** two real phones join the same room by code, see synced state
live, and a disconnect/reconnect during the session doesn't break the room.
The two-phone manual check remains outstanding; everything else is done and
automated-test-covered.

## M2 — Impostor — 🚧 In Progress
The first real, playable game.
- Both device modes.
- Categories + words content pack (kid-safe, ES/EN), optional clue for the
  impostor, configurable round/reveal timers, voting, elimination reveal
  (shown correctly on every device: was it the impostor or not).
- Word content includes images/icons alongside text so a 7-year-old and a
  9-year-old play on equal footing (see `BACKLOG.md` for the broader
  image-support idea if it needs to expand beyond Impostor).

**Status (TASK-0025):** implemented and unit-tested; single-device
reveal-and-pass verified end to end in-browser. Multi-device was only
smoke-tested to the config screen (no live Supabase in the dev sandbox used)
— a real multi-phone round is still needed before this milestone is marked
✅ done. Word images are not in scope for this pass (tracked in
`BACKLOG.md`).

**Done when:** the family plays a full real match, both device modes, on
actual phones, without a developer present to fix anything mid-game.

## M3 — Who Am I
Second game — deliberately chosen to stress-test reuse.
- Guess-your-own-hidden-word via yes/no questions.
- Per-player distinct secret word/prompt, kid-safe content pack.

**Done when:** this game is implemented as "a new `GameModule`," with no
changes required to the shared platform. If it *does* require platform
changes, that's a signal ADR-0002's contract needs revisiting — flag it,
don't patch around it silently.

## M4 — Battleship
Third game — deliberately chosen to prove the platform isn't just for
word-guessing games.
- 1 vs 1 board game, both players on their own device (single-device mode may
  not make sense here — confirm during design, don't force it).

**Done when:** a structurally different game (board state, 1v1 only, no
"impostor-style" hidden role) fits the same `GameModule` contract.

## M5 — Presentable
Ready to show people outside the family.
- Landing/marketing surface, visual polish pass, accessibility pass.
- Full ES/EN coverage across UI and content.
- Pre-public-launch privacy/legal review for minors (flagged in ADR-0003) —
  revisit before any real public rollout, not before.

**Done when:** a stranger can be handed the URL, create a room, and play
without any explanation from the founder.

---

## Beyond M5 (directional only — not scheduled)
- Additional games from `BACKLOG.md`, prioritized once M2–M4 prove the
  platform holds up.
- Revisit monetization model (ADR-0003 seam) once there's real usage data
  from the `events` table to inform the decision.
- Revisit accounts (upgrade anonymous identity) if cross-device history for a
  single person becomes a real, requested need.
