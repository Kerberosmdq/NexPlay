# TASK-0037: Connect 4 (M5)

### Goal
Ship `docs/ROADMAP.md`'s M5: a fourth game, Connect 4 — standard 7×6 board,
1-vs-1, first to connect four wins. Architecturally the simplest game on the
platform so far: **no hidden information at all**, so `ADR-0005`'s
private-state mechanism doesn't apply, and it's the first game where
single-device is a genuinely trivial "shared screen, no reveal needed" mode
rather than a reveal-and-pass loop.

### Design decisions (confirmed with the founder before implementation)
- **Strictly 1-vs-1** for this task — `minPlayers`/`maxPlayers` both `2`.
  Team play (à la Battleship M4c) is an explicit non-goal here; revisit only
  if the founder asks for it later, as its own follow-up task.
- **Board is fixed at 7 columns × 6 rows** (the canonical size) — no
  host-facing config option. Deviating board size arguably makes it a
  different game, not a config variant.
- **Visual direction — confirmed after exploring 3 options** (per
  `PROJECT_CONSTITUTION.md` Article 10), combining two of them:
  - Board/token (from "Option B"): hexagonal tokens — echoing the NexPlay
    hexagon/die identity, not plain circles — on a clean board with no
    heavy wooden-frame treatment.
  - Animation (from "Option C"): a weighted, physics-feeling drop; a
    column-highlight/ghost-token preview before committing a move; a
    dramatic win sequence (the board dims except the four winning tokens,
    which bounce/glow).
  - Not chosen: "Option A"'s plain-circle/wooden-frame classic look, and
    "Option C"'s plain (non-hexagonal) token.
- **Motion: reuse the existing named vocabulary, add nothing new.**
  `nx-strike` ("drops in from above and settles, like a shell/bomb impact")
  already is the weighted-drop animation Battleship's shots use — it fits
  a falling disc without a new keyframe. `nx-celebrate` (a triumphant
  bounce) fits the four winning tokens. Dimming the rest of the board on a
  win is a plain opacity state, not a new animation. If live verification
  shows either reused gesture doesn't actually read right at Connect 4's
  scale/duration, that's the moment to add a new named gesture — not
  before, per the "don't invent per-screen one-offs" rule ADR-0004 already
  established.
- **Draws are possible and need a decided resolution.** A full board with
  no four-in-a-row is a real (if rare) outcome, not an edge case the
  reducer can ignore — `getWinner` must be able to report "no winner, ever,
  for this match" distinctly from "still in progress," so `BattleshipState`-
  style tournament advancement doesn't hang forever waiting for a winner
  that will never come. Resolution: a draw ends the match in `resolution`
  phase with `winnerSide: null` and a `isDraw: true` flag; the view offers
  an immediate rematch (fresh board, same two players); a drawn match
  inside a tournament simply doesn't advance the bracket until a decisive
  rematch produces a real winner — `useTournamentAdvance` already only
  fires on a non-null `getWinner()`, so this needs no platform change,
  only the game itself must never claim a winner it doesn't have.
- **Single-device is fully supported, and is unusually simple to build**:
  since nothing is ever secret, the single-device view is the *same* board
  render as multi-device, just on one shared screen with a "pass to
  {name}" turn indicator instead of a reveal gate — no hold-to-reveal, no
  hidden phase. First game on the platform where this is true.

### Win detection (pure, unit-testable, no I/O)
New `games/connect4/winCheck.ts`, mirroring `battleship/placement.ts`'s
pattern (pure helpers, no reducer/React dependency):
- `checkWin(cells, lastMoveIndex): number[] | null` — checks the four
  directions (horizontal, vertical, both diagonals) through the
  just-placed cell only (not a full-board scan every move), returns the
  four winning cell indices or `null`.
- `isBoardFull(cells): boolean` — draw check.
- `lowestEmptyRow(cells, column): number | null` — where a disc dropped
  into `column` would land, or `null` if the column is full (an invalid
  move).

### Reducer (`games/connect4/reducer.ts`)
- `Connect4State`: `{ phase: "playing" | "resolution"; cells: (Side |
  null)[]; sides: Record<Side, string>; turn: Side; winnerSide: Side |
  null; winningLine: number[] | null; isDraw: boolean }`. `cells` is a
  flat 42-length array, row-major, index 0 = top-left (row 0, col 0) —
  same "flat array over nested arrays" simplicity `tournament.ts`'s
  `rounds` already models structurally, chosen for the same reason: fewer
  indexing bugs than a 2D array threaded through win-checking.
- `DROP_DISC { column, side }`: rejects (returns state unchanged) if it's
  not that side's turn, the phase isn't `"playing"`, or the column is
  full. Otherwise places the disc, runs `checkWin`, and transitions to
  `resolution` (`winnerSide` + `winningLine` set) on a win, or to
  `resolution` with `isDraw: true` if the board is now full with no win,
  or just flips `turn` otherwise.
- `PLAY_AGAIN`: resets to a fresh board, same two `sides`, alternating who
  goes first each rematch (so a best-of-several session doesn't always
  favor the original first mover) — same spirit as Battleship's
  `PLAY_AGAIN`.

### `games/connect4/module.ts`
- `meta`: `minPlayers: 2, maxPlayers: 2, supportedModes: ["single-device",
  "multi-device"]`.
