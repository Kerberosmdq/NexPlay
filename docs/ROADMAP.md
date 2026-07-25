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

## M2 — Impostor — ✅ Complete (2026-07-24)
The first real, playable game.
- Both device modes.
- Categories + words content pack (kid-safe, ES/EN), optional clue for the
  impostor, configurable round/reveal timers, voting, elimination reveal
  (shown correctly on every device: was it the impostor or not).
- Word content includes images/icons alongside text so a 7-year-old and a
  9-year-old play on equal footing (see `BACKLOG.md` for the broader
  image-support idea if it needs to expand beyond Impostor — deferred, not
  in scope for this milestone).

**Status:** implemented, unit-tested (25 tests), and playtested by the
founder end to end on a live production deployment across 4+ real devices
— full multi-round match (elimination, turn-based discussion, scoring,
celebration screen, alive/eliminated roster) all confirmed working. A
production bug found during this playtesting (Realtime connection hanging
forever due to a trailing newline in a Vercel env var) was fixed along the
way; see `HANDOFF.md` for the full story. Word images remain out of scope
for this milestone (tracked in `BACKLOG.md`).

**M1's two-real-phones reconnection check is still outstanding** — tracked
separately, not blocking M2, but worth doing before considering the
platform's resilience story fully proven.

**Done when:** the family plays a full real match, both device modes, on
actual phones, without a developer present to fix anything mid-game.

## M3 — Who Am I — 🚧 Implemented, pending founder playtest
Second game — deliberately chosen to stress-test reuse.
- Guess-your-own-hidden-word via yes/no questions.
- Per-player distinct secret word/prompt, kid-safe content pack.

**Done when:** this game is implemented as "a new `GameModule`," with no
changes required to the shared platform. If it *does* require platform
changes, that's a signal ADR-0002's contract needs revisiting — flag it,
don't patch around it silently.

**Status:** built exactly to that bar — zero changes to `lib/types/room.ts`,
`platformReducer.ts`'s logic, `useRoomConnection.ts`, or Impostor; only an
additive registry line and one lookup-table entry (the game already
documented as an extension point). Design was worked out with the founder
in conversation before any code (rotating-turn questions + anytime
self-reported guessing, shared/per-turn timer, Heads-Up-style
single-device, own word bank with emoji). 15 unit tests; playtested
locally end to end in single-device, multi-device only smoke-tested to the
lobby (no live Supabase in the dev sandbox). **Not yet playtested by the
founder on real devices** — do that before marking this milestone ✅.

## M3.5 — Design System & Visual Identity — 🚧 Started (2026-07-24)
**Explicit scope decision, written here per the rule below** (not silent
scope creep): a full UX/UI audit of M0–M3 as shipped found the app has no
enforced visual system — `app/tokens.css` has zero consumers, 43 raw hex
values are hand-written across 7 files, the same button is implemented six
different ways, the entry screen fails WCAG AA contrast in six places, and
the Impostor reveal — the plan's own example of a moment that "should feel
like an event" — references an animation class from a package that isn't
installed. This milestone exists to fix the *foundation*, not just repaint
screens, before M4 (Battleship) adds a third game's worth of UI on top of
the same cracks.

This does **not** block or get blocked by M3's still-outstanding founder
playtest of multi-device Who Am I, or M1's still-outstanding two-real-
phones reconnection test — both remain open, tracked independently (see
Known Issues in `docs/09_ai/CURRENT_STATE.md`).

- **Paperwork (TASK-0027, done):** `BDR-0001` (visual direction: Paper &
  Felt, with a penumbra treatment reserved for secret reveals — three
  directions explored per Article 10) and `ADR-0004` (semantic tokens,
  mandatory `components/ui/` primitives, a named motion vocabulary,
  contrast checked by unit test) accepted; `docs/04_design/FEEL.md`
  written.
- **Code task 1 — System:** implement `ADR-0004`'s tokens and primitive
  set; port the *existing* 6 views to them with no visual change yet, to
  prove the system holds what already exists before it's asked to hold
  something new.
- **Code task 2 — Direction:** apply `BDR-0001`'s Paper & Felt direction
  (and the penumbra reveal) screen by screen.
- **Code task 3 — Identity & polish:** the real Nex hexagon (favicon, PWA
  manifest + icons so the app installs to a home screen), a visible
  language switcher (retiring the bilingual labels this same audit found
  in `RoomLobby.tsx`), copy/share for the room code, and an accessibility
  pass against `ADR-0004`'s contrast tests.

**Done when:** all 6 existing views run on the new tokens/primitives with
no raw hex literals outside `components/ui/`, the reveal moment actually
animates, contrast tests pass for every action/text token pair, and the
hexagon appears as the app's icon.

## M4 — Battleship
Third game — deliberately chosen to prove the platform isn't just for
word-guessing games. Built on top of M3.5's system, not the pre-M3.5 UI.
- 1 vs 1 board game, both players on their own device (single-device mode may
  not make sense here — confirm during design, don't force it).

**Done when:** a structurally different game (board state, 1v1 only, no
"impostor-style" hidden role) fits the same `GameModule` contract.

## M5 — Presentable
Ready to show people outside the family. Its "visual polish pass" was
originally scoped here; M3.5 moved the foundational part of that work
earlier (see above) because it was blocking distinctiveness for M4 and
beyond, not because M5 itself changed shape. What's left for M5 is the
outward-facing layer built *on* M3.5's system:
- Landing/marketing surface.
- Full ES/EN coverage across UI and content (the visible language switcher
  ships in M3.5; this is the remaining content-completeness pass).
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
