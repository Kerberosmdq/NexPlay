# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: Hotfix (unnumbered) — founder feedback after a real Battleship
  session, not a roadmap milestone.
- **Title**: Battleship playability — the board no longer moves when you fire,
  water is blue and hits are red, a special shot shows its whole shape, and a
  device's secret no longer carries across tournament matches.

## Current Branch
- `fix/battleship-playability`, branched off `main` after PR #59 (Guess Who
  portrait framing) merged.

## What's in this change

Four defects. The founder reported the first three plus a tournament freeze;
the fourth is what investigating that freeze turned up.

### 1. The screen moved on every shot
Two separate layout shifters, both above the boards in the same flex column:

- The hit/miss banner mounted and unmounted, pushing everything down for 2.2s
  and then back up.
- **The larger one**: the weapon card is gated on `isMyTurn && !pendingShot`,
  so it vanished the instant you fired and reappeared when your turn came
  back — moving both boards by its full height *every single turn*.

The banner and turn-status blocks now sit in fixed-height slots. The boards
moved **above** the controls, because reserving space for a card whose height
varies with weapon count would have left a permanent blank gap instead.
Measured live: the board's top stayed constant (0px drift) across a full
fire → announce → clear cycle. It also puts the controls in thumb reach.

### 2. Everything rendered red
The strike branch returned `bg-action-danger` regardless of result, and a miss
settled to `bg-surface-well` (`#ded0b4`) — nearly identical to an unfired
cell's `bg-surface-sunken` (`#e7d9c0`). So a miss flashed red and then went
effectively invisible. Colour now always follows the result; the strike only
adds motion on top.

This needed the palette's first blue (`--color-water` — ADR-0004 forbids raw
hex outside `tokens.css`). **Worth knowing**: the first draft was a deep navy
that paired beautifully with white but sat at 1.11:1 against the wine red, so
water and a hit were separated by hue alone — the first thing to fail in
sunlight or with red-green colour blindness. A new test asserts the board's
three cell states separate by *lightness*, and it is what caught this. Final
`#2d7ab8`: 4.58:1 with white, 2.09:1 vs a hit, 3.29:1 vs an unfired cell.

### 3. A special shot coloured one square, not its shape
`strikeCell` was a single `string | null` while the diff loop called its setter
once per new cell — last cell wins. Now a `Set`, with the whole diff collected
before touching state. Note the effect's own comment had already predicted
this ("M4b's multi-cell shots will need to handle more than one new cell per
update; this loop already does") — the loop did, the state it wrote to didn't.
Compounded by (2), since the shape's missed cells were invisible anyway.
The announcement had the identical last-cell-wins flaw and now summarizes via
a new `firing.multiAnnouncement` key (ES+EN). Verified live: a Cross animated
all 5 cells at once, a Double both.

### 4. Secrets leaked across tournament matches
`usePrivateState` keys a device's private slice by `(room, game, player)` with
**no match identity**, so a tournament's next match silently inherited the
previous one's secret. Reproduced live: the winner of round 1 arrived at the
final already showing "¡FLOTA LISTA!", still holding the exact layout their
previous opponent had just spent a whole match mapping out.

This is the same bug class `TASK-0038` fixed for Guess Who — but that fix
lived in Guess Who's *own view*, so the platform-level cause was never
addressed and Battleship still had it. Fixed generically this time:

- `PlatformState` gained `matchNumber`, incremented on every match the
  platform starts (`PLATFORM_START_GAME`, `PLATFORM_START_TOURNAMENT`,
  `PLATFORM_ADVANCE_TOURNAMENT`), and included in the private-state key.
  Deliberately a plain counter, not a random id: every device has to derive
  the same key from the same shared state, and `Math.random()` stays out of
  the reducer.
- Battleship's own "Jugar de nuevo" rematch reuses the same match number, so
  its view *also* clears the fleet on entering `placing`. Keyed on the phase
  **transition**, not on "the board looks fresh" — `PLAY_AGAIN` resets shots
  and readySides to exactly their start-of-match values, so any snapshot of
  those is identical between a first placement and a rematch and the reset
  would never fire the second time.

Guess Who's view-level workaround was left in place (it is harmless and now
redundant); folding it into the platform mechanism is a safe future cleanup.

