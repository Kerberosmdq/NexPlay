# TASK-0026: Who Am I Game (M3)

### Goal
Implement "Who Am I" as the second real game (`docs/ROADMAP.md` M3), whose
explicit purpose is to prove the platform is truly reusable — this should
be "just a new `GameModule`," with zero changes to the shared platform,
`MultiDeviceRoom`, `platformReducer`, or `useRoomConnection`. Game design
was worked out with the founder in conversation before writing any code;
see the design summary below.

### Game design (agreed with the founder)
- Every player is dealt a secret word; each device shows every *other*
  player's word, never the viewer's own.
- A shared round timer runs (host-configurable: 3/5/7/10 min, or
  unlimited — the family self-regulates by question count instead).
- Questions rotate one player at a time in a fixed turn order (like
  Impostor's discussion turns) — but *guessing* is not turn-locked: any
  player can declare "I think I know who I am" at any moment, say it out
  loud, and self-report the result (honor system, same pattern as
  Impostor's voting).
- Correct guess → that device reveals the player's own word, awards fixed
  points, and removes them from the question-turn rotation (they keep
  watching/answering others' questions, just don't ask their own anymore).
- Wrong guess → no penalty, no state change; they keep playing.
- When the timer runs out, anyone who never guessed has their word
  revealed for the results screen with 0 points for that round.
- Single-device: sequential per-player turns, Heads-Up style — the current
  player's word is shown for someone else to hold/display to the group
  (not the guesser), with the same per-turn timer, "¡Adivinó!" / "Pasar"
  to advance.
- Content: a dedicated word bank (not shared with Impostor's), reusing
  Impostor's animals/food/household-objects/toys-vehicles-nature
  categories but **excluding Professions** (founder's call — didn't fit
  this game as well), each word tagged with a representative emoji as a
  lightweight "picture" (no image assets/hosting, no AI-generated content
  at runtime — consistent with `NEXPLAY_PLAN.md`'s non-goals).

### Scope — in
- `games/who-am-i/`: `reducer.ts` (pure), `module.ts` (ADR-0002-compliant
  `GameModule`), `content/{types,es,en,index}.ts` (own word bank + emoji),
  `views/Player.tsx` (multi-device, host===player same component per the
  Impostor precedent), `views/SingleDevice.tsx` (Heads-Up-style
  sequential turns), `views/PlayerRoster.tsx`-equivalent if needed (or
  reuse the existing component if it fits without modification — do NOT
  modify the shared one for this game's needs, that would violate the
  "no platform changes" goal).
- Registration in `lib/realtime/platformReducer.ts`'s `AVAILABLE_GAMES`
  (additive only — do not change `toAnyGameModule`/`buildDefaultConfig`).
- `i18n/en.json` / `i18n/es.json`: new `WhoAmI.*` and `games.who-am-i.*`
  namespaces, kept in parity.
- Unit tests for the reducer (phase transitions, turn rotation skipping
  guessed players, timer-expiry resolution, scoring).

### Scope — out (non-goals for this task)
- No changes to `lib/types/room.ts`, `platformReducer.ts`'s core logic,
  `useRoomConnection.ts`, or any Impostor file. If building this game
  reveals a real gap in the `GameModule` contract, stop and flag it — do
  not patch around it silently (per `docs/ROADMAP.md` M3's explicit rule).
- No shared word-bank module between Impostor and Who Am I (founder's
  call — separate content, each game owns its own).
- No speed-based scoring bonus (flat points per correct guess only) — a
  reasonable enhancement to consider later, not now.
- No real illustrated art — emoji only.

### Files this task may touch
- `games/who-am-i/**` (new)
- `lib/realtime/platformReducer.ts` (additive registration only)
- `i18n/en.json`, `i18n/es.json`
- `tests/unit/who-am-i-game.test.ts` (new)
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md`

### Relevant context
- ADR-0002 (GameModule Contract) — this task is the contract's reuse test.
- `games/impostor/` as the reference implementation to follow (turn
  rotation pattern, honor-system self-reporting, reveal-and-pass
  single-device pattern, no-repeat-word tracking).

### Definition of Done
- Matches `docs/05_engineering/CONVENTIONS.md`'s Definition of Done in full.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run test` all pass.
- Zero changes outside `games/who-am-i/`, i18n catalogs, and the additive
  registry line in `platformReducer.ts`.
- `docs/09_ai/CURRENT_STATE.md` / `HANDOFF.md` updated.

### How to verify
1. `pnpm run test` — reducer tests pass.
2. `pnpm run lint` / `pnpm run typecheck` — 0 errors.
3. `pnpm dev` — play a full round in both device modes.
