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
  TASK-0024). **Confirmed on real phones (2026-07-27/28)**: the founder's
  family played an extended real session across multiple real devices with
  no reconnection failures reported — closing the manual-verification gap
  that had been open since M1 first shipped.
- `game_results` and `events` durable writes wired for the placeholder game
  in both device modes (TASK-0023 added the write helpers; TASK-0024 wired
  the actual call sites — they shipped in TASK-0023 as dead code with no
  caller, which is now fixed).

**Done when:** two real phones join the same room by code, see synced state
live, and a disconnect/reconnect during the session doesn't break the room.
Confirmed via the founder's family playing a real multi-device session with
no dropped-room incidents; everything else was already done and
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

**M1's two-real-phones reconnection check is now confirmed** (see M1 above,
2026-07-27/28) — the platform's resilience story is proven, not just
tested in isolation.

**Done when:** the family plays a full real match, both device modes, on
actual phones, without a developer present to fix anything mid-game.

## M3 — Who Am I — ✅ Complete (2026-07-28)
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
single-device, own word bank with emoji). 15 unit tests. **Founder-confirmed
(2026-07-27/28)**: the family played multi-device Who Am I extensively
during a real session alongside Battleship, with no bugs reported — closing
the last open item from this milestone.

## M3.5 — Design System & Visual Identity — ✅ Complete (2026-07-26)
**Explicit scope decision, written here per the rule below** (not silent
scope creep): a full UX/UI audit of M0–M3 as shipped found the app has no
enforced visual system — `app/tokens.css` has zero consumers, 43 raw hex
values are hand-written across 7 files, the same button is implemented six
different ways, the entry screen's two action buttons fail WCAG AA
contrast, and the Impostor reveal — the plan's own example of a moment that "should feel
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
- **Code task 1 — System (TASK-0028, done):** `app/tokens.css` rewritten as
  semantic paired tokens (the two real contrast failures fixed using hues
  already in the brand, verified live: 5.70:1 and 8.24:1); `app/motion.css`
  added with the four named gestures and a `prefers-reduced-motion`
  override; the full `components/ui/` primitive set built; a contrast unit
  test suite added (8 assertions, parses the real token file); all 6
  existing views ported with no visual change beyond the two contrast
  fixes. The Impostor reveal now actually animates
  (`animationName: "nx-reveal"`, verified live) — the audit's top finding,
  fixed for real.
- **Code task 2 — Direction (TASK-0029, done):** `app/tokens.css`'s
  palette replaced with `BDR-0001`'s Paper & Felt anchors (parchment
  ground, felt-green primary, terracotta secondary, wine-red danger, plus
  new success/danger status-banner pairs and a gold points highlight);
  three self-hosted typefaces wired per §3 (Bevan display, Nunito body,
  Space Mono for codes/timers/scores) — retiring the audit's font-loading
  finding along the way. `RevealCard` now implements the real penumbra
  treatment (a full-screen scrim to `--color-penumbra-ground`, a warm
  `--color-penumbra-glow` around the card), verified live. Zero raw hex
  literals remain anywhere outside `app/tokens.css` — the decorative art
  `TASK-0028` had left as a documented exception got actually replaced,
  not just tokenized. 17 contrast assertions pass.
