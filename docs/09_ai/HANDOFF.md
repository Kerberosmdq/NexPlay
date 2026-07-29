# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: Hotfix (unnumbered) — founder feedback, not a roadmap milestone;
  plus the tail end of `TASK-0038`'s tracked follow-up (all 4 Guess Who art
  batches landed in this same session, see their own PRs #54–#57).
- **Title**: Guess Who — choose your own character; a "match resolved" modal
  gating tournament auto-advance across every game.

## Current Branch
- `feat/match-resolved-modal-and-character-selection`, branched off `main`
  after PR #57 (Guess Who's fourth art batch) merged.

## What's in this change

Two related pieces of founder feedback, both touching the platform level:

### 1. Guess Who: choose your own character
The secret character used to be auto-assigned at random the instant a device
had a real private slice — the founder's actual complaint: "the game itself
shouldn't hand you a character, you should pick who you are."

`games/guess-who/reducer.ts` gained a `"selecting"` phase between `"config"`
and `"playing"`: `readySides: Record<Side, boolean>` and a `CONFIRM_CHARACTER`
action carrying only the side (never the character id — the room only ever
learns "this side is ready," exactly Battleship's `SIDE_READY`/`"placing"`
shape). `createInitialState` (multi-device) and `START_MATCH` (single-device)
both now land in `"selecting"`; `CONFIRM_CHARACTER` flips to `"playing"` once
both sides have confirmed. `PLAY_AGAIN` now returns to `"selecting"` too — a
rematch means choosing again — which also subsumes the earlier ADR-0005
v1.4.0 stale-character fix from `TASK-0038` (that ref-based "re-pick on
entering playing" hack is gone; picking is just a real phase now).

- **Multi-device (`Player.tsx`)**: the old auto-pick `useEffect` is deleted.
  In `"selecting"`, the device renders the full grid; tapping a card sets
  `privateState.myCharacterId` (freely changeable), and a "Confirmar" button
  dispatches `CONFIRM_CHARACTER` once something's picked. After confirming,
  the device shows `WaitingState` until the shared phase flips. A ref-based
  phase-transition check clears the private slice on every fresh entry into
  `"selecting"` (not just when it's null) — without it, a rematch's grid
  would start pre-filled with the previous match's choice.
- **Single-device (`SingleDeviceView.tsx`)**: `RevealCard`'s hold-to-reveal
  gesture doesn't fit "hold to see the grid, then tap several cards, then
  confirm" — releasing to tap would hide it again. Replaced with a plain
  pass-the-phone gate ("Soy yo, elegir mi personaje") that, once tapped,
  shows the grid for that player only; confirming records the pick into
  local `assignments` state (single-device has no private-state channel at
  all) and dispatches `CONFIRM_CHARACTER` for that side, then resets the gate
  for the next player. Both players' confirms drive the exact same reducer
  action sequence multi-device uses — single-device is just one screen
  playing both roles.

### 2. A "match resolved" modal, for every game with `getWinner`, both device modes
The real bug, found by re-reading the tournament-advance code rather than
guessing: `useTournamentAdvance` (in `lib/realtime/platformReducer.ts`) fired
`PLATFORM_ADVANCE_TOURNAMENT` in a `useEffect` the instant `getWinner()`
returned a winner — no pause, no confirmation. The resolution screen would
render for a fraction of a render cycle and then get replaced by the next
match (or the champion screen) before anyone could see the final board or
how the match was won. This affected Connect 4, Battleship, and Guess Who
identically, since it's a shared platform mechanism, not a per-game bug.

New `components/platform/MatchResolvedModal.tsx`: shows "¡Partida
terminada! / Ver tablero / Salir de la partida" the moment the active game's
`getWinner()` resolves, for **every** match — tournament or standalone, in
both device modes (per the founder's explicit answer: not tournament-only).
"Ver tablero" just dismisses the modal locally (a ref tracks which resolved
`gameState` it was shown for, so it doesn't reappear until a genuinely new
match resolves). "Salir de la partida" is host-gated in multi-device (always
available in single-device, no host concept there) and does whatever used to
happen automatically: `PLATFORM_ADVANCE_TOURNAMENT` if there's a tournament
in progress, `PLATFORM_RETURN_LOBBY` otherwise.

`useTournamentAdvance`'s automatic effect was deleted entirely from
`platformReducer.ts`, replaced by a plain `getActiveMatchWinners(platformState)`
helper (no dispatch, no `useEffect`, no `useRef`) that both `MultiDeviceRoom.tsx`
and the single-device picker (`app/[locale]/page.tsx`) call directly.

**A real gap found during live testing, fixed before this shipped**: a host
with a tournament bye is a *spectator* in the currently-playing match
(`MultiDeviceRoom.tsx`'s existing `!isMatchParticipant` early return shows
them `TournamentBracket` instead of the game view). The modal was originally
only rendered on the match-participant branch — so a bye'd host, the *only*
device allowed to dispatch the advance action, never saw the modal at all,
and the bracket sat stuck on the just-resolved match forever with no way for
anyone to continue. Fixed by rendering `MatchResolvedModal` alongside
`TournamentBracket` too, sharing the same `handleContinueAfterMatch` callback
extracted above both branches.

### Live verification
Across three real, separately-connected browser tabs, a full 3-player
tournament: multi-device character selection (each device independently
choosing and confirming, no coordination, matching ADR-0005's accepted
1-in-32 collision risk); round 1 resolving to a correct-guess win, both
match participants seeing the modal (the non-host with "esperando a que el
anfitrión continúe" instead of a continue button); the bye'd host correctly
gated on their own modal instance and able to advance; round 2 resolving to
a wrong-guess loss; the champion screen only appearing after the host
explicitly clicked "Salir de la partida." Also verified standalone
single-device: selection phase (pass-the-phone gate for both players), a
full match to a correct-guess win, the modal appearing and correctly
dismissing to reveal the board underneath, and a rematch correctly
restarting the selection loop. Zero console errors throughout every check.

## Files Modified / Added
- `games/guess-who/reducer.ts` (`"selecting"` phase, `readySides`,
  `CONFIRM_CHARACTER`)
- `games/guess-who/views/Player.tsx` (selecting-phase grid + confirm,
  removed auto-pick)
- `games/guess-who/views/SingleDevice.tsx` (pass-the-phone selection gate,
  removed `pickTwoDistinctCharacterIds`)
- `components/platform/MatchResolvedModal.tsx` (new)
- `components/platform/MultiDeviceRoom.tsx` (modal wired into both the
  match-participant view and the bye'd-host spectator view; shared
  `handleContinueAfterMatch`)
- `app/[locale]/page.tsx` (modal wired into the single-device picker)
- `lib/realtime/platformReducer.ts` (`useTournamentAdvance` deleted,
  replaced by `getActiveMatchWinners`)
- `i18n/es.json`, `i18n/en.json` (`Lobby.matchResolved*` keys; `GuessWho`
  selecting-phase keys; removed now-unused `singleDevice.revealTitle`/
  `holdToReveal`/`continueButton`)
- `tests/unit/guess-who-game.test.ts` (rewritten: a `startPlaying()` helper
  drives state through the new selecting phase; new `CONFIRM_CHARACTER`
  test block; `PLAY_AGAIN` now asserts a return to `"selecting"`)

Also landed in this same session (separate PRs, already merged): Guess
Who's remaining 3 art batches (#55, #56, #57) — see their own PR
descriptions and the `ADR-0005` v1.4-adjacent script fixes for
`generate-guesswho-assets.mjs`'s `--split` precision improvements.

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`, strict
  branch protection, GitHub Actions secrets configured.
- All 32 Guess Who characters now have real portrait art — the placeholder
  path in `CharacterCard.tsx` has no live callers for the current roster,
  but is kept in place for any future roster growth.

## A testing-methodology note worth remembering (carried forward)
Console log dumps can exceed the tool's token limit on a long-running dev
session (`read_console_messages` without a filter overflowed at ~63K
characters this session) — use the `pattern` parameter (e.g.
`"Error|error"`) to search instead of dumping everything. Also reconfirmed:
restarting the dev server clean after a batch of hot-reloads is worth doing
before trusting a scary-looking console error — this session saw a stale
`useTournamentAdvance doesn't exist in target module` error that was already
fixed in the source, left over from a mid-edit HMR pass.

## Pending Tasks
- A dedicated founder playtest of Battleship's full feature set (M4a–M4d —
  weapons, 2-vs-2 teams, tournament) on real phones specifically is still
  worth doing — every verification in this repo's history so far has used
  up to four browser contexts on one machine, not a dedicated real-device
  pass.
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice — the latent leak the ADR documents is real but not urgent.
- The two remaining games from `BACKLOG.md`'s prioritized list (Ludo, a
  dice-and-track race game) — each its own future milestone, not yet
  started.

## Next Suggested Task
- The founder's call: **M7 (presentable)** per `docs/ROADMAP.md`, or the
  next game from `BACKLOG.md`'s prioritized list (Ludo is next). Follow
  the same pattern used for every game so far: a design conversation with
  the founder (exploring distinct directions per `PROJECT_CONSTITUTION.md`
  Article 10 whenever there's a real visual/UX decision to make) before
  any code.
