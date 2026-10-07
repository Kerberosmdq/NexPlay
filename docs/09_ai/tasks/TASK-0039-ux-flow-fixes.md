# TASK-0039: UX flow fixes (redesign phase 1)

### Goal
First phase of the founder-requested full redesign (2026-10-06 audit). This
phase fixes flow and usability defects that are independent of the visual
direction, so it can ship before the new look (Direction C, "Juguetería",
to be recorded in `BDR-0002` as a separate docs task). It moves
NexPlay toward `docs/ROADMAP.md`'s M7 bar: a stranger can be handed the URL
and play without any explanation from the founder.

### Scope — in
1. **Pass-and-play reveal gating (single-device).**
   - Impostor: the "next player" button stays disabled until the current
     player has actually held the reveal card at least once, and a handoff
     screen ("Pasale el teléfono a Leo" → "Soy Leo") sits between players so
     the next name is never shown on top of the previous player's secret.
   - Who Am I: each turn starts on a handoff screen; the word and the turn
     timer only appear once the player taps "Listo" with the phone on their
     forehead (today the timer starts before they're holding the phone).
   - `RevealCard` gains an optional `onReveal` callback (backwards
     compatible).
2. **One clear exit per screen (single-device).** The in-game "Salir" text
   links are removed (they duplicated the top bar's ✕). "Volver al lobby"
   moves into the top bar as a back button ("← Juegos") next to the ✕.
3. **Remember the family.** Player names typed in any single-device game are
   stored on this device (localStorage only, same pattern as
   `lib/realtime/session.ts`) and prefilled in every single-device game's
   setup, with the entry-screen name first.
4. **Entry screen fixes.** The mode switch no longer clips at 375px
   ("MULTIDISPOSITIV"); entry-screen labels/placeholders/buttons drop the
   forced uppercase + wide tracking (FEEL.md: kids read words by shape).
5. **No premature errors.** Setup screens show a neutral hint and a disabled
   start button instead of a red error before the user has done anything.
6. **How to play.** Every game gets a three-step "¿Cómo se juega?" dialog,
   reachable from the single-device game picker and the multi-device lobby's
   games list. The single-device picker also shows each game's description
   and player count, and lists games that need several phones (Battleship)
   as unavailable with the reason instead of hiding them.
7. **Spanish voice: voseo.** Founder decision (2026-10-07): all Spanish UI
   copy uses vos consistently (`i18n/es.json`). Recorded in `FEEL.md`'s
   Voice section.

### Scope — out (non-goals for this task)
- Any visual restyle (tokens, fonts, textures, icons, the Juguetería
  direction itself) — phase 2, after `BDR-0002`.
- Motion, sound, haptics — phase 3.
- Gameplay changes (who-starts coin flip, family scoreboard, forehead tilt
  sensor, vote-by-vote reveal) — later per-game tasks.
- Multi-device flows beyond adding the how-to-play entry point.
- Any change to the `GameModule` contract (ADR-0002) — how-to-play content
  uses the existing `games.<id>.*` i18n key convention, like `description`.

### Files this task may touch
- `app/[locale]/page.tsx`
- `components/ui/*`, `components/platform/*`
- `games/*/views/SingleDevice.tsx`
- `games/impostor/views/Player.tsx`, `games/who-am-i/views/Player.tsx` —
  only to turn their "not enough players" red error into a neutral hint
  (item 5).
- `lib/family/*` (new), `lib/hooks/*`
- `i18n/es.json`, `i18n/en.json`
- `tests/unit/*`, `tests/e2e/*`
- `docs/04_design/FEEL.md`, `docs/09_ai/*`

### Relevant context
- 2026-10-06 audit + four design directions (founder chose C, voseo).
- `ADR-0004` (design-system primitives), `ADR-0002` (views contract),
  `docs/04_design/FEEL.md`.

### Definition of Done
- `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.
- Unit tests cover the family-roster storage helper (save/load/merge,
  corrupt and unavailable storage).
- i18n parity test passes (every new key exists in both locales).

### How to verify
- `pnpm lint && pnpm typecheck && pnpm test`
- Browser at 375×812, `/es`: entry screen shows no clipped text; start
  single-device, open Impostor → names prefilled, no red error; reveal flow
  can't skip a player; top bar shows "← Juegos" and ✕ only; "¿Cómo se juega?"
  opens for each game.
