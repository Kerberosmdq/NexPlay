# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: Hotfix (unnumbered)
- **Title**: Family playtest fixes — wake lock, Impostor turn rotation, +100 words per game

## Current Branch
- `fix/family-playtest-fixes`, branched off `main` after `PR #27`
  (`TASK-0030`, hexagon identity) merged. Unrelated to M3.5 — this is a
  cross-cutting bugfix/content task touching already-shipped M2
  (Impostor) and M3 (Who Am I), plus a new small platform-level hook.

## What's in this task
The founder played several real matches with their family the night of
2026-07-24 and came back with three issues, asked to be fixed "lo antes
posible" for that same night's next session. Bundled into one task
because they were reported together and are individually small — matches
the project's own "Hotfix (unnumbered)" precedent for exactly this
situation.

1. **Screen wake lock.** The family had to go into their phone's own
   settings and disable the lock-screen timeout entirely just to keep a
   mid-round match from going dark — not something anyone should have to
   do per-app. `lib/hooks/useWakeLock.ts` wraps the Screen Wake Lock API:
   feature-detected (silently no-ops on browsers without support — this
   is a nicety, must never throw or block rendering), held for the
   duration of `session !== null` in `app/[locale]/page.tsx` (from the
   lobby-wait screen through an active game, not the entry screen), and
   re-acquires on `visibilitychange` since the OS releases the lock
   whenever the tab is hidden (backgrounded, screen manually turned off).
   Verified live by monkey-patching `navigator.wakeLock.request`: zero
   calls on the entry screen, one call the instant a session starts.

2. **Impostor: rotate who starts discussion.** `PROCEED_TO_DISCUSSION`
   used to always set `turnOrder: state.aliveIds`, and `aliveIds` derives
   from the original `playerIds` order — meaning whoever was first in
   that list (typically whoever's name was typed/joined first) was
   *always* asked to speak first, every round, every match, all night.
   Fixed by adding `discussionsStarted: number` to `ImpostorState`
   (initialized to 0 in `module.ts`'s `setup()`, **never reset** by
   `START_GAME` or `PLAY_AGAIN` — it has to persist across the whole
   session for the rotation to actually go somewhere over a night of
   matches) and rotating the *stable* `playerIds` order by
   `discussionsStarted % playerIds.length` before filtering down to
   `aliveIds`, in `reducer.ts`'s `PROCEED_TO_DISCUSSION` handler. Rotating
   the stable full roster (not the shrinking `aliveIds` array directly)
   avoids ambiguity about what "rotate by one" means once someone's been
   eliminated mid-match. Deliberately scoped to *discussion order only* —
   `playerIds`/`aliveIds` themselves are untouched, so single-device's
   reveal order and the `roundPlayers`/`names` positional zip in
   `SingleDevice.tsx` (which assumes `state.playerIds[i]` lines up with
   the locally-held `names[i]`) are both completely unaffected. Rotating
   *that* array instead would have silently mismatched names to ids in
   single-device — deliberately avoided, not just untested.
   3 new unit tests in `tests/unit/impostor-game.test.ts` (rotates across
   discussion rounds within a match; survives `PLAY_AGAIN` into a new
   match without resetting; correctly skips an eliminated player while
   preserving everyone else's relative rotated order). Verified live: a
   3-way tie sent the group back to discussion, and the second round
   started with a different player than the first.

3. **+100 words per game.** The founder was worried about repeats across
   several matches in one night — Impostor had exactly 100 words, Who Am
   I had 85. Added a new, non-overlapping 100-word batch to
   `games/impostor/content/{es,en}.ts` and
   `games/who-am-i/content/{es,en}.ts` (kept in ES/EN parity, per
   `ADR-0003`'s localized-content-pack requirement), spanning 9 new
   categories neither pack had yet: more animals (insects, small
   mammals), more food, more household items, clothing, sports, musical
   instruments, more nature/weather, school supplies, and body parts.
   Impostor is now 200 words, Who Am I is 185. Both games' word pools
   already reuse the *same underlying concepts* where practical (matching
   how their original ~85-100 word packs were already near-identical
   apart from Impostor's extra Professions category) — Impostor gets
   `category`/`easyHint`, Who Am I gets an `emoji`, per each type's own
   shape. **Caught and fixed one real bug during verification**: the new
   "Pescado" (a food item) and the existing "Pez" (an animal) both
   translate to "Fish" in English — Spanish distinguishes them,
   English doesn't by default. Confirmed via a grep-based duplicate-word
   check across all four content files (not just duplicate `id`s, which
   were already fine) before this was caught; renamed the food entry to
   "Seafood" in both `en.ts` files to keep every displayed word unique
   within its own pack. This check is worth repeating for any future word
   additions — duplicate IDs alone don't catch duplicate display text.

## Files Modified / Added
- `lib/hooks/useWakeLock.ts` (new)
- `app/[locale]/page.tsx` (`useWakeLock` wired to `session !== null`)
- `games/impostor/reducer.ts` (`discussionsStarted` field + rotation
  logic), `games/impostor/module.ts` (`setup()` seeds it at 0)
- `games/impostor/content/es.ts`, `en.ts` (+100 words each, 200 total)
- `games/who-am-i/content/es.ts`, `en.ts` (+100 words each, 185 total)
- `tests/unit/impostor-game.test.ts` (`discussionsStarted: 0` added to
  the test helper's base state; 3 new rotation tests)
- `docs/09_ai/CURRENT_STATE.md`, this file

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`,
  strict branch protection. Unchanged by this task.
- The Screen Wake Lock API requires a secure context (HTTPS or
  localhost) and is not supported on all browsers (notably older iOS
  Safari versions) — the hook degrades silently on those, so nothing
  breaks, but don't expect it to work everywhere. Worth knowing if the
  founder reports it "still locking" on a specific older device — check
  browser support before assuming the hook itself is broken.
- The founder played on real phones the night of 2026-07-24 with these
  bugs live in production — this fix wasn't triggered by an automated
  audit, it's real user-facing feedback from actual family play. Treat
  reports like this with priority; they're the most valuable signal this
  project gets.

## Pending Tasks
- **M3.5 code task 3b (Polish):** still queued, unaffected by this task —
  a visible language switcher, room-code copy/share affordance, and a
  final accessibility pass. See the M3.5 milestone in `docs/ROADMAP.md`.
- Founder playtest of multi-device Who Am I on real phones (M3's last open
  item). Worth checking with the founder whether last night's session
  covered this, since they played several real matches — if so, mark M3
  ✅ in `docs/ROADMAP.md`; if not, it's still open.
- M1's dedicated two-real-phones reconnection test (independent, still
  open from earlier handoffs).
- Consider whether Who Am I could use the same "who starts" rotation
  fairness Impostor just got — Who Am I doesn't have an equivalent
  turn-order concept today (per `TASK-0029`'s handoff, guessing is
  anytime/self-reported, not turn-locked), so this may not apply the same
  way; not raised by the founder, not scoped here.

## Next Suggested Task
- Confirm with the founder that tonight's session went well with these
  three fixes before moving on to anything else — this was explicitly
  time-sensitive.
- After that: M3.5 code task 3b, or whatever the founder prioritizes next
  based on tonight's play.
