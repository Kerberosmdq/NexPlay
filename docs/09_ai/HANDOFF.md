# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0037
- **Title**: Connect 4 (M5)

## Current Branch
- `feat/connect4`, branched off `main` after PR #47 (M4d tournament) merged.

## What's in this task

M5 — a fourth game, prioritized ahead of M6's presentable-polish pass per
the founder's explicit request (a family trip in about a week meant more
games mattered more than outward-facing polish right now). Architecturally
the simplest game on the platform to date: **no hidden information at
all** — both players see the full board at all times — so `ADR-0005`'s
private-state mechanism doesn't apply here.

### Design conversation before any code
Per `PROJECT_CONSTITUTION.md` Article 10 (every significant screen explores
at least three design directions before implementation), three distinct
board/token/animation directions were presented and discussed with the
founder:
- **Option A** — classic wooden-frame board, plain flat-color discs.
- **Option B** — hexagonal tokens (echoing the NexPlay hexagon/die
  identity) on a clean board, a translucent ghost-token preview before
  committing a move.
- **Option C** — minimalist plain tokens, all the investment going into a
  weighted physics-feeling drop and a dramatic win sequence (board dims
  except the four winning tokens).

The founder chose **B's board/token + C's animation**, combined. Not
chosen: A's wooden-frame look, C's plain (non-hexagonal) token.

### Scope decisions
- **Strictly 1-vs-1** for this task — team play is an explicit non-goal
  (Battleship's M4c teams stay Battleship-specific; a future task could add
  Connect 4 teams if ever asked for).
- **Board fixed at the canonical 7×6** — no host-facing size config.
- **Draws are a real, if rare, possible outcome** with human (non-optimal)
  play — a full board with no four-in-a-row. Resolved via an immediate
  rematch (`PLAY_AGAIN`), not left as an unhandled edge case. This matters
  for tournament play specifically: a game's `getWinner()` must never
  falsely report a winner, or `useTournamentAdvance` would advance the
  bracket on a match that didn't actually decide anything. A drawn match
  simply doesn't advance until a decisive rematch produces a real winner —
  needed no platform change, only the game itself had to get this right.
- **Motion: reuse the existing vocabulary, add nothing new.** `nx-strike`
  ("drops in from above and settles, like a shell/bomb impact") already
  fits a falling disc — Battleship's shots use the exact same gesture for
  its own falling-impact animation. `nx-celebrate` (a bounce) fits the four
  winning tokens. Dimming the rest of the board on a win is a plain opacity
  state, not an animation. Zero new `app/motion.css` keyframes were added.
- **Single-device is fully supported and unusually simple**: since nothing
  is ever secret, it's the *same* board render as multi-device, just on one
  shared screen with a "pass to {name}" indicator instead of a reveal
  gate — no hold-to-reveal, no hidden phase. First game on the platform
  where this is true (Battleship can't support single-device at all;
  Impostor/Who Am I need a real reveal-and-pass loop).

### `games/connect4/winCheck.ts` (new, pure)
`checkWin(cells, lastMoveIndex)` checks only the four directions
(horizontal, vertical, both diagonals) through the just-placed cell — not a
full-board scan every move — and returns the winning run's cell indices (or
`null`). `lowestEmptyRow(cells, column)` / `isBoardFull(cells)` round out
the pure helpers, mirroring `battleship/placement.ts`'s "pure geometry, zero
reducer/React dependency" pattern.

### `games/connect4/reducer.ts`
- `Connect4Phase = "config" | "playing" | "resolution"`. `"config"` only
  exists when `setup()` didn't already receive two real player ids — this
  is the discovery that shaped the whole reducer: **the platform always
  calls a single-device game's `setup([])` with an empty players array**
  (confirmed by reading `app/[locale]/page.tsx`'s `SingleDeviceGamePicker`,
  which dispatches `PLATFORM_START_GAME` with `players: []` unconditionally
  for every single-device game). Multi-device's two already-connected real
  players skip `"config"` entirely and start straight in `"playing"` — the
  same "skip the setup phase when real players already exist" shape
  Battleship's `"teamSetup"` phase already established (skipped entirely
  for a 2-player match).
- `cells` is a **flat 42-length array**, row-major, index 0 = top-left —
  deliberately not a 2D array, for the same "fewer indexing bugs" reason
  `tournament.ts`'s flat `rounds` array was already chosen over nesting.