- **Code task 3a — Hexagon identity & PWA (TASK-0030, done):** split out
  of the original "Identity & polish" entry below so each PR stays
  reviewable. The founder generated the actual hexagon mark (a die inside
  the hexagon, in felt green, following the same hexagon-outline +
  side-connector-node grammar already used across the other Nex-family
  apps) via an external image tool from a prompt built collaboratively in
  conversation — not from any code here. Processed via `sharp`
  (`scripts/generate-icons.mjs`, kept for regeneration if the source logo
  changes) into `app/icon.png`, `app/apple-icon.png` (opaque parchment
  background — transparent apple-touch-icons render with a black fill on
  iOS), and PWA manifest icons (`any` + `maskable` purposes). `app/manifest.ts`
  added (Next.js App Router's auto-linked convention) with `theme_color`
  (felt green) and `background_color` (parchment). The Next.js scaffold
  leftovers the original audit flagged — `app/favicon.ico` and the five
  unused `public/*.svg` files — are gone.
- **Code task 3b — Polish (`TASK-0032`, done):** `components/ui/LanguageSwitcher.tsx`
  added (a real ES/EN toggle using `next-intl`'s locale-aware navigation) and
  every bilingual slash-separated label the original audit found in
  `RoomLobby.tsx` (`"¡ÚNETE AL JUEGO! / JOIN THE GAME!"` and four others) is
  gone, replaced with real per-locale i18n keys — along with several
  hardcoded Spanish defaults (`"Anfitrión"`, error copy) that had never gone
  through the catalog at all. `components/ui/ShareCode.tsx` added to
  `RoomWaitingLobby`: copies the room code to the clipboard, and uses the Web
  Share API when available (feature-detected, same pattern as
  `useWakeLock`), with `aria-live` feedback. Accessibility pass: `Button`'s
  existing `active` prop (already used for the mode switcher and language
  toggle) now also sets `aria-pressed` automatically, closing a real gap —
  those controls read as plain buttons to a screen reader before this,
  despite behaving as toggles; the room code and error banner got
  `aria-live` regions. A live-browser investigation into "the copy button
  didn't update" turned out to be a testing-tool timing artifact (the
  2-second "¡Copiado!" feedback had already reverted by the time each
  separate verification round-trip completed), not a real bug — confirmed
  by instrumenting the actual handler and sampling state every 50ms.
  E2E test added covering the switcher round-trip (es → en → es), all
  visible text re-rendering correctly.

**Done when:** all 6 existing views run on the new tokens/primitives in
`BDR-0001`'s Paper & Felt direction with no raw hex literals outside
`app/tokens.css`, the reveal moment actually animates with its penumbra
look, contrast tests pass for every action/text token pair, the hexagon
appears as the app's icon (✅ 3a), a stranger can actually read the app in
their own language via a visible switcher, share a room code without
dictating it letter by letter, and the whole thing passes an accessibility
pass (✅ 3b) — **M3.5 is complete.**

## M4 — Battleship — ✅ Complete (2026-07-27)
Third game — deliberately chosen to prove the platform isn't just for
word-guessing games. Built on top of M3.5's system, not the pre-M3.5 UI.

Scope was designed with the founder on 2026-07-26 (research into the official
Hasbro *Advanced Mission* and *Salvo* variants, plus four explicit product
decisions). It is the largest milestone so far, so it ships in **four
independently playable phases** rather than one PR.

**Design decisions taken (not to be re-litigated mid-implementation):**
- **Sides, not modes.** The game has two *sides*; each side has one or more
  players. "1 vs 1" is simply one player per side — there is no separate
  1v1 codepath to maintain alongside a teams codepath.
- **Single-device is not supported.** Confirmed during design rather than
  forced: a pass-and-play Battleship on one phone has no way to hide a board
  between turns. Battleship declares `supportedModes: ["multi-device"]`,
  which makes it the first game to not support both — the platform's
  single-device picker currently lists every registered game unconditionally
  and must learn to filter.
- **Special weapons: charges + ship-bound.** Founder's explicit combination of
  two official variants — you accrue charges each turn (the economy), but each
  weapon lives on a specific ship and is lost if that ship is sunk (the
  tension). Because both official variants tie firepower to surviving ships
  and therefore snowball, sinking a ship also grants compensation charges;
  the exact numbers are playtest-tuned, the anti-snowball intent is not.
- **Hidden information is fixed properly, not deferred** — see ADR-0005.

- **M4a — Core 1 vs 1 (`TASK-0031`, done).** Two sides of one player, private
  ship placement, plain single-cell shots, hit/miss/sink/win, both board
  sizes, and `ADR-0005`'s private-state mechanism (now Accepted). `GameModule`
  gained a fourth type parameter (`TPrivate = never`) plus optional
  `setupPrivate`/`answerPending` members, non-breaking for Impostor/Who Am I.
  A device's fleet lives only in its own React state, mirrored to
  `localStorage`, never in `PlatformState` — the shared object a shot
  resolves into carries only the fired-at cell and its hit/miss result, never
  a layout, proven both by a reducer-level unit test and by live two-device
  verification (network-level inspection, not just UI). The single-device
  picker now filters by `meta.supportedModes` (`views.singleDevice` is
  optional in the contract), which is what makes Battleship's "no
  single-device" decision actually true rather than just declared. Live
  testing found and fixed one real bug: the `answerPending` driver could run
  once against an uninitialized private slice at the exact instant a match
  starts, crashing — fixed by having the driver skip silently until the
  slice exists (see `ADR-0005`'s changelog). A second bug — the board grid
  rendering at ~2px per cell, effectively invisible (`inline-grid` with
  `1fr` columns has no width to distribute) — was caught by the founder
  watching the live test and asking why no board was visible; every
  DOM/class-based check during verification had missed it since the classes
  were correct, only the actual rendered size was wrong. 22 new unit tests
  (16 reducer + 6 private-state/privacy) plus an e2e test covering two real
  browser contexts joining, placing, and firing. Playable end to end.
- **M4a polish (`TASK-0033`, done).** Founder feedback from the first live
  playtest, built before M4b because M4b's multi-cell shots reuse the same
  feedback/animation system: (1) a live, movable, semi-transparent
  placement preview (tap sets a ghost anchor, tap elsewhere moves it,
  an explicit confirm button commits it — replacing the old
  instant-tap-to-place flow); (2) real ship artwork — the founder generated
  a 5-ship reference sheet (felt-green board-game-token style matching
  `BDR-0001`) via an external image tool, processed by a new
  `scripts/generate-ship-assets.mjs` (auto-detects each ship's bounding box
  by scanning for non-background columns/rows rather than hardcoded
  coordinates, then chroma-keys the background to transparent with a smooth
  alpha ramp — a hard cutoff left a visible halo from the source art's soft
  drop shadow) into `public/battleship/<type>.png`; each ship then renders
  as one image spanning its full cell footprint (rotated 90° for horizontal
  placements) instead of tiled flat-color squares; (3) an explicit
  hit/miss/sunk announcement (naming the sunk ship) plus a
  "falls from above" fire animation on the targeted cell — two new
  `motion.css` gestures (`nx-strike`, `nx-shake`), both with
  `prefers-reduced-motion` fallbacks; (4) a per-device board layout
  preference (stacked / side-by-side / one-at-a-time), pure UI state, no
  reducer or contract change. Verified live across two real browser
  contexts: ghost preview moves and confirms correctly, ship art renders
  oriented correctly on placement/own/revealed boards while the opponent's
  board stays empty (privacy intact), hit markers stay visible on top of
  ship art, all three layouts render correctly.
- **M4a polish fixes (PRs #41–#44, done).** Founder playtest of the just-shipped
  M4a polish surfaced four follow-up fixes, each shipped as its own small PR
  rather than one batch: (#41) the carrier's ship art left a visible gap at
  its bow/stern — `object-contain` letterboxed the image's short axis because
  the carrier's own aspect ratio didn't match its cell-span box; switched to
  `object-cover`. (#42) the founder explicitly rejected the tap/tap/confirm
  placement flow from `TASK-0033` ("quiero ver como si uno lo arrastrara por
  el tablero") — reworked into genuine continuous-pointer drag-and-drop,
  including picking an already-placed ship back up without it jumping to the
  press point. (#43) that drag rework had two bugs: moving a ship only
  recolored cells instead of showing the actual ship, and rotating a
  picked-up ship silently did nothing because a zero-movement pickup tap
  re-committed the ship before the rotate button could ever apply — fixed
  with a translucent ship-shaped ghost overlay and a `justPickedUpRef` guard
  distinguishing a real drag from a plain pickup tap. (#44) sinking a ship
  gave no strong signal of what was destroyed — added a full-screen sink
  modal (phrasing flips correctly between "you sank it" and "it was sunk on
  you") and a faded/grayscale ship silhouette left over its hit dots on the
  target board, which required a small, explicitly documented exception to
  ADR-0005 §3 (`ADR-0005` v1.2.0: a *sunk* ship's own cells become visible,
  never the rest of the fleet).
- **M4b — Special weapons (`TASK-0034`, done).** Charges, the ship-bound
  weapon table, the four shot shapes, and the aim → preview → confirm
  interaction they need. Design decisions taken with the founder before
  implementation (not just improvised): weapon-to-ship mapping (carrier→
  Cross, battleship→Triple [10×10 only], destroyer→Double Vertical,
  submarine→Double Horizontal, patrol→none); charges accrue +1 automatically
  at the start of a side's own turn, a plain single-cell shot stays free
  (0 cost) always, weapon costs scale with shape size (Double=2, Triple=3,
  Cross=4); anti-snowball compensation (+2 charges) lands on whichever side
  just lost a ship, not the attacker. `games/battleship/weapons.ts` (new)
  holds the shape geometry (pure, clips off-board cells rather than
  rejecting the shot) and the table, independent of the reducer/React.
  `BattleshipState` gained `charges`; `pendingShot`/`RESOLVE_SHOT` moved from
  a single cell to a `cells`/`results` array so `answerPendingShot` can
  resolve — and potentially sink — more than one ship in a single shot (a
  Cross is the shape most likely to do this). Verified live across two real
  browser contexts, including forcing a ship-carrying weapon's owner to lose
  that weapon the instant its ship sinks, and firing a Double weapon to sink
  a ship in one multi-cell shot with the sunk modal/ghost/compensation-charge
  system all firing correctly.
- **M4c — Teams (`TASK-0035`, done).** Fixed 2-vs-2 (4 players total) — team
  size, host-assigned side placement, and the placement/firing/defense model
  were all confirmed with the founder before implementation. A 4-player
  match starts in a new Battleship-only `"teamSetup"` phase (skipped
  entirely for a 2-player match, which behaves exactly as before) where the
  host assigns each player to a side via new `ASSIGN_SIDE`/`START_TEAMS`
  actions; a 2-player match's `sides` stay pre-filled as always. One player
  per side — the **captain**, `sides[side][0]` — places the fleet while
  their teammate watches it appear live and read-only; either teammate can
  fire on their side's turn (this needed zero reducer changes — `FIRE`
  already only checked the side, never a specific player); only the
  captain's device ever resolves a defending shot (`answerPendingShot`
  narrowed from "any player on the defending side" to "that side's captain
  specifically"). The live-mirror mechanism (`lib/realtime/teamState.ts`'s
  `useTeamFleetChannel`) implements ADR-0005 §6's already-pre-approved
  per-side Realtime channel for real, entirely inside Battleship's own view
  code — the generic `usePrivateState`/`MultiDeviceRoom` mechanism stayed
  untouched, so the 1-vs-1 path has zero new code paths to regress (every
  existing M4a/M4b reducer test passed unmodified). Verified live across
  four real, separately-connected browser tabs: team assignment, the
  captain's fleet mirroring live to their teammate, either teammate firing,
  captain-only defense resolution, and privacy (the opposing side's devices
  show zero ship data, same proof standard as every earlier phase).
- **M4d — Tournament (`TASK-0036`, done).** A bracket of sequential 1-vs-1
  matches. Deliberately built as a **platform** capability above
  `GameModule`, not inside Battleship, because it applies to every future
  two-side game (Connect 4, Ludo, ¿Quién es Quién? — all in `BACKLOG.md`).
  Design confirmed with the founder before implementation: entrants are
  individual players only (M4c teams stay a separate, un-combined mode);
  the bracket is random — the host only confirms the roster and taps
  "start," shuffling happens automatically, not host-arranged like M4c's
  side assignment; non-power-of-2 counts get automatic byes; at least 3
  players to start (2 is just a normal match). `GameModule` gained one
  optional member, `getWinner?: (state) => string[] | null` (same
  non-breaking pattern as `ADR-0005`'s `setupPrivate`/`answerPending`) —
  Battleship implements it, Impostor/Who Am I don't (group-deduction games
  aren't 1-vs-1 duels and don't offer a tournament). `lib/realtime/tournament.ts`
  (new) holds pure, unit-testable bracket construction (`buildFirstRound`
  pads to the next power of 2 with pre-resolved byes, `buildNextRound`
  pairs winners and returns `null` once only the champion's match remains,
  `advanceTournament` is the actual advancement bookkeeping — extracted
  into this dependency-free file specifically so it doesn't need to import
  the game registry, which transitively pulls in `next-intl`/routing and
  can't resolve in this project's Node-only Vitest environment).
  `platformReducer.ts` gained `tournament: TournamentState | null` and two
  actions (`PLATFORM_START_TOURNAMENT`, `PLATFORM_ADVANCE_TOURNAMENT`) plus
  a new `"TOURNAMENT_COMPLETE"` status; a new `useTournamentAdvance` hook
  watches the active match's `getWinner` and advances the bracket
  automatically. Live testing surfaced one real, serious bug before this
  shipped: every connected device runs `platformReducer` against every
  broadcast regardless of what it renders, so all 4 devices independently
  detected a resolved match and each dispatched the advance action near-
  simultaneously — the first correctly advanced round 1, but a second,
  near-simultaneous dispatch then incorrectly resolved round 1's *other*
  match too using the stale winner, cascading straight into round 2 and
  declaring a champion after just one real match. Fixed by gating
  `useTournamentAdvance` to `isHost` only, the same "one authoritative
  device" rule `PLATFORM_START_GAME`/`PLATFORM_START_TOURNAMENT` already
  follow. `TournamentBracket` (new platform component) shows any
  non-participant the bracket status instead of a frozen game view (the
  same `ADR-0005` §5 "absence must be visible" spirit), and doubles as the
  champion screen. 13 new unit tests (bracket construction for 3/4/5
  players, a full 5-player simulation, `advanceTournament`'s within-round/
  new-round/champion paths, non-mutation). Verified live across four real,
  separately-connected browser tabs over actual Supabase Realtime: full
  bracket (round 1 with both matches, round 2 final), a non-participant
  correctly seeing the bracket instead of a frozen screen, the champion
  screen rendering correctly with the complete match history on every tab.
  A dev-only React console warning ("final argument passed to useEffect
  changed size between renders") observed during that first live run
  turned out to be a Fast-Refresh/HMR artifact from this session's many
  live edits, not a real bug — confirmed absent across a clean dev-server
  restart replaying the same tournament flow start-to-finish with zero
  console errors.

**Done when:** a structurally different game (board state, two sides, no
"impostor-style" hidden role, genuinely hidden per-player information) fits
the same `GameModule` contract — with ADR-0005's private-state extension
being the one contract change it needed, made deliberately through an ADR
rather than worked around.

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
