# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: `TASK-0045` — M6.5 phase 2b, game 4 of 5.
- **Title**: Guess Who restyled on the Juguetería system, plus one board per
  player in single-device mode.
- **Previous tasks**: `TASK-0044` (Connect 4, PR #66), `TASK-0043` (#65),
  `TASK-0042` (#64), `TASK-0041` (#63), `TASK-0040` (#62), `TASK-0039`
  (#61). Notes below.

## Current Branch
- `feat/jugueteria-guess-who`, stacked on `feat/jugueteria-connect4` (#66)
  → #65 → #64 → #63 → #62 → #61. Merge oldest first.

## What TASK-0045 changed
- `CharacterCard.tsx`: white plastic holder on a molded edge, yellow border
  when selected, presses down when tapped; crossed out = flipped down to the
  purple back with a "?" (name kept), `aria-pressed` reflects it. Placeholder
  trait overlays hidden while flipped.
- `views/parts.tsx` (new): `FacePicto`, `CharacterBoard` (grid + remaining
  counter + "what a tap does" hint, red outline while guessing),
  `toggleCrossedOut`, `ResultBlock` (purple).
- `Player.tsx`: own character as a small card beside the ask-aloud hint,
  primary "Adivinar", board via `CharacterBoard`, result block.
- `SingleDevice.tsx`: **one crossed-out set per side** (`Record<Side, Set>`)
  with a name key row to switch boards; a guess uses the visible board's
  owner (`GuessWho.singleDevice.whoIsGuessing` removed). Local players are
  rebuilt from names if the view remounts.
- i18n: `remainingCount`, `guessHint`, `flipHint`,
  `singleDevice.boardOwnerLabel`.

## Warnings (TASK-0045)
- Multi-device Guess Who not seen live (Supabase unreachable).
- Portraits are still the generic cartoon style; redrawing them is the open
  founder decision in `BDR-0002` (the agent writes the image prompts, the
  founder runs them).

## What TASK-0044 changed
- `games/connect4/views/parts.tsx` (new): `Disc` (hex token with a molded
  edge — an edge layer under the face, because clip-path clips shadows;
  optional last-move dot), `TurnBanner`, `ResultBlock`, `HEX_CLIP`.
- `Board.tsx`: green plastic frame on its edge, dark hex sockets, discs via
  `Disc`, last move dotted until the next drop, focus ring on columns,
  aria-label from i18n (`Connect4.columnLabel`, was hardcoded Spanish).
- `Player.tsx` / `SingleDevice.tsx`: turn banner, result block, setup with
  each name next to its disc; single-device turn reads "Turno de {name}".
- Single-device `nameOf` falls back to rebuilding players from the entered
  names (ids are deterministic) if `localPlayers` is empty after a remount.

## Warnings (TASK-0044)
- In the dev browser pane, CSS animations sometimes sit at time 0 when the
  window isn't painting (the match-resolved modal looked transparent). It's
  the environment, not the app — the same animation runs fine once frames
  are drawn. Don't "fix" it by removing `motion-deal`.
- Multi-device Connect 4 not seen live (Supabase unreachable).

## What TASK-0043 changed
- `games/who-am-i/views/Pictos.tsx` (new): head-with-question-mark,
  phone-on-forehead, got-it, missed. Decorative emoji gone; **word emoji
  kept on purpose** (content for the youngest player, FEEL.md).
- `games/who-am-i/views/parts.tsx` (new): `TimerPicker` (toy keys),
  `WordCard` (yellow forehead card), `RoundClock`, `OwnResult`,
  `GuessIcon`, `formatTime`.
- Both views rewritten on those pieces; "Acerté" uses the new green
  `success` button.
- Shared layer: `components/ui/Picto.tsx` (Impostor's pictos now use it),
  `components/ui/KeyRow.tsx` (moved from Impostor's parts; keys use
  `!px-1 min-w-0` so five fit at 375px), `Button` `success` variant,
  `--color-success-hover` (+ contrast test).
- **Bug fix:** `games/who-am-i/module.ts` `setup` stored the schema's string
  default `"300"` in `timerSeconds: number`; now `parseTimerSeconds` in
  `reducer.ts` (pure, unit-tested). Other games' schemas use real numbers;
  Battleship's `boardSize` is a string union (`"8" | "10"`) on purpose.

## Warnings (TASK-0043)
- Multi-device Who Am I not seen live (Supabase unreachable from the dev
  machine).

## What TASK-0042 changed
- `games/impostor/views/Pictos.tsx` (new): the game's own pictograms (mask,
  bubble, ballot, tie, check, crown, worried face, star, pass-the-phone),
  replacing every emoji.
- `games/impostor/views/parts.tsx` (new): pieces both views share — toy
  key rows for impostor count and clue difficulty (replacing `<select>`s),
  the capsule's closed label and revealed content, colored outcome blocks,
  the elimination outcome.
- `Player.tsx` / `SingleDevice.tsx`: nested `Card`s removed (Screen's tray
  is the panel), outcome blocks, two-column voting keys, secondary buttons
  for "Ir a votación" / "Falló", pass-the-phone pictogram on handoffs,
  "Vota {name}" on single-device voting.
- **Privacy fix (single-device discussion):** the shared screen showed
  `discussion.impostorTip` whenever the impostor was the speaker. Now every
  speaker gets `discussion.speakerTip`. The single-device e2e spec walks all
  three turns and asserts the impostor tip never appears.
- `PlayerChip` roster pill is now a raised white piece (sits in a sunken
  roster tray).
- i18n: emoji removed from `eliminationResult.*`; new short clue labels,
  `needsPlayersHint`, `speakerTip`, `voterTurn`. The old
  `games.impostor.config.needsPlayers` key is now unused (kept, harmless).

## Warnings (TASK-0042)
- Multi-device Impostor was restyled but not seen live (Supabase doesn't
  resolve from the dev machine) — same caveat as #63.

## What TASK-0041 changed
- **Tokens** (`app/tokens.css`): `BDR-0002`'s palette under the existing
  semantic names (`surface*`, `ink*`, `action-*`…), plus `ground`,
  `accent`, `success`, per-game colors (`game-<id>` + `on-` + `edge-`),
  and molded-edge tokens (`--color-edge-*`, `--edge-sm/md/lg`). Penumbra
  tokens removed. `design-tokens.test.ts` now checks 31 pairs, including
  focus ring ≥3:1 on white and on the ground, and water separation.
- **Fonts**: Titan One (`font-display`) + Baloo 2 (`font-sans`); Space Mono
  stays as `font-mono` for digits only — Baloo 2's tabular figures were not
  verified yet (check before dropping it).
- **Ground**: `body` is the studded baseplate (`app/globals.css`).
- **Primitives**: `Button` sits on a solid edge and sinks by it on press;
  disabled loses the edge; inactive toggles are flat sockets. `Card` and
  `Dialog` are white plastic panels. `Field`/`CodeInput` are sunken
  wells / yellow keycaps. `Screen` keeps the top bar on the ground and
  wraps every screen's content in **one white tray** — that's what keeps
  text off the blue in game views that weren't restyled yet.
  `RevealCard` is now a yellow egg capsule (deliberately not red-over-white,
  which read as a well-known ball from a trademarked franchise); while held,
  a baseplate cover hides everything else.
- **New**: `components/ui/NexMark.tsx` (hex token, default glyph = four
  studs), `components/platform/GameIcon.tsx` (pictograms + block color
  classes per game id; platform layer, no GameModule change).
- **Platform screens**: entry, single-device picker (colored game blocks,
  compact "?" how-to key), waiting lobby (code as keycaps, colored game
  rows, single column inside the tray), match-resolved modal.
- **Icons**: `scripts/generate-icons.mjs` now renders the hex token SVG with
  sharp; `app/icon.png`, `app/apple-icon.png`, `public/icons/*` regenerated.
  `public/NexPlay_Logo.png` is no longer referenced by code (kept as a
  founder asset).
- **Game views (class swaps only)**: penumbra text classes → ink/action/
  success (the reveal card is white now); `text-action-secondary` used as
  text → `text-accent` (yellow on white is 1.54:1).

## Warnings (TASK-0041)
- **Waiting lobby not seen live**: multi-device needs Supabase, which
  doesn't resolve from the dev machine. Typecheck passes; look at it on a
  real connection before or during phase 2b.
- **Game views look interim**: their own `Card` wrappers now sit inside
  `Screen`'s tray (a panel inside a panel), boards keep their old layouts,
  emoji illustrations remain. That's phase 2b, by design.

## What TASK-0040 changed
- `docs/00_decisions/brand/BDR-0002-VISUAL-IDENTITY-JUGUETERIA.md` (new):
  the decision, the four alternatives, eleven rules every screen follows,
  and palette anchors with measured contrast. The mock-up's red (#EF3B2D)
  and green (#1FA357) fail AA with white text (3.94:1, 3.26:1) and were
  replaced by #D3261B (5.17:1) and #178244 (4.87:1).
- `BDR-0001`: status Superseded (1.1.0).
- `docs/04_design/FEEL.md`: rewritten for the toy-box world (baseplate =
  table, depth = molded edge, pressable things move; capsule reveal).
- `ADR-0004`: amended to 1.1.0. Sections 1–5 unchanged; adds solid-edge
  elevation tokens (blurred shadows become a violation), retires the
  penumbra token set, extends the motion vocabulary (press/drop/snap).
- `docs/ROADMAP.md`: the redesign is milestone **M6.5**, ahead of M7.
- `docs/09_ai/tasks/TASK-0040-bdr-0002-jugueteria.md` (new), state docs.

## Warnings (TASK-0040)
- **The founder first said Direction A, then corrected it to C.** Every doc
  now says C (Juguetería); PR #61 got a follow-up commit and its
  description was edited to match. If anything still says "Cuaderno de
  Recreo" as the chosen direction, it's stale.
- Phase 2 must keep `ADR-0004`'s paired-token names and the contrast unit
  test; only values change, plus the new edge tokens.
- Guess Who portraits: open founder decision whether to redraw them in the
  toy style (needs the external image tool). Phase 2 only frames them.

## Context: the redesign (M6.5)
On 2026-10-06 the founder asked for a full redesign (visual, UX, motion,
gameplay). An audit of the shipped app plus four mocked visual directions
(A "Cuaderno de Recreo" — school graph-paper notebook; B "Riso Club";
C "Juguetería" — molded plastic toy; D "Teatro de Sombras") were presented;
the founder chose **C** and **voseo** (first saying A by mistake, corrected
to C on 2026-10-07), and asked to start with phase 1. Phases:
- **Phase 1 — UX flow fixes** (`TASK-0039`, PR #61). Done.
- **Phase 0 — `BDR-0002`**, `FEEL.md`, `ADR-0004` 1.1.0 (`TASK-0040`). Done.
- **Phase 2a — shared visual system** (`TASK-0041`). Done.
- **Phase 2b — per-game restyles**, one task per game. Impostor
  (`TASK-0042`), Who Am I (`TASK-0043`), Connect 4 (`TASK-0044`) and Guess
  Who (`TASK-0045`) done; Battleship to go.
- **Phase 3 — motion, sound, haptics** (phase transitions, toy-physics
  gestures, a plastic Web Audio kit with mute, `navigator.vibrate` on
  Android).
- Per-game gameplay ideas from the audit (who-starts coin flip in Connect 4,
  vote-by-vote reveal in Impostor, forehead tilt mode in Who Am I, family
  scoreboard across games, splitting Battleship's 1105-line view first)
  are each their own later task.

## What TASK-0039 changed (phase 1, PR #61)
1. **Reveal gating (single-device).** Impostor: a handoff screen ("Pasale el
   teléfono a Leo" → "Soy Leo") before each reveal; the next-player button
   is disabled until the card was actually held open (`RevealCard` gained an
   optional `onReveal`, plus Space/Enter keyboard support so the gate never
   locks out keyboard users). Who Am I: each turn opens on a handoff screen
   and the turn timer only starts on "Listo" (before, it ran while the phone
   was being passed).
2. **One way back, one way out.** In-game "Salir" links removed from all four
   single-device views; "Volver al lobby" moved from the view into
   `Screen`'s top bar as "← Juegos" (`onBack`/`backLabel`/`backAriaLabel`).
   Multi-device keeps its host-only "Volver al lobby" (different meaning:
   it returns *everyone*).
3. **Remembered family.** `lib/family/roster.ts` stores names typed in
   single-device setups in localStorage (device-only, same tier as
   `lib/realtime/session.ts`, not durable server data — no ADR-0001 change)
   and prefills every single-device setup; the entry-screen name is
   remembered first so the phone's owner leads the list.
4. **Entry screen.** Mode switch labels "Varios teléfonos / Un teléfono" (no
   more clipped "MULTIDISPOSITIV" at 375px); forced uppercase + wide
   tracking removed from the entry screen, `Field` and `CodeInput` labels.
5. **No premature errors.** Setup screens show a neutral hint + disabled
   start button instead of a red error box (single-device Impostor/Who Am
   I/Connect 4/Guess Who, and multi-device Impostor/Who Am I host config).
6. **How to play.** New `components/platform/HowToPlay.tsx` (three steps
   from `games.<id>.howTo.step1..3`, same catalog convention as
   `description`, no `GameModule` change), reachable from the single-device
   picker and the multi-device lobby accordion. New `components/ui/Dialog.tsx`
   modal shell; `ConfirmDialog` now builds on it. The single-device picker
   lists every game with description and player count; games that can't run
   on one phone (Battleship) are shown last, dimmed, with "Necesita varios
   teléfonos".
7. **Voseo + sentence case** across `i18n/es.json` (recorded in FEEL.md's
   Voice section); English catalog also drops its ALL-CAPS strings.

## Files Modified / Added (TASK-0039)
- `app/[locale]/page.tsx`, `components/platform/{RoomLobby,RoomWaitingLobby}.tsx`,
  `components/platform/HowToPlay.tsx` (new)
- `components/ui/{Screen,RevealCard,ConfirmDialog,Field,CodeInput,index}.tsx|ts`,
  `components/ui/Dialog.tsx` (new)
- `games/{impostor,who-am-i,connect4,guess-who}/views/SingleDevice.tsx`,
  `games/{impostor,who-am-i}/views/Player.tsx` (red error → neutral hint only)
- `lib/family/roster.ts` (new)
- `i18n/es.json`, `i18n/en.json`
- `tests/unit/family-roster.test.ts` (new, 10 tests),
  `tests/e2e/single-device-pass-and-play.spec.ts` (new),
  `tests/e2e/{battleship-multi-device,locale-routing}.spec.ts` (copy updates)
- `docs/04_design/FEEL.md`, `docs/09_ai/tasks/TASK-0039-ux-flow-fixes.md`
  (new), `docs/09_ai/{CURRENT_STATE,HANDOFF}.md`

## Warnings (TASK-0039)
- **`battleship-multi-device.spec.ts` could not be run locally**: the
  Supabase host didn't resolve from this machine (`ERR_NAME_NOT_RESOLVED`,
  room screen shows "No se pudo conectar a la sala"). Only its copy changed
  ("Crear sala nueva", "Entrar a la sala", "Colocá tu flota"); CI is the
  real check for it. The new single-device spec and `locale-routing` pass
  locally.
- Phase 2 will restyle everything this task touched — this task kept the
  current Paper & Felt look on purpose. Don't start phase 2 before
  `BDR-0002` exists.
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
- Phases 2 and 3 of the redesign (see "Context" above).
- A dedicated founder playtest of Battleship's full feature set on real
  phones (carried forward).
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice (carried forward, latent, not urgent).
- Ludo and the dice-and-track race game from `BACKLOG.md` (carried forward).

## Next Suggested Task
- M6.5 phase 2b — last game: Battleship. Split its 1105-line
  `views/Player.tsx` (board, fleet placement, weapons, announcements)
  before restyling it; it's multi-device only, so it can't be checked in
  the dev browser without Supabase.