- `DROP_DISC { column, side }`: rejects (state unchanged) if it's not that
  side's turn, the phase isn't `"playing"`, or the column is full.
  Otherwise places the disc, runs `checkWin`, and transitions to
  `"resolution"` on a win or a draw, or just flips `turn`.
- `START_MATCH { playerIds }`: only valid from `"config"`, populates
  `sides` and moves to `"playing"` — dispatched by the single-device view
  once local names are collected.
- `PLAY_AGAIN`: resets the board, alternates `firstMoverSide` each rematch
  so a long session doesn't always favor whoever moved first originally.

### `games/connect4/module.ts`
`minPlayers: 2, maxPlayers: 2, supportedModes: ["single-device",
"multi-device"]`. No `configSchema` entries. No `TPrivate`/`setupPrivate`/
`answerPending` — defaults to `never`, same as Impostor/Who Am I.
`getWinner: (state) => (state.phase === "resolution" && state.winnerSide ?
[state.sides[state.winnerSide]] : null)` — wrapped in an array to match the
contract's `string[] | null` shape even though a side is always exactly one
player id here.

### Views
- `games/connect4/views/Board.tsx` (new, shared pure-render component):
  the 7×6 grid, hexagonal tokens (`clip-path` on plain divs — no new image
  assets), the column hover/press ghost-token preview, `motion-strike` on
  the just-placed cell (diffs the previous `cells` prop via a ref to find
  which index changed, same technique Battleship's `Player.tsx` already
  uses for shot results), and the win-sequence dim/celebrate treatment.
  Used identically by both device modes — no knowledge of single- vs
  multi-device.
- `games/connect4/views/Player.tsx` (multi-device `host`+`player`, same
  component for both, matching Impostor/Who Am I precedent): turn
  indicator, the shared `Board`, win/draw banner, host-only "jugar de
  nuevo" (matches Battleship/Who Am I's existing host-gating on
  `PLAY_AGAIN`).
