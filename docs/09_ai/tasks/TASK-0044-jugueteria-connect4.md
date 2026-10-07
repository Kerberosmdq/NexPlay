# TASK-0044: Connect 4 on the Juguetería system (M6.5 phase 2b, game 3 of 5)

### Goal
Restyle Connect 4's views (`Board.tsx`, `Player.tsx`, `SingleDevice.tsx`) on
`BDR-0002`'s primitives. Third of the per-game tasks in `docs/ROADMAP.md`'s
M6.5 phase 2b.

### Scope — in
- The board as the classic plastic frame in the game's green on its molded
  edge, with dark hex sockets; discs keep the hexagon (`TASK-0037`'s
  deliberate "Option B") but gain a molded edge (a darker layer under the
  face, since clip-path clips box-shadows).
- **Last-move marker**: the disc dropped last carries a white dot until the
  next move, so the player about to move can see what the other just did
  (a `BACKLOG.md` idea; purely visual, no reducer change).
- Turn shown as a banner with the current player's disc next to their
  name; on the shared single-device board it reads "Turno de {name}".
- Setup shows each name next to the disc that player will drop.
- Result as a green plastic block with the winner's disc (both for a draw).
- Shared pieces in `views/parts.tsx` (`Disc`, `TurnBanner`, `ResultBlock`).
- i18n: the column buttons' accessible label ("Columna N") was hardcoded
  Spanish; now `Connect4.columnLabel` in both catalogs.
- Robustness: single-device rebuilds its local players from the entered
  names if the view remounts mid-match, instead of showing a raw id
  ("¡Ganó local-0-Ana!") — found when a dev hot reload hit mid-game.

### Scope — out (non-goals for this task)
- Who-starts coin flip, drawn winning line — `BACKLOG.md`; motion/sound —
  phase 3. Other games.

### Files this task may touch
- `games/connect4/views/*`, `i18n/*.json`, `docs/*`

### Definition of Done
- `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.

### How to verify
- `pnpm lint && pnpm typecheck && pnpm test`; e2e single-device + locale.
- Browser at 375×812, single-device: setup with discs, a few drops (last
  move dotted), a vertical win, result block with the winner's name.
