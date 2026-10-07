# TASK-0045: Guess Who on the Juguetería system (M6.5 phase 2b, game 4 of 5)

### Goal
Restyle Guess Who's views (`CharacterCard.tsx`, `Player.tsx`,
`SingleDevice.tsx`) on `BDR-0002`'s primitives. Fourth of the per-game tasks
in `docs/ROADMAP.md`'s M6.5 phase 2b.

### Scope — in
- Character cards as white plastic holders on a molded edge; the selected
  pick gets a yellow border.
- **Flip-down crossing out**: an eliminated character shows the card's
  purple back with a "?" (the physical board's flaps) instead of a faded,
  struck-through face; a second tap flips it back up. Name stays visible.
- **Remaining counter** ("Quedan N", a `BACKLOG.md` idea) and a hint that
  says what a tap does right now (flip, or guess — the board gets a red
  outline while guessing).
- **Bug fix — single-device boards:** both players crossed out characters
  on one shared set, mixing their eliminations. Each player now has their
  own board, switched with a key row of their names ("¿De quién es este
  tablero?"); a guess is made from your own board, which also removes the
  separate "¿Quién está adivinando?" step (key removed from both catalogs).
- Result as a purple block with the game's pictogram; both characters
  revealed as large cards. Multi-device shows your own character as a
  small card next to the "ask out loud" hint.
- Single-device rebuilds local players from the entered names if the view
  remounts (same robustness fix as Connect 4).
- Shared pieces in `views/parts.tsx` (`FacePicto`, `CharacterBoard`,
  `ResultBlock`, `toggleCrossedOut`).

### Scope — out (non-goals for this task)
- Redrawing the portraits in the toy style — founder decision (BDR-0002
  open follow-up); flip animation — phase 3. Battleship.

### Files this task may touch
- `games/guess-who/views/*`, `i18n/*.json`, `docs/*`

### Definition of Done
- `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.

### How to verify
- `pnpm lint && pnpm typecheck && pnpm test`; e2e single-device + locale.
- Browser at 375×812, single-device: both picks behind the gate, flip three
  cards on Miga's board, Leo's board still shows 32, Leo guesses right,
  result with both characters.