## Warnings for the next agent

**The reported tournament freeze was NOT reproduced.** The founder said the
tournament "se nos tildó luego de la primera partida". A full 3-player
tournament — round 1 played to a win, host advance, final placed and firing —
advanced correctly both *before* and *after* these fixes, across three real
browser tabs over actual Supabase Realtime. The stale-fleet defect (4) is the
leading candidate and is real, but it was never observed to hang anything.

Do not assume it is fixed. Unanswered questions worth asking the founder:
how many players, which round it froze on, what each device showed, and
whether anyone had left or reloaded. Two code-level suspects worth checking
if it recurs:

- `advanceTournament` applies the winner to `currentRound.findIndex(m => m.winner === null)`
  — the *first* unresolved match, not necessarily the one that just played.
  Harmless while matches are strictly sequential; becomes wrong the moment
  they are not (see the simultaneous-matches task queued next).
- A shot is resolved only by the defending side's captain device
  (`answerPendingShot`). If that device is gone or holds an empty fleet,
  `pendingShot` never clears and the match freezes with no visible error.

## Testing-methodology note (new, worth reusing)

Multi-device verification in the in-app browser needs a trick: **all tabs share
one `localStorage`**, so a second tab silently rejoins as the *same* player,
and reloading any tab adopts whichever identity was written last. The app's
`userId` is app-generated (not the Supabase auth uid), so the working recipe
is: clear the `nexplay:*` keys, reload, fill name + room code, remove
`nexplay:last-identity:v1` again immediately before clicking join, and then
**never reload that tab**. Also useful: arming an opponent tab with a
`setInterval` that fires whenever it is that tab's turn turns a 24-round-trip
match into two tool calls.

## Files Modified / Added
- `games/battleship/views/Player.tsx` (fixed-height banner/turn slots; boards
  moved above the controls; `strikeCells` Set; result-driven cell colour;
  fleet reset on entering `placing`)
- `app/tokens.css` (`--color-water` / `--color-on-water`)
- `tests/unit/design-tokens.test.ts` (water/on-water AA pair; new
  lightness-separation assertions for the board's three cell states)
- `lib/realtime/platformReducer.ts` (`PlatformState.matchNumber`)
- `components/platform/MultiDeviceRoom.tsx` (match-scoped private-state key)
- `i18n/es.json`, `i18n/en.json` (`Battleship.firing.multiAnnouncement`)

`platformReducer.ts` still has no unit tests — importing it pulls in every
game's view components and therefore `next-intl`/`next/navigation`, which do
not resolve in this project's Node-only Vitest environment. `matchNumber` was
verified live instead (the private-state keys visibly became
`nexplay:private:<room>:battleship:1:<player>` and `...:2:...`).

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
- **Simultaneous tournament matches** — the founder asked for this in the
  same session as the hotfix above and confirmed it as the next piece of
  work. With 4 or 6 entrants they want every match in a round played at the
  same time so nobody sits idle, then the winners meet.

  This is milestone-sized, not an adjustment. The bracket is sequential *by
  construction*: `PlatformState` holds exactly one `gameState` ("the match
  being played") and `nextPlayableMatch` returns one match at a time. N
  concurrent matches reaches the platform reducer, the room sync, the
  bracket view, the private-state key (`matchNumber` becomes per-match, not
  per-room) and `MatchResolvedModal`. Note `advanceTournament`'s
  first-unresolved-match assumption breaks here — see Warnings above.

  One design decision already taken with the founder: round advancement
  becomes **automatic** once every match in a round resolves. The current
  host-gated "Salir de la partida" per match does not scale when the host
  is not playing in most of them. Write a task spec before any code, per
  the usual pattern.
- After that, the founder's call: **M7 (presentable)** per
  `docs/ROADMAP.md`, or the next game from `BACKLOG.md`'s prioritized list
  (Ludo is next). Follow the same pattern used for every game so far: a
  design conversation with the founder (exploring distinct directions per
  `PROJECT_CONSTITUTION.md` Article 10 whenever there's a real visual/UX
  decision to make) before any code.
