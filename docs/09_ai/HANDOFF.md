# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: `TASK-0040` — redesign phase 0 (docs only).
- **Title**: `BDR-0002` — Juguetería (molded plastic toy) becomes NexPlay's
  visual direction, superseding `BDR-0001` (Paper & Felt).
- **Previous task**: `TASK-0039` — redesign phase 1, UX flow fixes (PR #61).
  Its notes are kept below.

## Current Branch
- `docs/bdr-0002-jugueteria`, branched off `feat/ux-flow-fixes` (PR #61)
  because the state docs build on that PR's entries. Its PR targets
  `feat/ux-flow-fixes`; once #61 merges, GitHub retargets it to `main`.

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
- **Phase 2 — visual system** (tokens, fonts, baseplate and molded-edge
  primitives, capsule reveal, per-game pictograms replacing emoji, hex
  token mark and icon set). Next.
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
- M6.5 phase 2 — the visual system per `BDR-0002` (tokens, fonts, molded
  edge primitives, capsule `RevealCard`, pictograms, hex token icons).
  Large: worth splitting into a primitives task and per-game restyle tasks.