- `games/connect4/views/SingleDevice.tsx` (new): local name collection in
  `"config"` (mirrors Who Am I's `makeLocalPlayers` pattern), then the same
  shared `Board` with a "pásale el teléfono a {name}" indicator. Anyone can
  trigger "jugar de nuevo" here (no host concept in single-device).

### A real bug found and fixed during live verification
The board rendered as a single tiny ~2px shape instead of a 7×6 grid on the
first live check — **the exact same class of bug** M4a's Battleship board
verification found once before ("`inline-grid` with `1fr` columns has no
width to distribute"). Root cause: `Board`'s outer `grid` container had no
explicit width, so `grid-template-columns: repeat(7, minmax(0, 1fr))`
computed to `0px 0px 0px 0px 0px 0px 0px` — confirmed via
`getComputedStyle().gridTemplateColumns` in a live `javascript_tool` check.
Fixed by adding `w-full` to the outer grid, and — a second, related issue —
switching the per-column row-grid from `gridTemplateRows: repeat(6,
minmax(0, 1fr))` to `repeat(6, auto)`, since `1fr` tries to distribute an
*available* height that was never actually defined; each row's real height
already comes from its own cell's `aspect-square`, so `auto` (content-sized)
is the correct sizing, not a fraction of an undetermined total.

### Tests
25 new unit tests: `tests/unit/connect4-winCheck.test.ts` (13 — all four
win directions, near-misses that must not false-positive, `isBoardFull`/
`lowestEmptyRow` edge cases) and `tests/unit/connect4-game.test.ts` (12 —
`createInitialState`'s config-vs-playing branch, `START_MATCH` gating,
normal `DROP_DISC` play, out-of-turn and full-column rejection, a match
resolving to a win, a draw detected via a board hand-verified by
exhaustive backtracking search to contain zero four-in-a-row runs anywhere
— not hand-eyeballed, since an early attempt at hand-constructing a
"safe" pattern turned out to have diagonal wins I'd missed — and
`PLAY_AGAIN` resetting state and alternating `firstMoverSide` across two
consecutive rematches). 172 unit tests total, all passing.

### Live verification
Three separate checks, all over actual Supabase Realtime / real browser
sessions:
1. **Multi-device**: two real, separately-connected browser tabs played a
   full match to a real win (horizontal four-in-a-row). Board synced
   correctly on both tabs, win/loss banners correct, winning tokens at
   full opacity with the other side's tokens dimmed to 0.35, "jugar de
   nuevo" correctly alternated the first mover to the side that lost.
2. **Single-device**: local name collection, pass-and-play with the
   turn indicator (no reveal gate at all, confirmed nothing is hidden at
   any point), a full match to a win with correct name resolution in the
   win banner, and a working rematch.
3. **Tournament** (validates M4d generalizes to a *second* game with zero
   platform changes): a real 3-player tournament — one bye, two real
   matches — played to a champion across three separately-connected
   browser tabs, with identical, correct bracket history confirmed on
   every tab.

Zero console errors across every check.

## Files Modified / Added
- `games/connect4/winCheck.ts` (new)
- `games/connect4/reducer.ts` (new)
- `games/connect4/module.ts` (new)
- `games/connect4/views/Board.tsx` (new)
- `games/connect4/views/Player.tsx` (new)
- `games/connect4/views/SingleDevice.tsx` (new)
- `lib/realtime/platformReducer.ts` (one registry line, `AVAILABLE_GAMES`)
- `i18n/es.json`, `i18n/en.json` (`games.connect4.*`, `Connect4.*`)
- `tests/unit/connect4-winCheck.test.ts` (new)
- `tests/unit/connect4-game.test.ts` (new)
- `docs/09_ai/tasks/TASK-0037-connect4.md` (new)
- `docs/ROADMAP.md` (M5 inserted ahead of the renumbered M6, marked done)
- `docs/09_ai/CURRENT_STATE.md`, this file
- `docs/BACKLOG.md` (Connect 4 marked graduated to `ROADMAP.md`'s M5)
- `docs/00_decisions/architecture/ADR-0003-SCALABILITY-AND-PRIVACY-SEAMS.md`
  (its "M5" reference renumbered to "M6" alongside the roadmap reorder)

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`, strict
  branch protection, GitHub Actions secrets `NEXT_PUBLIC_SUPABASE_URL`/
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured (added for PR #39's e2e job).

## A testing-methodology note worth remembering (carried forward, reused again)
Same-profile multi-tab testing needs a distinct player identity per tab,
but all tabs share one `localStorage` — navigate the new tab once, then in
the *same* script call, `localStorage.clear(); location.reload();` before
doing anything else with it, and re-check every *previously* set-up tab is
still intact afterward. New this task: element `ref`s returned by
`read_page` can go stale across a re-render (a game state change after a
move) even when the underlying DOM node is arguably "the same" button —
reusing an old `ref` after the page has re-rendered can silently no-op or
misfire. The reliable pattern is to call `read_page` fresh immediately
before every click when the page might have changed since the last read,
and to verify the actual resulting state via `get_page_text` after each
action rather than assuming a click landed. This also explains an
apparent-bug false alarm during this task's own verification: a board that
looked "empty except one ghost token" right after a "start match" button
click turned out to be the *correct*, fresh board of a newly-started match
(the tournament had already auto-advanced), not evidence of failed prior
clicks — always check whether the underlying game/match actually changed
before treating a confusing screenshot as a bug.

## Pending Tasks
- A dedicated founder playtest of Battleship's full feature set (M4a–M4d —
  weapons, 2-vs-2 teams, tournament) on real phones specifically is still
  worth doing — every verification in this repo's history so far has used
  up to four browser contexts on one machine, not a dedicated real-device
  pass.
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice — the latent leak the ADR documents is real but not urgent.
- The three remaining games from `BACKLOG.md`'s prioritized list (Guess
  Who, Ludo, a dice-and-track race game) — each its own future milestone,
  not yet started.

## Next Suggested Task
- The founder's call: **M6 (presentable)** per `docs/ROADMAP.md` — landing/
  marketing surface, full ES/EN content coverage, pre-launch privacy/legal
  review — or continue with the next game from `BACKLOG.md`'s prioritized
  list (Guess Who is next: 1-vs-1 deduction over a secret character,
  reusing Who Am I's/`ADR-0005`'s per-player-secret shape but needing a new
  character-grid content pack with portraits). Follow the same pattern
  used for Connect 4: a design conversation with the founder (exploring
  distinct directions per `PROJECT_CONSTITUTION.md` Article 10 where the
  task has a real visual/interaction decision to make) before any code.
