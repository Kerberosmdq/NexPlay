# Current State

Living status document tracking the current sprint, objectives, completed tasks, and immediate roadmap for NexPlay.

## Current Sprint
- Sprint: Sprint 17 - M4 (Battleship) and M5 (Connect 4) both fully complete
- Status: `TASK-0031` (Battleship core), `TASK-0033` (M4a polish), four
  playtest follow-up fixes (PRs #41–#44), `TASK-0034` (M4b special weapons),
  `TASK-0035` (M4c teams), `TASK-0036` (M4d tournament), and `TASK-0037`
  (M5 Connect 4) all shipped. Battleship — 1-vs-1, fixed 2-vs-2 teams, and
  tournament brackets on top of either — is feature-complete. Connect 4
  followed, prioritized ahead of M6's presentable-polish pass per the
  founder's explicit request (family trip in about a week, more games
  mattered more than outward polish right now) — hexagonal tokens, a clean
  board, a weighted-drop/column-preview/dramatic-win animation set, no
  hidden information at all (simplest game on the platform so far), and it
  plugs into M4d's tournament bracket for free.

## Current Objective
M1, M2, M3, and M3.5 are all complete — M3's last open item (the founder's
multi-device Who Am I playtest) and M1's last open item (the two-real-
phones reconnection check) were both confirmed during the founder's
2026-07-27/28 family playtest session (see Completed Tasks). **M4
(Battleship) is now fully complete, all four phases (a–d)**: place fleets
with a real continuous-drag preview
(in a team, one captain places while their teammate watches live), fire
plain shots for free or spend charges on one of four special weapons (each
bound to a specific ship type, lost if that ship sinks; either teammate can
fire on their side's turn), see an explicit hit/sink modal with a sunk-ship
silhouette left on the board, win, reveal the loser's board — with genuine
ship-position privacy throughout (a side's fleet only ever reaches its own
captain and, over a side-scoped Realtime channel, that side's own teammate
— never the opposing side — proven both by reducer-level tests and by
inspecting real two- and four-device matches live). On top of that, a full
single-elimination **tournament** (M4d) runs any number of sequential
1-vs-1 matches as a platform capability, not something Battleship-specific
— automatic random bracket, automatic byes, a live bracket status screen
for anyone not in the currently-playing match, a champion screen at the
end. **M5 (Connect 4) is now also complete**: a fourth game, architecturally
the simplest on the platform since it has no hidden information at all —
both players see the full board at all times, so `ADR-0005`'s private-state
mechanism doesn't apply. Hexagonal tokens on a clean board, a weighted-drop/
column-preview/dramatic-win animation set (reusing the existing
`nx-strike`/`nx-celebrate` motion vocabulary, zero new keyframes), draws
handled via an immediate rematch, and single-device support that's a
genuine shared screen with no reveal gate at all (nothing to hide). Plugs
into M4d's tournament bracket with zero platform changes — live-verified
with a real 3-player tournament played to a champion. Next up: pick the
next milestone — M6 (presentable) per `docs/ROADMAP.md`, or another game
from `BACKLOG.md`'s prioritized list (Guess Who, Ludo, a dice-and-track
race game), the founder's call.

## Completed Tasks
- [x] **TASK-0001**: Bootstrap Documentation Structure
- [x] **TASK-0001.1**: Documentation Architecture Improvements (V2)
- [x] **TASK-0002**: Create Core Documentation Infrastructure
- [x] **TASK-0003**: Write NexPlay Master Plan (`docs/NEXPLAY_PLAN.md`)
- [x] **TASK-0004**: Write ADR-0001, ADR-0002, ADR-0003
- [x] **TASK-0005**: Create `docs/ROADMAP.md` and `docs/BACKLOG.md`
- [x] **TASK-0006**: Write `docs/05_engineering/CONVENTIONS.md`
- [x] **TASK-0007**: Reconcile git state, first commit, remote configured
- [x] **TASK-0008**: Create `start-task` / `finish-task` skills
- [x] **TASK-0009**: Lock package manager to pnpm exclusively (amended ADR-0001)
- [x] **TASK-0010**: Scaffold Next.js 16 + TypeScript app with pnpm
- [x] **TASK-0011**: Design tokens skeleton (`app/tokens.css`)
- [x] **TASK-0012**: next-intl wired (ES/EN), verified in-browser
- [x] **TASK-0013**: Vitest + Playwright with real smoke tests
- [x] **TASK-0014**: GitHub Actions CI workflow
- [x] **TASK-0015**: Initial Supabase migration (`users`, `game_results`,
      `events`) with RLS policies per ADR-0001/ADR-0003; applied to the live
      project via the Supabase SQL Editor and confirmed present.
- [x] **TASK-0016**: `.env.example` + `.env.local` (local, gitignored) wired
      with the project's real Supabase URL/anon key.
- [x] **TASK-0017**: Vercel project connected and deployed — live at
      https://nex-play-one.vercel.app, verified working at both `/en` and
      `/es` with no console errors.
- [x] **TASK-0018**: GitHub branch protection enabled on `main` — strict:
      required status checks (`Lint, typecheck, unit tests`, `End-to-end
      tests`) must pass, enforced for admins too (no bypass), no force
      pushes or deletions.
- [x] **TASK-0020**: Wire Supabase Anonymous Auth on first load (`lib/auth/`,
      `AuthProvider`, `public.users` row creation, unit tests).
- [x] **TASK-0021**: Room creation and join-by-code primitives (`lib/realtime/`,
      room code generator, room state & presence management, host migration logic, unit tests).
- [x] **TASK-0022**: Multi-device & Single-device placeholder state synchronization UI (`games/placeholder/` & `components/platform/`).
- [x] **TASK-0023**: Reconnection resilience, host migration, and `lib/analytics` write helpers (`lib/realtime/hooks/useRoomConnection.ts`, `lib/analytics/`). No task spec doc was written for this one before starting — process gap, noted so it isn't repeated.
- [x] **TASK-0024**: Closed the M1 gap left by TASK-0023 — `recordGameResult`/`recordEvent` were defined but never called (dead code); wired real call sites into both device-mode lifecycles, added unit tests for `calculateHostMigration` edge cases, marked M1 ✅ in `docs/ROADMAP.md`.
- [x] **TASK-0025**: Impostor game (M2) — both device modes. Reworked an
      uncommitted, un-specced batch of prior work into ADR-0002 compliance
      (`GameModule` contract fixed, ES+EN `LocalizedContentPack`, all UI
      strings via `next-intl`, real reveal-and-pass `SingleDeviceView`, pure
      reducer), then iterated through several rounds of founder playtesting
      feedback: multi-round Mafia-style elimination (was ending after one
      vote), rebalanced scoring, a celebratory "impostor survived" screen,
      an impostor-count selector, turn-based discussion replacing a
      half-wired timer, no-repeat words within a match, and an
      alive/eliminated roster. 25 unit tests. Founder playtested a full
      match on 3 real devices and confirmed it plays well.
