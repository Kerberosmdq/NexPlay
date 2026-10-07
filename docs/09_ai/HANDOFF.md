# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: `TASK-0039` — UX flow fixes (redesign phase 1).
- **Title**: Pass-and-play reveal gating, one way back + one way out,
  remembered family names, entry-screen fixes, no premature errors,
  "how to play" for every game, and Spanish unified on voseo.

## Current Branch
- `feat/ux-flow-fixes`, branched off `main` at `ebe5d36` (after PR #59).
  Independent of the still-open `fix/battleship-playability` (PR #60).

## Context: the redesign this task opens
On 2026-10-06 the founder asked for a full redesign (visual, UX, motion,
gameplay). An audit of the shipped app plus four mocked visual directions
(A "Cuaderno de Recreo" — school graph-paper notebook; B "Riso Club";
C "Juguetería"; D "Teatro de Sombras") were presented; the founder chose
**A** and **voseo**, and asked to start with phase 1. Planned phases:
- **Phase 0 — `BDR-0002`** superseding `BDR-0001` (Paper & Felt) with
  Direction A, then FEEL.md + ADR-0004 tokens rewritten for it. Not started.
- **Phase 1 — this task.** Flow fixes that don't depend on the look.
- **Phase 2 — visual system** (tokens, fonts, paper textures, hand-drawn
  per-game icons replacing emoji, redrawn hexagon mark, new primitives).
- **Phase 3 — motion, sound, haptics** (phase transitions, Web Audio kit
  with mute, `navigator.vibrate` on Android, per-world celebrations).
- Per-game gameplay ideas from the audit (who-starts coin flip in Connect 4,
  vote-by-vote reveal in Impostor, forehead tilt mode in Who Am I, family
  scoreboard across games, splitting Battleship's 1105-line view first)
  are each their own later task.

## What's in this change
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

## Files Modified / Added
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

## Warnings
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
- **Phase 0: `BDR-0002`** — record Direction A ("Cuaderno de Recreo") as
  superseding `BDR-0001`, with B/C/D as evaluated alternatives; then
  FEEL.md and ADR-0004 token updates.
- Phases 2 and 3 of the redesign (see "Context" above).
- A dedicated founder playtest of Battleship's full feature set on real
  phones (carried forward).
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice (carried forward, latent, not urgent).
- Ludo and the dice-and-track race game from `BACKLOG.md` (carried forward).

## Next Suggested Task
- `BDR-0002` (docs-only branch), then phase 2 of the redesign.
