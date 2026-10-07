# TASK-0041: Juguetería visual system — tokens, primitives, platform screens (M6.5 phase 2a)

### Goal
First half of M6.5 phase 2 (`docs/ROADMAP.md`): implement `BDR-0002`'s
visual system at the shared layer — tokens, fonts, UI primitives, brand
mark and icons — and restyle the platform screens built on them. The five
games' own views are restyled in later per-game tasks (phase 2b).

### Scope — in
- `app/tokens.css`: `BDR-0002` palette under the existing semantic names,
  plus edge tokens (`--color-edge-*`, `--edge-sm/md/lg`), ground, accent,
  success, and per-game colors. Penumbra tokens removed (`ADR-0004` 1.1.0).
- `tests/unit/design-tokens.test.ts`: every new text/background pair at
  ≥4.5:1, focus ring ≥3:1 on both white and ground, water separation.
- Fonts: Titan One (display) + Baloo 2 (body); Space Mono kept for digits.
- Baseplate page background; manifest / theme colors.
- Primitives: `Button` (molded edge, sinks when pressed, flat when
  disabled), `Card`, `Field`, `CodeInput` (keycaps), `Dialog`,
  `ConfirmDialog`, `Screen` (top bar on the ground + one white tray around
  every screen's content), `RevealCard` (capsule + baseplate privacy
  cover), `PlayerChip`, `Scoreboard`, `WaitingState`, `LanguageSwitcher`.
- New: `components/ui/NexMark.tsx` (hex token), `components/platform/GameIcon.tsx`
  (per-game pictograms + block colors).
- Platform screens: entry (`RoomLobby`), single-device game picker
  (`page.tsx`), multi-device waiting lobby (`RoomWaitingLobby`),
  `MatchResolvedModal`, how-to-play dialog.
- Icon set regenerated from the hex token (`scripts/generate-icons.mjs`).
- Mechanical class swaps in game views that the new palette would
  otherwise break: penumbra text classes (the reveal card is now white) and
  `text-action-secondary` used as text (yellow on white is 1.54:1) →
  `text-accent`.

### Scope — out (non-goals for this task)
- Restyling each game's own views (boards, setup cards, emoji
  illustrations) — phase 2b, one task per game.
- Motion, sound, haptics — phase 3.

### Files this task may touch
- `app/*`, `components/ui/*`, `components/platform/*`
- `games/impostor/views/*`, `games/battleship/views/Player.tsx` — class
  swaps only, as above
- `scripts/generate-icons.mjs`, `app/icon.png`, `app/apple-icon.png`,
  `public/icons/*`
- `tests/unit/design-tokens.test.ts`, `docs/*`

### Relevant context
- `BDR-0002`, `ADR-0004` 1.1.0, `docs/04_design/FEEL.md`, `TASK-0039/0040`.

### Definition of Done
- `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.
- No blurred `box-shadow` and no raw hex outside `app/tokens.css` /
  generated assets in the files touched.

### How to verify
- `pnpm lint && pnpm typecheck && pnpm test`; e2e single-device + locale.
- Browser at 375×812: entry screen, game picker, Impostor setup, capsule
  reveal (press and hold), Connect 4 board still playable.
