# TASK-0047: Motion, sound and haptics (M6.5 phase 3)

### Goal
Give the Juguetería system its toy physics and toy sounds (`BDR-0002` §10,
`ADR-0004` 1.1.0's motion-vocabulary extension): the app should *feel* like
plastic pieces, not just look like them. Last phase of M6.5.

### Scope — in
- **`lib/feedback`**: cues (press, select, pop, drop, flip, correct, wrong,
  hit, miss, sunk, win, lose, tick) synthesized with Web Audio — no audio
  files — plus short `navigator.vibrate` patterns (Android; iOS has no web
  haptics). One switch for both, stored on the device, **off on a first
  visit**. `useFeedbackEnabled` (useSyncExternalStore) and `useCueOnMount`.
- **`SoundToggle`**: a plastic key (speaker with waves or a cross, so state
  isn't color-only) in `Screen`'s top bar and on the entry screen.
- **Primitives**: `Button` plays a cue on press (default "press", `sound`
  prop to change or silence); `KeyRow` keys "select"; `RevealCard` "pop".
- **Motion vocabulary** (`app/motion.css`): `pop`, `drop` (falls
  `--drop-rows` cells and bounces twice), `flip`, `confetti`; all with
  reduced-motion fallbacks (confetti isn't rendered at all).
- **`PhaseTransition`**: the game screen slides up on every phase change. It
  replays a Web Animation on the same element instead of remounting with a
  key, which would wipe each view's local state (pass-and-play names, whose
  turn it is).
- **`ToyConfetti`**: plastic studs and hex tokens thrown on a win.
- **Games**: Impostor outcome blocks (fanfare + confetti at round end; tie,
  caught, innocent-out cues); Who Am I correct/wrong buttons, last-five-
  seconds tick, round-over block; Connect 4 discs drop and bounce with a
  clack, win/lose/draw cues; Guess Who cards flip down with a click; Battleship
  splash / hit / sunk on every shot, a clack per ship placed, win/lose.
- i18n: `Lobby.soundToggleLabel`, `soundOn`, `soundOff`.

### Scope — out (non-goals for this task)
- Recorded sound effects, music, volume slider.
- Haptics on iOS (no web API).

### Files this task may touch
- `lib/feedback/*` (new), `app/motion.css`, `components/ui/*`,
  `components/platform/{RoomLobby,MultiDeviceRoom}.tsx`, `app/[locale]/page.tsx`,
  `games/*/views/*`, `i18n/*.json`, `tests/unit/feedback.test.ts`, `docs/*`

### Definition of Done
- `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.
- Feedback off by default; never throws without Web Audio or vibration.

### How to verify
- `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`.
- Browser: with the switch off no notes are synthesized; turning it on
  stores "on" and clicks; a Connect 4 drop animates from its row with a
  3-note clack; a win throws confetti; a phase change animates once without
  losing names. On a real Android phone: hear and feel it.