- No `configSchema` entries (empty config) — see design decisions above.
- No `TPrivate`/`setupPrivate`/`answerPending` — this game has nothing to
  hide, so the type parameter defaults to `never` exactly like
  Impostor/Who Am I.
- `getWinner: (state) => (state.phase === "resolution" && state.winnerSide
  ? [state.sides[state.winnerSide]] : null)` — wrapped in an array to match
  the contract's `string[] | null` shape even though a side is always
  exactly one player id here (no teams in this task).

### Views
- `games/connect4/views/Board.tsx` (new, shared, pure-render component):
  the 7×6 grid, hexagonal token rendering, the column ghost-preview on
  hover/press, the `motion-strike` drop and `motion-celebrate` +
  board-dim win treatment. Takes `cells`, `onColumnClick`, `winningLine`,
  `disabled` as props — no knowledge of single- vs multi-device, so both
  view components below share it instead of duplicating board markup.
- `games/connect4/views/Player.tsx` (multi-device `host`+`player`, same
  component for both — matches Impostor/Who Am I's precedent): turn
  indicator, the shared `Board`, win/draw banner with a "jugar de nuevo"
  button.
- `games/connect4/views/SingleDevice.tsx` (new): the same shared `Board`,
  a "pásale el teléfono a {name}" indicator instead of a connection-status
  header — no reveal/hold gate, since there's nothing to hide.

### Scope — in
- `games/connect4/winCheck.ts`, `reducer.ts`, `module.ts`, `views/Board.tsx`,
  `views/Player.tsx`, `views/SingleDevice.tsx`.
- Registering `connect4GameModule` in `lib/realtime/platformReducer.ts`'s
  `AVAILABLE_GAMES` and the single-device picker's filter (already generic
  by `supportedModes`, per M4a — no changes needed there beyond the
  registry line).
- `i18n/es.json`, `i18n/en.json`: a `games.connect4.*` catalog entry plus a
  `Connect4.*` section (turn indicator, win/draw banners, "jugar de nuevo",
  "pásale el teléfono a {name}").
- Unit tests: `winCheck.ts` (all four win directions, near-misses that
  must NOT count, a full-board draw) and the reducer (normal play, an
  invalid move on a full column, an invalid move out of turn, win
  detection wired end to end, `PLAY_AGAIN` resets correctly and alternates
  first mover).
- Marking `docs/ROADMAP.md`'s M5 done, updating `CURRENT_STATE.md`/
  `HANDOFF.md`.

### Scope — out (non-goals for this task)
- Team play / more than 2 players (explicit non-goal, see design decisions).
- Any board-size configuration.
- A new named motion gesture — reuse the existing vocabulary; only revisit
  if live verification proves it's genuinely insufficient.
- Any changes to `ADR-0002`'s `GameModule` contract, `ADR-0005`, or
  `platformReducer.ts`'s tournament orchestration — this game should slot
  in using exactly what M4d already built, proving that capability works
  for a *second* game, not just Battleship.

### Files this task may touch
- `games/connect4/` (new folder: `module.ts`, `reducer.ts`, `winCheck.ts`,
  `views/Board.tsx`, `views/Player.tsx`, `views/SingleDevice.tsx`)
- `lib/realtime/platformReducer.ts` (one registry line, `AVAILABLE_GAMES`)
- `i18n/es.json`, `i18n/en.json`
- `tests/unit/connect4-winCheck.test.ts` (new), `tests/unit/connect4-game.test.ts` (new)
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md`

### Relevant context
- `docs/ROADMAP.md` — M5 section (design decisions already confirmed,
  written there).
- `ADR-0002` — the `GameModule` contract; this task should need zero
  changes to it.
- `games/battleship/module.ts`/`reducer.ts` — the closest prior art for a
  "two sides, one board, `getWinner`" game; read before starting, but
  Connect 4 is simpler (no phases beyond playing/resolution, no privacy).
- `lib/realtime/tournament.ts`/`platformReducer.ts`'s tournament
  orchestration (M4d, `TASK-0036`) — Connect 4 must plug into this
  unmodified; if it doesn't, that's a signal the tournament capability
  wasn't as generic as M4d claimed, and worth flagging rather than
  patching around.
- `app/motion.css` — the four (now six, post-Battleship) named gestures;
  reuse `nx-strike`/`nx-celebrate` per the design decisions above.

### Definition of Done
- Everything in `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.
- Unit tests cover: all four win directions, a shot that almost-but-
  doesn't connect four (must not false-positive), a full-board draw, an
  out-of-turn move rejected, a full-column move rejected, `PLAY_AGAIN`
  resetting state and alternating who moves first.
- Live verification: a full multi-device match to a real win (two
  separately-connected browser tabs over actual Supabase Realtime), a
  single-device pass-and-play match on one screen, and — since this
  exercises M4d for a second game — starting a Connect 4 tournament with
  ≥3 players and confirming the bracket advances correctly.
- `docs/ROADMAP.md`'s M5 marked done; `CURRENT_STATE.md`/`HANDOFF.md`
  updated.

### How to verify
- `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm test:e2e`.
- Multi-tab and single-device live browser checks per the Definition of
  Done above.
