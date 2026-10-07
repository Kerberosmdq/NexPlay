# TASK-0043: Who Am I on the Juguetería system (M6.5 phase 2b, game 2 of 5)

### Goal
Restyle Who Am I's own views — multi-device (`Player.tsx`) and
pass-and-play (`SingleDevice.tsx`) — on `BDR-0002`'s primitives. Second of
the five per-game tasks in `docs/ROADMAP.md`'s M6.5 phase 2b.

### Scope — in
- Nested `Card`s removed; decorative emoji (🎉 😬 ✅ ❌) replaced by the
  game's own pictograms (`views/Pictos.tsx`). **The emoji that travel with
  each word stay**: they are content (the picture next to the word for the
  youngest player, FEEL.md), not decoration.
- The word as a big yellow "forehead card" in the game's color; the round
  clock as a dark display with tabular digits; round length as toy keys
  (3 / 5 / 7 / 10 / ∞ minutes) instead of a `<select>`; "Acerté" as a green
  button, "No acerté" and "cambiar palabra" as secondary; resolution as a
  yellow block plus a scoreboard with guessed/missed pictograms.
- Shared pieces in `views/parts.tsx`.
- Shared layer, because two games now need them: `components/ui/Picto.tsx`
  (pictogram frame, Impostor's pictos moved onto it), `components/ui/KeyRow.tsx`
  (moved out of Impostor's parts), `Button` `success` variant, and a
  `--color-success-hover` token (with its contrast test).
- **Bug fix — config type:** the config schema's select options (and its
  default) are strings, and `setup` stored `"300"` into a numeric
  `timerSeconds`. Arithmetic coerced it, so nothing visibly broke, but any
  strict comparison (`=== 300`) failed — which is how the new key row found
  it (no key showed as selected). `setup` now goes through a pure
  `parseTimerSeconds`, unit-tested.

### Scope — out (non-goals for this task)
- Forehead tilt mode, countdown sound — `BACKLOG.md` / phase 3.
- Other games.

### Files this task may touch
- `games/who-am-i/*`, `games/impostor/views/{Pictos,parts}.tsx` (moved onto
  the shared frame/KeyRow), `components/ui/*`, `app/tokens.css`,
  `i18n/*.json`, `tests/unit/*`, `docs/*`

### Definition of Done
- `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.
- No `Card` and no decorative emoji left in `games/who-am-i/views/`.

### How to verify
- `pnpm lint && pnpm typecheck && pnpm test`; e2e single-device + locale.
- Browser at 375×812, single-device: setup with the 5-minute key selected,
  handoff, forehead card with a running clock, resolution.
