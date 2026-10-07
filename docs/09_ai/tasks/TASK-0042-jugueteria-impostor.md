# TASK-0042: Impostor on the Juguetería system (M6.5 phase 2b, game 1 of 5)

### Goal
Restyle Impostor's own views — multi-device (`Player.tsx`) and pass-and-play
(`SingleDevice.tsx`) — on `BDR-0002`'s primitives from `TASK-0041`. First of
the five per-game tasks in `docs/ROADMAP.md`'s M6.5 phase 2b.

### Scope — in
- Remove the nested `Card` wrappers (`Screen`'s tray already is the panel);
  sub-panels become sunken plastic.
- Replace every emoji illustration with Impostor's own pictograms
  (`views/Pictos.tsx`: mask, speech bubble, ballot, tie, check, crown,
  worried face, star, pass-the-phone).
- Replace native `<select>`s (impostor count, clue difficulty) with toy key
  rows; the "needs N players" option labels become one sentence hint.
- Outcomes (caught, tie, innocent voted out, impostor survived / stole the
  win, innocents win) as colored plastic blocks; scoreboard with pictograms.
- Voting targets as a two-column grid of keys; "Ir a votación" and "Falló"
  become secondary (white) buttons so two strong red buttons never compete.
- Shared pieces in `views/parts.tsx` so both views read as the same game.
- **Bug fix — privacy leak (single-device):** the shared discussion screen
  showed the impostor's tip ("¡Hacé como que sabés la palabra!") whenever
  the impostor was the speaker, outing them to the whole table. It now
  shows one neutral tip for every speaker (`discussion.speakerTip`). Covered
  by the single-device e2e spec.
- Copy: emoji removed from `eliminationResult.*`; new keys
  `hintNoneShort/hintHardShort/hintEasyShort`, `needsPlayersHint`,
  `discussion.speakerTip`, `voting.voterTurn`.

### Scope — out (non-goals for this task)
- Gameplay changes (vote-by-vote reveal, illustrated words) — `BACKLOG.md`.
- Motion/sound/haptics — phase 3.
- Other games.

### Files this task may touch
- `games/impostor/views/*`, `components/ui/PlayerChip.tsx` (roster pill as a
  raised piece), `i18n/*.json`, `tests/e2e/single-device-pass-and-play.spec.ts`,
  `docs/*`

### Relevant context
- `BDR-0002`, `TASK-0041`, `docs/04_design/FEEL.md`.

### Definition of Done
- `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.
- No emoji and no `Card` left in `games/impostor/views/`.

### How to verify
- `pnpm lint && pnpm typecheck && pnpm test`; e2e single-device + locale.
- Browser at 375×812, single-device: setup, handoff, capsule reveal,
  discussion, voting, caught-impostor block, innocents-win block.
