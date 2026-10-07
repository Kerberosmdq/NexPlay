# TASK-0046: Battleship split + Juguetería restyle (M6.5 phase 2b, game 5 of 5)

### Goal
Split Battleship's 1105-line `views/Player.tsx` into focused files with
behavior unchanged, and restyle it on `BDR-0002`'s primitives. Last of the
per-game tasks in `docs/ROADMAP.md`'s M6.5 phase 2b, completing phase 2.

### Scope — in
- **Builds on PR #60** (`fix/battleship-playability`, still open): merged
  into this branch first, so the split carries #60's fixes (stable board
  layout, shot colours by result, whole special-shot shape, per-match
  private-state key) instead of conflicting with them.
- **Split** (behavior-preserving): `BoardGrid.tsx` (board + ship overlays),
  `useShotFeedback.ts` (strike animation + announcements), `TeamSetup.tsx`,
  `Placement.tsx`, `Firing.tsx`, `Resolution.tsx`; `Player.tsx` keeps
  identity, the side's fleet channel, the cross-phase effects and the phase
  switch (160 lines).
- **Restyle**: the board as a navy plastic frame on its molded edge with a
  white peg hole per cell (the physical game's board); placement info as a
  sunken panel with the next ship's art; weapons as toy keys; layout choice
  and one-at-a-time board choice as `KeyRow`s; the sunk modal and result as
  plastic panels (result block in the water colour with an anchor
  pictogram). Ghost placement tint green/red, weapon aim tint yellow.
- i18n: `firing.boardChoiceLabel`, `firing.layoutLabel`.

### Scope — out (non-goals for this task)
- Gameplay changes; motion/sound — phase 3; the unreproduced tournament
  freeze from #60 (see HANDOFF).

### Files this task may touch
- `games/battleship/views/*`, `i18n/*.json`, `docs/*` (+ the #60 merge).

### Definition of Done
- `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.
- `battleship-multi-device` e2e passes against real Supabase.

### How to verify
- `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e` (all 5 specs).
- Playwright screenshots at 375×812 of lobby, placement and firing.
