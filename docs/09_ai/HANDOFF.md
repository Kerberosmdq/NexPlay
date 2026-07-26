# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: Hotfix (unnumbered)
- **Title**: Who Am I — "too hard, change my word" button

## Current Branch
- `feat/who-am-i-reroll-word`, branched off `main` after the lobby-logo
  fix merged.

## What's in this task
Founder feature request, arriving right after the earlier "rotate who
starts discussion" fix in Impostor: they want a way to bail on a word
that's too hard for a specific player (7- and 9-year-old in the family)
without ending that player's turn. Two decisions the founder made
explicitly, both honored as scoped:

1. **Who Am I only, not Impostor.** Impostor has one *shared* secret word
   — swapping it mid-round would mean resetting the whole group's
   discussion, a much bigger and messier change than what was asked. Who
   Am I assigns a distinct word *per player*, so "change my word" is a
   clean, isolated, per-player operation with no ripple effect on anyone
   else's game state.
2. **Anyone can trigger it**, no host-only or self-only gate — a casual
   family game, not worth the friction of a permission check.

### Implementation
- `games/who-am-i/reducer.ts`: added `REROLL_WORD` to `WhoAmIAction`
  (`{ playerId, newWord }`). The reducer only swaps
  `wordAssignments[playerId]` and appends `newWord.id` to `usedWordIds` —
  ignored (returns the same state reference) if the phase isn't
  `"playing"` or that player already resolved (guessed or lost), mirroring
  the existing `isDone` guard `GUESS_CORRECT`/`GUESS_WRONG` already use.
- `games/who-am-i/pickRound.ts`: added `pickReplacementWord(locale,
  usedWordIds)` — same shape and never-used-this-match rule as
  `pickAssignments`, kept outside the reducer for the same reason
  (`Math.random()` and the locale content pack can't live in pure code
  per `CONVENTIONS.md`).
- `games/who-am-i/views/Player.tsx` (multi-device) and `SingleDevice.tsx`:
  a small underlined text-link button (matching the existing
  `endRoundButton`'s visual weight — deliberately *not* a full primary/
  danger `Button`, since this is a low-frequency escape hatch, not a core
  action) rendered right below the correct/wrong buttons, calling
  `pickReplacementWord` then dispatching `REROLL_WORD`.
- `i18n/es.json` / `en.json`: new `WhoAmI.playing.rerollButton` key in
  both, kept in parity.
- `tests/unit/who-am-i-game.test.ts`: 4 new tests (swaps the word and
  marks it used while leaving other players' words untouched; ignored
  outside `playing`; ignored for an already-guessed player; ignored for
  an already-lost player).

Verified live end-to-end in single-device: mid-turn, the button changed
the displayed word (🦉 Búho → 👟 Zapato) *without* advancing to the next
player or resetting that turn's countdown; guessing correctly right after
still advanced to the next player normally. Zero console errors.

### Also answered in passing
The founder asked whether the app supports 8 players in one match ahead
of a session starting shortly. Checked both `games/impostor/module.ts`
and `games/who-am-i/module.ts`: both declare `maxPlayers: 12`, and a grep
across `lib/realtime/` and `components/platform/` turned up no additional
hardcoded room-size cap. 8 players is fully supported in either game,
no changes needed.

## Files Modified / Added
- `games/who-am-i/reducer.ts`, `games/who-am-i/pickRound.ts`
- `games/who-am-i/views/Player.tsx`, `SingleDevice.tsx`
- `i18n/es.json`, `i18n/en.json`
- `tests/unit/who-am-i-game.test.ts`
- `docs/09_ai/CURRENT_STATE.md`, this file

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`,
  strict branch protection. Unchanged by this task.

## Pending Tasks
- **M3.5 code task 3b (Polish):** still queued — a visible language
  switcher, room-code copy/share affordance, and a final accessibility
  pass. See the M3.5 milestone in `docs/ROADMAP.md`.
- Founder playtest of multi-device Who Am I on real phones (M3's last open
  item).
- M1's dedicated two-real-phones reconnection test (independent, still
  open from earlier handoffs).
- Not raised by the founder, not scoped here, but worth a `BACKLOG.md`
  note if it comes up again: should Impostor get an equivalent "this is
  too hard" escape hatch? It would need a different shape (rerolling the
  *shared* word affects everyone's discussion so far), so it isn't a
  copy-paste of this task.

## Next Suggested Task
- Whatever the founder prioritizes after tonight's session with 8
  players — this was answered ahead of a game starting shortly, so
  expect possible fast-turnaround follow-ups again.
- Otherwise: M3.5 code task 3b.