- [x] **Hotfix (unnumbered)**: Multi-device rooms hung forever on "Conectando
      a la sala..." in production — `NEXT_PUBLIC_SUPABASE_ANON_KEY` had a
      trailing newline in Vercel, corrupting the Realtime WebSocket
      `apikey` query param (`CHANNEL_ERROR`/"transport failure" on every
      attempt, silent because REST/Auth calls don't embed the key in a URL
      the same way). Fixed in two PRs: #15 added connection diagnostics
      (logging, timeout, visible error+retry UI) that revealed the real
      error once tested live; #16 added `.trim()` on both Supabase env vars
      so a stray newline can't do this again. Founder also re-pasted the
      env vars cleanly in Vercel and redeployed. Confirmed working: full
      multi-device match on 4+ real devices, including the
      alive/eliminated roster.
- [x] **`game_results`/`events` RLS policies applied** to the live database
      (the founder re-ran the migration's `create policy` statements — they
      really were missing). Verified with a real anon-auth JWT hitting the
      REST API directly the same way the app's `supabase-js` client does
      (`Prefer: return=minimal`, no `.select()`): both tables now insert
      successfully (201). An earlier round of "still failing" reports during
      this verification was a false alarm from the verification script
      itself requesting `return=representation`, which requires a SELECT
      policy that was deliberately never added (reads happen via the
      dashboard/service role, per ADR-0003) — not a real bug.
- [x] **Remember the room on this device** (`lib/realtime/session.ts`) — a
      real gap the founder found while doing M1's reconnection check: if a
      phone's connection dropped and nobody wrote down the room code, that
      player was locked out for good. Multi-device sessions now persist to
      `localStorage` and silently rejoin on load via the existing
      presence-based reconnection (ADR-0001 §4). Same-device only. Founder
      confirmed it works (killed the connection mid-match, reopened, landed
      back in the same room). This exercises the same presence-based
      rejoin code path M1's reconnection check cares about, but solo — it
      doesn't confirm the specific multi-phone host-migration scenario
      (one phone drops while others stay connected). See Known Issues.
- [x] **TASK-0026**: Who Am I (M3) — second game, designed collaboratively
      with the founder before writing any code (turn-order rotation +
      anytime self-reported guessing, shared/per-turn timer, Heads-Up-style
      single-device, dedicated word bank with emoji instead of real art).
      Built with zero changes to the shared platform beyond one additive
      registry line and one lookup-table entry (the documented
      `TERMINAL_PHASE_BY_GAME` extension point) — the reuse test M3 exists
      for passed. 15 unit tests. Playtested locally end to end
      (single-device full round; multi-device only to the lobby/config
      screen — no live Supabase in this dev sandbox).
- [x] **Post-merge fixes found by the founder on the live deployment**:
      (1) Who Am I's card in the room lobby showed the raw i18n key
      `games.who-am-i.description` instead of translated text — the
      catalog used `whoAmI` (camelCase) under `games.*`, but
      `RoomWaitingLobby.tsx` derives the description key from `game.id`
      directly (`"who-am-i"`, kebab-case, matching Impostor/placeholder's
      convention where id and i18n key were always identical). Renamed the
      catalog key and every `games.whoAmI.*` reference to match. (2)
      Removed `games/placeholder/` entirely (game, tests, i18n keys,
      registry entry) — its only purpose was scaffolding for M1 and the
      founder asked for it gone now that two real games exist.
- [x] **Multi-device Who Am I redesigned to match the real physical game**:
      the founder caught that the first version had every device showing a
      *list* of everyone else's words — but the actual intended play
      pattern is Heads-Up style per device: each phone shows only its own
      owner's word, held facing outward so everyone but the owner can read
      it (to learn someone else's word, you look at *their* phone, not
      your own). Reworked `games/who-am-i/views/Player.tsx` to show the
      viewer's own word big (with emoji, matching single-device's Heads-Up
      screen) instead of a roster. Also dropped the turn-rotation UI/state
      entirely (`turnOrder`/`turnIndex`/`NEXT_TURN`) — it was purely
      cosmetic (never affected scoring) and the founder wants the family to
      self-regulate who asks next verbally, same as they already do for
      single-device. 60 tests (turn-rotation tests removed, since that
      mechanic no longer exists).
- [x] **Who Am I: direct guess buttons + wrong guess ends your round**:
      the founder pointed out the "Creo que sé quién soy" → confirm-dialog
      flow was backwards — you say the word out loud *before* touching the
      screen, so there's nothing left to confirm. Replaced it with two
      always-visible buttons, "Acerté"/"No acerté", firing `GUESS_CORRECT`/
      new `GUESS_WRONG` directly. Also changed the rule itself: a wrong
      guess now permanently ends that player's round (added `lostIds` to
      `WhoAmIState`, mirroring `guessedIds` but with no points and no
      retry) — previously a wrong guess had zero consequence and could be
      retried indefinitely. Single-device's "Pasar" button was renamed
      "No acertó" and now dispatches `GUESS_WRONG` too, for the same rule
      in both modes. 65 tests. Playtested locally end to end
      (single-device, 3 players, mixed correct/wrong outcomes).
- [x] **TASK-0027**: Visual Identity Direction & Design System Contract
      (paperwork phase) — a full UX/UI audit of M0–M3 as shipped, run
      against the app live in a browser, found no enforced visual system:
      `app/tokens.css` has zero consumers, 43 raw hex values are hand-
      written across 7 files, the same primary button is implemented six
      different ways, the entry screen's two action buttons fail WCAG AA
      contrast, and the Impostor reveal references an animation
      class from an uninstalled package (verified `animationName: "none"`
      live). Produced `BDR-0001` (direction: Paper & Felt, with a penumbra
      treatment reserved for secret reveals — three directions explored
      per Article 10), `ADR-0004` (semantic paired tokens, a mandatory
      `components/ui/` primitive set, a named motion vocabulary with
      mandatory `prefers-reduced-motion` fallbacks, contrast checked by
      unit test), and `docs/04_design/FEEL.md`. Opened milestone **M3.5**
      in `docs/ROADMAP.md` as an explicit scope decision, queuing three
      follow-up code tasks (system → direction → identity/polish). No
      component code changed in this task. A follow-up correction: the
      original audit's live-measurement script mis-parsed the browser's
      `lab()` color notation as `rgb()`, reporting six contrast failures
      when only two were real (both action buttons); corrected in
      `BDR-0001`/`ADR-0004`/this file before the docs PR merged.
