# TASK-0048: Battleship playability redesign (radar + console, shipyard, toy ships)

### Goal
After the founder's first real-phone session on the Juguetería build
(2026-10-07): "anduvo bien pero hay que mejorar las imágenes de los barcos…
no lo siento lindo ni cómodo de usar". Rework Battleship's screens, ship
placement and shot selection, following the option the founder picked from
the proposals page: **A (radar + mini-map) in portrait combined with B
(console) in landscape, ships drawn in code, 8×8 stays the default.**

### Scope — in
- **Toy ships in code** (`ToyShip.tsx`): top-down molded plastic hulls with a
  peg hole per cell and a stripe in the colour of the ship's weapon; a hit
  shows a red peg in the hole. Replaces the PNG ship art everywhere
  (boards, placement, sunk modal).
- **Board**: A–H / 1–8 coordinates; misses stay water blue, hits become red
  pegs; a non-interactive mini variant.
- **Firing, portrait (A)**: one large board — the rival's on my turn, mine
  on theirs (so I see where I was hit) — and the other as a tappable
  mini-map that swaps them. Big turn banner with sound/vibration when my turn
  starts.
- **Weapon dock**: keys showing each shot's shape, its cost in red pegs and
  the ship that grants it; aim by tapping the board (the shape appears),
  then one big "¡Fuego!" button in thumb reach. The plain shot uses the same
  aim-then-fire flow (no more accidental shots). Charges shown as pegs.
- **Firing, landscape (B)**: both boards side by side with the dock between
  them, chosen automatically by orientation. A "Jugar acostado" button
  requests fullscreen + landscape lock where the browser allows it
  (Android); elsewhere it explains to rotate the phone.
- **Shipyard placement**: every ship waits in a tray under the board; pick
  any ship (any order) and tap/drag it onto the board; tapping a placed ship
  rotates it in place, dragging moves it; while dragging by touch the ship
  sits one row above the finger so it isn't hidden. "Al azar" and "¡Listo!"
  stay. Pure placement helpers in `placement.ts`, unit-tested.
- **The layout chooser is removed** (the app picks by orientation).
- **Resolution** reveals both fleets (the winner's device reveals too).
- How to play: charges explained (+1 per turn, +2 when one of your ships
  sinks).

### Scope — out (non-goals for this task)
- Rule changes (fleet, costs, charges income), team/tournament logic.
- The unreproduced tournament freeze from #60.

### Files this task may touch
- `games/battleship/*`, `components/ui/Screen.tsx` (landscape width),
  `lib/hooks/*`, `i18n/*.json`, `tests/unit/battleship-*.test.ts`,
  `tests/e2e/battleship-multi-device.spec.ts`, `docs/*`

### Definition of Done
- `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.
- Battleship e2e passes against real Supabase with the new aim-then-fire flow.

### How to verify
- `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`.
- Playwright screenshots at 375×812 (portrait) and 812×375 (landscape) of
  placement, my turn, the rival's turn and the result.