- [x] **TASK-0028**: Design System — Tokens, Primitives & Motion (M3.5 code
      task 1) — implemented `ADR-0004` for real. `app/tokens.css` rewritten
      as semantic paired tokens (the two real contrast failures fixed using
      hues already in the brand — `#7c3aed`/white for the primary action,
      `#ff8c00`/`#13072b` ink for the secondary — both now ≥4.5:1, verified
      live); `app/motion.css` added with the four named gestures
      (`reveal`/`deal`/`celebrate`/`pulse`) and a single
      `prefers-reduced-motion` override block; the mandatory
      `components/ui/` set built (`Button`, `Card`, `Field`, `CodeInput`,
      `PlayerChip`, `Screen`, `RevealCard`, `Scoreboard`, `WaitingState`);
      `tests/unit/design-tokens.test.ts` added (8 contrast assertions,
      parses the real `tokens.css`, no duplicated palette). All 6 existing
      views ported with no palette/layout change (one documented exception:
      `RoomLobby.tsx`'s decorative background art and wordmark colors are
      the current identity being fully replaced, not migrated, by code
      task 2/3 — tokenizing throwaway pixels wasn't worth it). Fixed the
      audit's top finding for real: the Impostor reveal now animates
      (`animationName: "nx-reveal"`, verified live) instead of silently
      doing nothing. Caught and fixed one real bug during browser
      verification: `CodeInput`'s tiles briefly rendered the wrong border
      color after rapid input because `transition-all` interacted badly
      with the `motion-pulse` infinite animation turning on/off on the
      same element — fixed by dropping the unneeded transition. 73 unit
      tests pass; full lobby → single-device Impostor → reveal →
      discussion → voting → resolution flow manually verified in-browser
      with zero console errors.
- [x] **TASK-0029**: Apply the Paper & Felt Direction (M3.5 code task 2) —
      `app/tokens.css`'s palette replaced with `BDR-0001`'s anchors:
      parchment ground (`#EFE6D6`), ink (`#2B2118`), felt-green primary
      action (`#1F6B52`), terracotta secondary (darkened to `#A8481F` for
      AA — `#C0562A` alone sits under 4.5:1 with white text), a wine-red
      danger action (`#8A1030`), plus new success/danger status-banner
      pairs and a `--color-gold` points highlight. Three self-hosted
      typefaces wired via `next/font` per `BDR-0001` §3 (Bevan for
      display/headlines, Nunito for body/UI, Space Mono for room
      codes/timers/scores) — this also retired the audit's font-loading
      finding (the external Google Fonts `@import` and the `!important`
      override are both gone from `globals.css`). `RevealCard` now
      implements the actual penumbra treatment: a fixed full-screen scrim
      dims to `--color-penumbra-ground` while a card glows with
      `--color-penumbra-glow`, verified live (`opacity: 0.95` on the
      scrim, `animationName: "nx-reveal"` still firing). Four new
      `--color-on-penumbra*`/`--color-penumbra-danger/success` tokens
      exist because the reveal's dark ground needs its own readable text
      colors, not the light-theme pairs. All 13 (now 17) contrast
      assertions pass; zero raw hex literals remain anywhere outside
      `app/tokens.css` (no exceptions needed this time — the decorative
      art `TASK-0028` had left untouched got actually replaced here).
      Two real bugs found and fixed during browser verification: (1) a
      circular CSS custom-property self-reference
      (`--font-display: var(--font-display, "Bevan", ...)` inside the
      very `:root` rule defining `--font-display`) made every display
      heading silently fall back to the browser's default serif instead
      of Bevan — fixed by removing the redundant `:root` redeclaration
      entirely and relying on `next/font`'s own `<html>`-level variable.
      (2) The same "className is correct but computed style is stuck
      wrong" rendering bug `TASK-0028` found in `CodeInput` recurred
      twice more — on `RevealCard`'s penumbra scrim (`transition-opacity`
      stuck at `opacity: 0` despite the `opacity-95` class being present)
      and on `Button`'s `danger` variant right after a phase transition
      (`transition-colors` stuck showing the wrong bg/text color). Rather
      than patch each occurrence, removed `transition-colors` from
      `Button` globally and the leftover `transition-colors` on two
      `<select>` elements — the pattern is specifically CSS
      transitions co-occurring with concurrent animation/DOM-churn
      activity elsewhere on the page; none of these transitions were
      load-bearing UX, so removing them eliminates the bug class instead
      of chasing individual instances. 82 unit tests pass; full lobby →
      single-device Impostor (reveal with visible penumbra) →
      discussion → voting → resolution, and Who Am I's playing phase,
      all manually verified in-browser with zero console errors.
- [x] **TASK-0030**: Hexagon Identity & PWA Icons (M3.5 code task 3a) —
      made `BDR-0001` §4 literally true. The founder generated the actual
      hexagon mark (a die inside the hexagon, felt green, following the
      same hexagon-outline + side-connector-node grammar already used
      across the founder's other Nex-family apps) via an external image
      tool, from a prompt built collaboratively in conversation. Processed
      via `sharp` (required directly from its pnpm store path, since it's
      a nested/transitive dependency — `scripts/generate-icons.mjs` kept
      in the repo for regeneration if the source logo ever changes) into
      `app/icon.png` (favicon), `app/apple-icon.png` (180×180, opaque
      parchment background — transparent apple-touch-icons render with a
      black fill on iOS), and three PWA manifest icons (192/512 "any",
      512 "maskable" with extra padding for Android's shape mask).
      `app/manifest.ts` added (Next.js App Router's auto-linked
      convention) with `theme_color` (felt green) and `background_color`
      (parchment); `viewport.themeColor` wired in `layout.tsx` for the
      mobile-browser-chrome half. Removed the scaffold leftovers the
      original audit flagged: `app/favicon.ico` and five unused
      `public/*.svg` files. Split "Code task 3" into 3a (this task) and
      3b (language switcher, room-code share, a11y pass) in
      `docs/ROADMAP.md`, an explicit scope decision rather than a silent
      one. Verified live: `<link rel="icon">`, `<link rel="apple-touch-
      icon">`, and `<link rel="manifest">` all present and correctly
      linked; every icon URL and `/manifest.webmanifest` fetch returns
      200 with correct content; zero console errors.
- [x] **Hotfix (unnumbered)**: Fixes from the founder's family playtest the
      night of 2026-07-24 — three unrelated small fixes, bundled because
      they were all found in one sitting and the founder wanted them for
      that same night's next session:
      (1) **Screen wake lock** — the family had to disable their phone's
      own lock-screen timeout from OS settings to keep a mid-round match
      from going dark. `lib/hooks/useWakeLock.ts` wraps the Screen Wake
      Lock API (feature-detected, silently no-ops on unsupported
      browsers, re-acquires on `visibilitychange` since the OS releases
      the lock whenever the tab is hidden) and is held for the whole time
      a session is open (lobby wait through an active game), not on the
      entry screen. Verified live: `navigator.wakeLock.request` fires the
      moment a session starts, not before.
      (2) **Impostor: rotate who starts discussion** — `turnOrder` used
      to always start from the same player (index 0 of `playerIds`,
      never reshuffled), so the same person was asked to speak first
      every round of every match. Added `discussionsStarted` to
      `ImpostorState` (persists across `PLAY_AGAIN`, never reset) and
      `PROCEED_TO_DISCUSSION` now rotates the stable `playerIds` order by
      that count before filtering to `aliveIds` — so the starting speaker
      shifts by one player every time discussion begins, both within a
      match (after a tie/elimination) and across a whole night of
      `PLAY_AGAIN` matches. 3 new unit tests (rotation across rounds,
      survives `PLAY_AGAIN`, correctly skips an eliminated player while
      preserving relative order); verified live (a 3-way tie sent the
      group back to discussion starting with a different player).
      (3) **+100 words per game** — the founder was worried about running
      out of unique words across several matches in one night. Added a
      new, non-overlapping 100-word batch to both `games/impostor/content/`
      and `games/who-am-i/content/` (ES+EN, both kept in parity), covering
      9 new categories (more animals/food/house items, clothing, sports,
      musical instruments, nature, school supplies, body parts) —
      Impostor now has 200 words, Who Am I has 185. Caught and fixed one
      real duplicate during verification: "Pescado" (food) and "Pez"
      (animal) both translate to "Fish" in English — renamed the food
      entry to "Seafood" in both `en.ts` files to keep every word's
      display text unique within its own pack.
      All three verified together in one live playthrough (lobby →
      single-device Impostor → reveal → discussion, rotated correctly on
      a tie → resolution), zero console errors; 85 unit tests pass.
- [x] **Hotfix (unnumbered)**: The lobby header's hexagon never got
      updated to the real logo. `TASK-0029` added a plain placeholder
      hexagon `<polygon>` as an explicit preview accent (documented as
      such — "the real favicon/PWA icon system... is code task 3's job");
      `TASK-0030` then built the real hexagon+die mark and wired it as the
      favicon/PWA icon, but nobody went back to swap the lobby's inline
      placeholder for the real asset — so the app's own UI still showed a
      plain green hexagon with no die inside, while the browser tab/PWA
      icon correctly showed the real mark. Founder caught this by
      screenshotting the lobby. Fixed by replacing the inline
      `<svg><polygon>` in `RoomLobby.tsx` with `next/image` pointing at
      `/icon.png` — the same file already serving as the favicon, so
      there's now exactly one hexagon asset, not two. Also incidentally
      fixed a real, unrelated infra issue found while verifying this: a
      stale `next dev` process (PID still alive, holding Next's
      single-instance dev-server lock) was refusing all new connections
      on port 3000 without actually answering any — `curl` to port 3000
      got connection-refused while a fresh `next dev` attempt still
      reported "another server is already running." Killed the stale
      process and started clean; worth knowing if a future agent hits the
      same "lock says busy, port says nobody's home" symptom.
- [x] **Hotfix (unnumbered)**: Who Am I — "too hard, change my word"
      button. Founder request after discussing the earlier "rotate who
      starts" fix: anyone should be able to bail on a word that's too hard
      for a given player (their family plays with a 7- and a 9-year-old)
      without ending their turn. Deliberately scoped to **Who Am I only**
      (Impostor has one *shared* secret word — swapping it mid-round would
      need to reset everyone's discussion, a bigger, messier change not
      requested) and **anyone can trigger it** (no host/self-only
      restriction, per the founder's call — casual family game, not worth
      guarding). Added `REROLL_WORD` to `WhoAmIState`'s action union
      (reducer swaps in a caller-picked replacement word for that one
      player, marks it used, ignores the request if that player already
      resolved guessed/lost or the phase isn't `playing`) and
      `pickReplacementWord` in `pickRound.ts` (same never-used-this-match
      rule as the initial deal, picked outside the reducer for the same
      `Math.random()`-stays-out-of-pure-code reason as `pickAssignments`).
      Wired a small text-link button (matching the existing
      `endRoundButton` style) in both `Player.tsx` (multi-device) and
      `SingleDevice.tsx`, right below the correct/wrong buttons. New i18n
      key `WhoAmI.playing.rerollButton` in both `es.json`/`en.json`. 4 new
      reducer tests. Verified live: pressing it swapped the word (Búho →
      Zapato) without advancing the turn or resetting the per-turn timer;
      guessing correctly afterward still advanced normally. Also answered
      a founder question in passing: both games declare `maxPlayers: 12`
      with no additional platform-level cap, so 8 players in one match is
      fully supported.

- [x] **Live-playtest hotfixes, 2026-07-25/26 night (PRs #33–#36)**: four
      production bugs reported by the founder *during* a real 8-player family
      match, fixed and merged as they were found. Documented here after the
      fact — the DoD's state-doc update was skipped under time pressure while
      the family waited mid-game, which is the honest reason and not a
      precedent.
      (1) **Discussion phase could strand on a blank speaker (#33)** — with 8
      devices, `players.find()` for the current speaker could come back
      undefined (a presence-sync gap), rendering "es el turno de ..." with no
      name and no way forward. Added an explicit fallback message plus a
      host-only "skip this turn" control.
      (2) **Voting could not be closed if a voter never voted (#34)** — the
      host's "reveal results" button was gated on `allVoted`, so a player who
      dropped mid-vote (or rejoined and couldn't vote) froze the match
      permanently. Removed the gate; the button is always available to the
      host, with a hint when the ballot is incomplete.
      (3) **Majority lock never fired when the elimination caught an impostor
      (#35)** — the "impostors can no longer be out-voted" check was gated on
      `!wasImpostor`, so with 3+ impostors, catching one could land the match
      at an already-decided state (e.g. 1 impostor vs 1 innocent) without ever
      evaluating it, leaving two players voting each other forever with no
      winner. This is the bug the founder hit live. Fixed to evaluate the
      resulting alive counts regardless of who was eliminated; regression test
      added.
      (4) **Rejoining minted a new identity, orphaning the player (#36)** —
      exiting and rejoining always generated a fresh random `userId`, which
      appeared in the presence roster but was absent from the match's
      `playerIds`/`aliveIds`, so the player was visibly "back" yet unable to
      vote or take a turn. Now the `userId` used for a given room code is
      remembered in storage that survives `clearRoomSession`, so rejoining the
      same room reuses the same identity. The presence grace period was also
      raised from 60s to 5 minutes in the same PR: locking a phone with the
      power button suspends the realtime connection independently of the Wake
      Lock API, and a minute was too short for a family that puts phones down
      mid-discussion.
- [x] **M4 (Battleship) design & specification**: researched the official
      Hasbro *Advanced Mission* and *Salvo* variants to ground the founder's
      "different shot shapes" idea (it turns out to be almost exactly Advanced
      Mission's Exocet/Apache weapons). Four product decisions taken with the
      founder, written into `docs/ROADMAP.md` M4 so they are not re-litigated
      mid-implementation: sides-not-modes, no single-device support, a
      charges + ship-bound weapon hybrid with an anti-snowball correction to
      the official rules, and fixing hidden information properly rather than
      deferring it. That last one produced **`ADR-0005`** (private per-player
      state), which supersedes ADR-0002 §3's third bullet — a promise that the
      platform filters private data before it reaches other devices, which was
      never actually implemented and is fatal for Battleship specifically.
      M4 is split into four independently playable phases (M4a–M4d);
      `TASK-0031` specs the first.
- [x] **TASK-0031**: Battleship — Core 1 vs 1 & Private State (M4a) — the
      load-bearing phase of M4. Two platform changes plus a new game.
      **Platform:** `GameModule` gained a fourth type parameter
      (`TPrivate = never`) and optional `setupPrivate`/`answerPending`
      members exactly per `ADR-0005` §2 (verified non-breaking — Impostor
      and Who Am I needed zero changes). `lib/realtime/privateState.ts`
      (new): `usePrivateState` (a device's slice, mirrored to `localStorage`,
      never folded into `PlatformState`) and `useAnswerPending` (runs a
      game's `answerPending` against this device's slice whenever shared
      state changes, dispatching the result at most once per distinct
      pending request). `MultiDeviceRoom.tsx` wires both in, unconditionally
      before any phase-based early return (Rules of Hooks). The
      single-device game picker (`app/[locale]/page.tsx`) now filters by
      `meta.supportedModes` instead of listing every registered game —
      `views.singleDevice` is optional in the contract accordingly.
      **Game:** `games/battleship/` — pure `reducer.ts` (`placing` →
      `firing` → `resolution`, `SIDE_READY`/`FIRE`/`RESOLVE_SHOT`/
      `REVEAL_FLEET`/`PLAY_AGAIN`), `answerPendingShot` (the `answerPending`
      implementation — hit/miss/sunk computed from the defending device's
      own private fleet, never from shared state), `placement.ts` (pure
      placement validation + a `Math.random()`-based random-fill helper kept
      outside the reducer, same rule as `games/who-am-i/pickRound.ts`), and
      `views/Player.tsx` (placement grid with rotate/random/undo, firing
      grids for both boards, an explicit "waiting for your opponent" state
      per `ADR-0005` §5, and the loser's board reveal on resolution). Both
      board sizes (8×8/10×10) are a host-facing config choice. Two sides of
      one player each (`Record<Side, string[]>` from the start, so M4c adds
      to it rather than reshaping it) — no single-device view, deliberately.
      22 new unit tests (16 reducer + 6 privacy/private-state) plus a new
      e2e test (two real Playwright browser contexts joining, placing
      fleets, and firing a shot over real Supabase Realtime).
      **Live two-device verification** (not just automated tests) confirmed:
      a fleet exists only in its owner's `localStorage`, the shared state
      the reducer produces never contains cell/ship data even after full
      placement, hit/miss renders correctly on both boards, the turn
      correctly flips, and — closing an opponent's tab mid-shot — the
      shooter sees an explicit "waiting for your opponent" message (not a
      frozen screen) that resolves the instant the opponent reconnects. This
      same live testing surfaced one real bug, fixed before merge: the
      `answerPending` driver could run once against this device's
      not-yet-initialized private slice at the exact instant a match
      starts, crashing on `privateState.fleet` of `undefined` — fixed in
      the driver itself (skip silently until the slice exists), documented
      in `ADR-0005`'s changelog so the reasoning survives the fix.
      `ADR-0005` moved Proposed → Accepted in this same task.
- [x] **TASK-0032**: Language Switcher, Room-Code Share & Accessibility Pass
      (M3.5 code task 3b) — **closes M3.5.** `components/ui/LanguageSwitcher.tsx`
      (new): a real ES/EN toggle via `next-intl`'s locale-aware `useRouter`/
      `usePathname`, replacing every bilingual slash-separated label the
      original TASK-0027 audit found in `RoomLobby.tsx` (`"¡ÚNETE AL JUEGO! /
      JOIN THE GAME!"` and four siblings) with real per-locale i18n keys.
      Along the way, several hardcoded Spanish defaults that had never gone
      through the catalog at all (`"Anfitrión"`, `"Jugador"`, the invalid-code
      error text) were moved into `i18n/es.json`/`en.json` too — the
      bilingual labels were a symptom of the same underlying gap, not a
      separate one. `components/ui/ShareCode.tsx` (new), wired into
      `RoomWaitingLobby`: copies the room code to the clipboard, and calls
      the Web Share API when available (feature-detected the same way
      `useWakeLock` detects the Wake Lock API), with `aria-live` feedback.
      Accessibility pass: `Button`'s existing `active` prop (already driving
      the mode switcher and now the language toggle) now also sets
      `aria-pressed` automatically — closing a real gap found while
      verifying live: those controls read as plain buttons to a screen
      reader despite behaving as toggles. The room-code display and the
      error banner got `aria-live` regions.
      A live-browser investigation is worth recording: the copy button
      appeared not to update to "¡Copiado!" across several manual checks.
      Instrumenting the actual handler (temporary `console.log`s, since
      removed) proved `setCopied(true)` fired correctly every time; sampling
      the DOM every 50ms after a click showed the feedback text was in fact
      present the whole 2-second window — the earlier "it's not updating"
      checks were each landing after that window closed, because each
      separate tool round-trip took longer than 2 seconds on its own. Not a
      product bug; recorded so a future agent doesn't re-chase it.
      Zero raw hex literals or bilingual labels added; all 95 unit tests +
      3 e2e tests pass, including a new e2e test covering the switcher
      round-trip (es → en → es) with visible text re-rendering confirmed at
      each step. Manually verified at mobile width (375px, no horizontal
      overflow).
- [x] **TASK-0033**: Battleship M4a Polish — founder feedback from playing
      the just-shipped M4a live, addressed before M4b since M4b's
      multi-cell shots reuse the same feedback/animation system.
      (1) **Live placement preview**: placing a ship is now tap-to-preview
      (a semi-transparent ghost follows each tap, movable, shown invalid in
      red on overlap/out-of-bounds) then an explicit confirm button commits
      it — replacing the old instant-tap-to-place flow the founder found
      disorienting.
      (2) **Real ship artwork**: the founder generated a 5-ship reference
      sheet via an external image tool (felt-green board-game-token style,
      matching `BDR-0001`), from a prompt built collaboratively. New
      `scripts/generate-ship-assets.mjs` (mirrors `scripts/generate-icons.mjs`'s
      pattern) auto-detects each ship's bounding box by scanning columns/rows
      for non-background content — no hardcoded coordinates — then removes
      the background via a smoothly-ramped chroma key (a hard alpha cutoff
      left a visible halo from the source art's soft drop shadow) into
      `public/battleship/<type>.png`. Each ship now renders as one image
      spanning its full cell footprint (rotated 90° for horizontal
      placements via a center-anchored transform trick) instead of tiled
      flat-color squares, on the placement grid, a player's own board, and
      the post-match revealed board.
      (3) **Hit/sink feedback**: an explicit announcement banner names
      hit/miss, and — the specific gap reported ("hundí un barco y no me
      avisa") — names which ship was sunk, using `Battleship.ships.*`'s
      localized names. Paired with a "falls from the sky" fire animation on
      the targeted cell.
      (4) **Motion**: two new named gestures in `app/motion.css`
      (`nx-strike`, `nx-shake`), following the existing
      `reveal`/`deal`/`celebrate`/`pulse` pattern with `prefers-reduced-motion`
      fallbacks — not one-off animations bolted on outside the vocabulary.
      (5) **Board layout preference**: stacked / side-by-side / one-at-a-time,
      a per-device `localStorage` UI preference with zero reducer or
      `GameModule` contract changes (it never needs to sync).
      Verified live across two real browser contexts: ghost preview moves
      and confirms correctly; ship art renders correctly-oriented on
      placement/own/revealed boards while the opponent's board stays
      genuinely empty (privacy intact); hit markers stay visible layered on
      top of ship art; all three layouts render and switch correctly.
- [x] **Battleship playtest follow-up fixes (PRs #41–#44)**: four small,
      independently-merged fixes from the founder playing the just-shipped
      M4a polish live, documented here together since none of them got a
      state-doc update at the time (an acknowledged process gap, closed by
      this entry rather than repeated).
      (#41) The carrier's ship art left a visible gap at its bow/stern even
      though it correctly occupied its cells — `object-contain` letterboxed
      the image's short axis because the carrier's own aspect ratio (2.59)
      didn't match its 4-cell-span box aspect (4.0); the other four ships'
      aspect ratios happened to already exceed their box's, so only the
      carrier showed it. Fixed by switching `ShipOverlay`'s `<img>` to
      `object-cover`, verified by comparing `getBoundingClientRect()` of the
      image against its container for all 5 ship types.
      (#42) The founder explicitly rejected `TASK-0033`'s tap/tap/confirm
      placement flow mid-verification ("quiero ver como si uno lo
      arrastrara por el tablero") — reworked into genuine continuous
      pointer-driven drag-and-drop: `BoardGrid` gained `onDragStart`/
      `onDragMove`/`onDragEnd`, window-level `pointermove`/`pointerup`
      listeners track the drag, and picking an already-placed ship back up
      re-anchors to its *existing* position rather than jumping to the
      press point. Pure placement-logic helpers (`shipTypeAt`, `shipAt`,
      `orientationOf`, `anchorOf`) moved from the view into
      `games/battleship/placement.ts` for unit-testability.
      (#43) That drag rework shipped with two bugs the founder found on the
      next live pass: moving a ship only recolored cells instead of showing
      the actual ship following the pointer, and rotating a picked-up ship
      silently did nothing. Root cause of the second bug: a plain
      tap-to-pick-up (press+release with no movement) was treated as a
      zero-distance drag-and-drop, instantly re-committing the ship to its
      original cells before the rotate button could ever have an effect —
      closing the only window (`nextShip` truthy) rotation depends on.
      Fixed with (a) a translucent ship-shaped ghost overlay (tinted by
      placement validity) replacing the plain colored-cell highlight, and
      (b) a `justPickedUpRef` flag that only allows a release to commit once
      real pointer movement has happened since pickup.
      (#44) Sinking a ship gave no strong signal of what was destroyed, and
      the target board only ever showed bare hit/miss dots with no lasting
      memory of what had already been eliminated where. Added a full-screen
      sink modal (tap to dismiss) whose phrasing correctly flips between
      "¡Hundiste X!" and "¡Te hundieron X!" depending on whose ship it was
      — previously both cases used identical text, wrong for the defender.
      Added a faded/grayscale ship silhouette over a sunk ship's hit cells
      on the target board. This needed a small, deliberate, documented
      exception to `ADR-0005` §3 ("the layout that produced it never
      does"): `RESOLVE_SHOT` now carries a newly-*sunk* ship's own cells
      into shared state (never an unsunk ship's) — recorded as `ADR-0005`
      v1.2.0, reasoned as revealing no new strategic information since
      every one of those cells already independently read "hit".
      All four verified live across two real, separately-connected browser
      tabs over actual Supabase Realtime (not single-tab simulation).
- [x] **TASK-0034**: Battleship — Special Weapons (M4b) — charges, a
      ship-bound weapon table, the four shot shapes, and the aim → preview →
      confirm interaction they need, on top of M4a + its polish/fixes.
      Design (weapon-to-ship mapping, charge economy numbers, whether a
      "pass turn to save charges" mechanic was needed) was worked out with
      the founder in conversation *before* writing a task spec or any code —
      same discipline as M4's original design — landing on: carrier→Cross,
      battleship→Triple (10×10 only), destroyer→Double Vertical, submarine→
      Double Horizontal, patrol→no weapon; charges accrue +1 automatically
      at the start of a side's own turn; a plain single-cell shot stays free
      always (so no "pass turn" mechanic was needed — you're never forced to
      spend down to zero just to keep playing); weapon costs scale with
      shape size (Double=2, Triple=3, Cross=4); a side that just lost a ship
      gets +2 anti-snowball compensation charges, landing on the loser, not
      the attacker. `games/battleship/weapons.ts` (new) holds the shape
      geometry (pure functions, clip off-board cells rather than rejecting
      the whole shot) and the ship→weapon→cost table, independent of the
      reducer/React — mirrors `placement.ts`'s pattern. `BattleshipState`
      gained `charges: Record<Side, number>`; `pendingShot`/`RESOLVE_SHOT`
      changed from a single cell to a `cells`/`results` array so
      `answerPendingShot` can resolve — and potentially sink — more than one
      ship in a single multi-cell shot (a Cross is the shape most likely to
      do this; a dedicated unit test covers a shot sinking two ships at
      once, verifying compensation charges don't double-count). `Player.tsx`
      gained a weapon selector (only shows a weapon if its ship is still
      afloat, disables it if unaffordable), an aim-then-confirm flow
      reusing the ghost-overlay pattern (a tinted reticle, not a ship image,
      since you're bombarding unknown territory) plus an orientation toggle
      for Triple, and a visible charge counter. 8 new/expanded unit tests
      (weapon geometry, charge economy math, weapon-unavailable-once-sunk,
      multi-ship-sinking shot). Verified live across two real browser tabs:
      accrued charges over several turns, sank a weapon-carrying ship
      (carrier) via ordinary hits and confirmed its own owner immediately
      lost the Cross option from their selector, then fired a Double weapon
      to sink a 2-cell ship in a single multi-cell shot and confirmed the
      sunk modal, sunk-ship ghost, and compensation charges (landing on the
      defender) all fired correctly. Zero console/server errors throughout.
- [x] **TASK-0035**: Battleship — Teams (M4c) — fixed 2-vs-2 team play on
      top of M4a/M4b. Design (team size, assignment method, placement
      collaboration model, firing-turn ownership) confirmed with the
      founder before implementation: fixed 2 vs 2; the host assigns each
      player to a side; one "captain" per side (`sides[side][0]`) places
      the fleet while their teammate watches read-only; either teammate can
      fire on their side's turn. A new Battleship-only `"teamSetup"` phase
      (`ASSIGN_SIDE`/`START_TEAMS` actions) only exists for a 4-player
      match — a 2-player match skips it entirely and behaves byte-for-byte
      as before M4c (every existing M4a/M4b reducer test passed
      unmodified). `answerPendingShot` narrowed from "any player on the
      defending side" to "that side's captain specifically," since a
      non-captain teammate's own private slice is never the real fleet —
      only a received mirror of it. `lib/realtime/teamState.ts` (new)
      implements `ADR-0005` §6's already-pre-approved per-side Realtime
      broadcast channel for real (`useTeamFleetChannel`): the captain
      broadcasts its fleet on every change, the teammate mirrors it into
      local state purely for rendering. Deliberately built entirely inside
      Battleship's own view code rather than extending the generic
      `usePrivateState`/`MultiDeviceRoom` mechanism, keeping the platform
      `GameModule` contract untouched. Recorded as `ADR-0005` v1.3.0.
      New unit tests cover team-assignment capping/transition and the
      captain-only defense guard. Verified live across **four** real,
      separately-connected browser tabs over actual Supabase Realtime:
      host assigned all 4 players to sides; the captain's fleet appeared
      live on the teammate's screen the instant it was placed (read-only,
      no edit controls); both teammates independently confirmed able to
      fire on their side's turn; the shot correctly resolved via the
      defending side's captain and synced to all 4 devices; the opposing
      side's screens showed zero ship data throughout. One real UX gap
      found and fixed during this same verification: the original
      team-assignment screen only showed side-picker buttons for
      *unassigned* players, so a host mis-click had no way to reassign
      someone already placed — reworked to always show every player with
      their current side highlighted, reassignable anytime before
      "¡Empezar!".

- [x] **TASK-0036**: Platform Tournament Bracket (M4d) — a single-elimination
      bracket of sequential 1-vs-1 matches, built as a **platform**
      capability above `GameModule` rather than inside Battleship, since it
      applies to any current or future two-side game. Design confirmed with
      the founder before implementation: entrants are individual players
      only (M4c teams stay separate, not combined with a bracket); the
      bracket is random (host only confirms the roster and taps "start,"
      no host-arranged seeding); automatic byes for a non-power-of-2 count;
      at least 3 players to start. `GameModule` gained one optional member,
      `getWinner?: (state) => string[] | null` (same non-breaking pattern
      as `ADR-0005`'s `setupPrivate`/`answerPending`) — only Battleship
      implements it. `lib/realtime/tournament.ts` (new): pure bracket
      construction (`buildFirstRound`, `buildNextRound`,
      `nextPlayableMatch`, `isRoundComplete`) and `advanceTournament` — the
      actual per-match advancement logic, deliberately extracted into this
      dependency-free file rather than left inline in
      `platformReducer.ts`'s reducer case, because importing
      `platformReducer.ts` directly in a test pulls in the whole game
      registry → each game's view components → `next-intl`/`next/navigation`,
      which don't resolve in this project's Node-only Vitest environment
      (no jsdom). `platformReducer.ts` gained `tournament: TournamentState
      | null`, two actions (`PLATFORM_START_TOURNAMENT`,
      `PLATFORM_ADVANCE_TOURNAMENT`), and a new `"TOURNAMENT_COMPLETE"`
      status; `useTournamentAdvance` watches the active match's
      `getWinner()` and advances the bracket automatically. **A serious bug
      found and fixed during live verification**: every connected device
      runs `platformReducer` against every broadcast action regardless of
      what it's currently rendering (a spectating player's device still
      tracks `gameState.gameState`), so with the hook wired unconditionally,
      all 4 devices independently detected a resolved match and each
      dispatched the advance action at nearly the same time — the first
      dispatch correctly advanced round 1's first match, but a second,
      near-simultaneous dispatch then incorrectly resolved round 1's
      *other* match too using the stale winner, completing the round with
      an invalid result and cascading straight into round 2, declaring a
      champion after just one real match played. Fixed by gating
      `useTournamentAdvance` to `isHost` only — the same "one authoritative
      device, not any device that notices" rule
      `PLATFORM_START_GAME`/`PLATFORM_START_TOURNAMENT` already follow.
      `TournamentBracket` (new platform component) shows any
      non-participant the live bracket status instead of a frozen game
      view (`ADR-0005` §5's "absence must be visible" spirit, extended to
      "you're not in this match either"), and doubles as the final
      champion screen. 13 new unit tests (bracket construction for 3/4/5
      players including a full 5-player simulation, and `advanceTournament`'s
      within-round-advance/new-round-build/champion-crowning/non-mutation
      behavior). 147 unit tests total. Verified live across four real,
      separately-connected browser tabs over actual Supabase Realtime:
      full bracket played start to finish (round 1's two matches including
      one bye, round 2's final), a non-participant correctly seeing the
      bracket instead of a frozen screen while a match was in progress, and
      the champion screen rendering correctly with the complete match
      history identically on every tab. A dev-only React console warning
      ("the final argument passed to useEffect changed size between
      renders") observed during that first live run was investigated and
      traced to this long session's many live Fast-Refresh/HMR reloads,
      not a real bug — confirmed by restarting the dev server clean and
      replaying the entire tournament flow (start, placement, firing,
      advance, champion) with zero console errors.

- [x] **Founder family playtest, 2026-07-27/28 night**: an extended real
      multi-device session across real phones, playing both Who Am I and
      Battleship. The founder reported reconnection held up with no
      dropped-room incidents and Who Am I's multi-device path "funciona
      perfecto" — no bugs surfaced during play. This closes two
      long-standing verification gaps at once: **M1's two-real-phones
      reconnection check** (open since M1 first shipped — the "remember
      the room" feature had only confirmed a *single* device dropping and
      silently rejoining, not the fuller multi-device/host-migration
      scenario this check was for) and **M3's outstanding multi-device Who
      Am I playtest** (previously only verified locally to the lobby, no
      live Supabase in the dev sandbox). No specific bugs were reported
      from this session, so no code changes accompany this entry —
      recorded here since it resolves two items `docs/ROADMAP.md` had been
      carrying as explicitly open since M1/M3.

- [x] **TASK-0037**: Connect 4 (M5) — a fourth game, prioritized ahead of
      M6's presentable-polish pass per the founder's explicit request (a
      family trip in about a week). Architecturally the simplest game on
      the platform: no hidden information at all, so `ADR-0005` doesn't
      apply. Design (hexagonal tokens on a clean board, a weighted-drop/
      column-preview/dramatic-win animation set) was worked out with the
      founder in conversation first, exploring three distinct directions
      per `PROJECT_CONSTITUTION.md` Article 10, then combining two of
      them. `GameModule` needed zero contract changes — new
      `games/connect4/winCheck.ts` (pure direction-based win detection
      through just the last-placed cell, `lowestEmptyRow`, `isBoardFull`),
      `reducer.ts` (mirrors Battleship's "skip setup when real players
      already exist" pattern: multi-device starts straight in `"playing"`,
      single-device starts in a `"config"` phase collecting local names
      like Impostor/Who Am I already do, since the platform always calls
      `setup([])` for single-device), `module.ts` (strictly 2 players, both
      device modes, `getWinner` wired for M4d's tournament for free).
      Draws are a real possible outcome with human play, handled via an
      immediate rematch rather than a hang. The B+C visual direction
      shipped by reusing `app/motion.css`'s existing `nx-strike`/
      `nx-celebrate` gestures — zero new keyframes needed. One real bug
      found and fixed live: the board's outer grid had no explicit width,
      collapsing every column to 0px (the same class of bug M4a's board
      verification found once before) — fixed with `w-full` plus switching
      the per-column row-grid to `auto` sizing. 25 new unit tests. Live
      verified: a full multi-device match to a win, single-device
      pass-and-play (a genuine shared screen, no reveal gate — the
      simplest device-mode implementation on the platform, since nothing
      is secret), and a real 3-player tournament (one bye, two matches)
      played to a champion with identical bracket history on all three
      tabs — confirming M4d's tournament capability generalizes to a
      second game with zero platform changes. Zero console errors
      throughout.

- [x] **Hotfix (unnumbered)**: Platform UX — leave-room warning, mid-game
      "return to lobby," and an accordion games list. Founder feedback
      after playing through Connect 4: tapping the top-bar "✕" left the
      game (and, in multi-device, the whole room) with zero warning, there
      was no way to switch games without fully exiting, and the games list
      grew one full-height card per game with no ceiling — already
      cumbersome at four games, worse as `BACKLOG.md`'s remaining three
      games ship. Three changes, all platform-level (no game-specific
      code touched):
      (1) **Exit confirmation** — new `components/ui/ConfirmDialog.tsx`
      (a real `role="alertdialog"`, focus-trapped, closes on Escape or a
      backdrop click same as Cancel). `Screen.tsx` (the shared top-bar
      primitive every session screen already used) now opens it instead
      of calling `onExit` directly; the message differs by mode ("vas a
      salir del juego y de la sala" for multi-device vs. just "del juego"
      for single-device, since there's no room to leave behind there).
      `Button` needed `forwardRef` added (a plain function component
      can't take a ref) so the dialog could focus its Cancel button on
      open.
      (2) **"Volver al lobby" while playing** — both
      `MultiDeviceRoom.tsx` (host-only, since it resets shared state for
      every connected device) and `SingleDeviceGamePicker` (no host
      concept there, always available) now show this button above the
      active game view, dispatching the same `PLATFORM_RETURN_LOBBY`
      action `TournamentBracket`'s existing button already used — no new
      platform action needed, just a second place to trigger the one that
      already existed.
      (3) **Games list accordion** — `RoomWaitingLobby.tsx`'s game cards
      were stacked full-height, one per game, unconditionally expanded;
      reworked into a true accordion (collapsed by default, opening one
      closes whichever was previously open) after presenting three layout
      options to the founder and getting this one confirmed. Caught one
      real regression before it shipped: the Battleship e2e test assumed
      "Jugar este" was immediately clickable — fixed the test to expand
      the game's header first, matching the new real interaction.
      Live-verified across two real browser tabs (multi-device: exit
      dialog on both messages, Cancel/Escape/confirm all correct,
      host-only "volver al lobby" mid-game returning both devices to the
      lobby with the room and roster intact) and locally (single-device:
      the lighter exit message, "volver al lobby" back to the picker).
      Zero console errors throughout.

## Tasks In Progress
- [ ] None.

## Known Issues
- None currently open.

## Next Task
- **Pick the next milestone**: M6 (presentable) per `docs/ROADMAP.md`, or
  another game from `BACKLOG.md`'s prioritized list (Guess Who, Ludo, a
  dice-and-track race game) — the founder's call, following the same
  pattern that led to Connect 4 (M5) being picked up ahead of M6.
- Still worth doing, independent of milestone sequencing: the founder
  playtesting Battleship's full feature set (M4a–M4d — weapons, 2-vs-2
  teams, and a tournament) specifically, since that family session covered
  Who Am I and Battleship broadly but wasn't a dedicated pass through every
  Battleship mechanic; every Battleship verification so far in this repo's
  history has used up to four browser contexts on one machine, not a
  dedicated real-device pass.
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice remains open (latent leak, not urgent) — see `HANDOFF.md`.

## Last Updated
- 2026-07-28
