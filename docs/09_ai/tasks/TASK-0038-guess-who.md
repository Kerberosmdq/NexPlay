# TASK-0038: Guess Who / ¿Quién es Quién? (M6)

### Goal
Ship `docs/ROADMAP.md`'s M6: a fifth game, classic 1-vs-1 deduction over a
shared roster of secret characters — second of `BACKLOG.md`'s prioritized
"next games" list, picked up ahead of M7 (presentable) per the founder's
explicit, repeated request.

### Design decisions (confirmed with the founder before implementation)
- **Question mechanic: verbal, no turns enforced by the app.** Same
  philosophy as Impostor's discussion phase — the family asks questions
  out loud and self-regulates who asks when. The app's job is: hold each
  side's secret, let each device track *its own* candidate eliminations
  as a personal memory aid, and validate a guess when one is made.
- **Wrong guess ends the match immediately** (the classic board game's
  real rule) — the guesser loses, no "try again." This is deliberately
  where the founder's requested "pizca de dificultad" (a pinch of
  difficulty) comes from: real stakes on a guess, not extra mechanics.
- **32-character roster**, each a combination of 6 traits:
  - `glasses`: boolean
  - `hat`: boolean
  - `hairColor`: `negro` | `castaño` | `rubio` | `pelirrojo`
  - `hairLength`: `largo` | `corto` | `calvo`
  - `facialHair`: `barba` | `bigote` | `ninguno`
  - `earrings`: boolean
  These are content data, not incidental art details — every trait is a
  literal askable yes/no question. The founder and this task will design
  the 32 characters' actual trait combinations deliberately so that no
  single trait value covers much more or less than half the roster (a
  well-chosen question should meaningfully narrow the field every time,
  not eliminate 1 character or 31 of them) — this is where the requested
  difficulty actually lives, not in reducer logic.
- **Character art ships in two stages, deliberately** (matches M4a → M4a
  polish's precedent: Battleship shipped with plain colored squares first,
  real ship art landed as its own follow-up task once the core game
  worked). This task ships with a simple trait-based placeholder card (an
  initial + small trait glyphs, no illustration) — generating real
  portraits requires the founder to use an external image tool, and
  shouldn't block the game logic from being built and verified now. Real
  portraits are an explicit fast-follow: 4 reference-sheet batches of 8
  characters each (not one 32-character sheet — smaller batches are much
  more likely to come back from an AI image generator with a clean,
  usable grid), processed the same way `scripts/generate-ship-assets.mjs`
  already processes Battleship's ship sheet.
- **Strictly 1-vs-1** — team play is out of scope, matching every other
  "two sides" game's default.
- Character **names are not per-locale content**. Unlike Impostor/Who Am
  I's words (which *are* the translated content), proper names transfer
  fine between Spanish and English — one shared character list, not a
  `LocalizedContentPack`.

### Privacy model (reuses `ADR-0005`, no contract changes)
A side's assigned character is exactly analogous to a Battleship fleet:
never shared state, only present in that device's own private slice. This
task is the *second* real user of `answerPending`'s "resolve a pending
shared request using a private secret" pattern (Battleship's shot
resolution was the first) — no new platform mechanism needed, just a
second, structurally identical use of it:
- `setupPrivate: () => ({ myCharacterId: null })` — matches Battleship's
  own `setupPrivate` (returns an empty/unset shape; the actual value is
  assigned later, not at setup time, so `Math.random()` stays out of the
  reducer/setup path).
- On mount, if `phase === "playing"` and `privateState.myCharacterId` is
  still `null`, the view privately picks one random character from the
  full 32-roster and calls `setPrivateState`. Each device does this
  **independently** — there is no cross-device coordination to guarantee
  the two sides get different characters. This is a deliberate,
  documented simplification (a 1-in-32 chance of an accidental match per
  match, same order of risk this project already accepts elsewhere for
  low-stakes randomness) rather than building new side-channel plumbing
  for a single-in-a-blue-moon coincidence that doesn't actually break the
  game if it happens.
- `GUESS { guesserSide, characterId }` sets `pendingGuess` in shared
  state. The **target side's own device** (via `answerPendingGuess`,
  comparing `characterId` against its own private `myCharacterId`)
  resolves it — correct ends the match with the guesser winning; incorrect
  ends the match with the guesser losing. Structurally identical to
  Battleship's `pendingShot`/`answerPendingShot`.
- Once resolved, the losing side's own device reveals its character into
  shared state (`REVEAL_CHARACTER`), same `ADR-0005` §3 exception
  Battleship's `REVEAL_FLEET` already uses ("once decided, it's no longer
  secret").

### `games/guess-who/reducer.ts`
- `GuessWhoPhase = "config" | "playing" | "resolution"` — same shape as
  Connect 4's: multi-device's two already-connected real players skip
  `"config"` (the platform always calls `setup([])` for single-device,
  never for multi-device with a real 2-player roster).
- `GuessWhoState`: `sides: Record<Side, string>`, `pendingGuess: {
  guesserSide: Side; characterId: string } | null`, `winnerSide: Side |
  null`, `revealedCharacters: Partial<Record<Side, string>>`.
- `START_MATCH { playerIds }` — config → playing (single-device only).
- `GUESS { guesserSide, characterId }` — only valid from `"playing"`, sets
  `pendingGuess` (rejects if one is already pending — the resolve must
  land before a second guess starts, same "no firing while a shot is
  pending" rule Battleship's `FIRE` already enforces).
- `RESOLVE_GUESS { correct }` — only valid answering the current
  `pendingGuess`; sets `winnerSide` (guesser if correct, defender if
  wrong) and moves to `"resolution"`.
- `REVEAL_CHARACTER { side, characterId }` — only from `"resolution"`.
- `PLAY_AGAIN` — resets to a fresh `"playing"` state (both sides' actual
  identities are private and get freshly, independently re-picked on the
  next mount, same as the very first match).

### `games/guess-who/content/characters.ts` (new)
The 32-character roster: `{ id, name, traits }[]`. No `imagePath` field is
required by the type (the view resolves art, falling back to the
placeholder card when none exists) — this is what lets real portraits
land later as a pure content-file change, no reducer/view code touched.

### Views
- `games/guess-who/views/CharacterCard.tsx` (new, shared): renders one
  character — a placeholder card (name initial + small trait glyphs: 👓
  for glasses, 🎩 for hat, etc., matching Who Am I's emoji-first
  precedent) if no portrait image exists yet, or the real image once the
  follow-up task lands it. Takes `character`, `crossedOut`, `onClick?` —
  used both for the elimination grid and the single "your character"
  display.
- `games/guess-who/views/Player.tsf` → `Player.tsx` (multi-device
  `host`+`player`, same component for both): "tu personaje es: [card]"
  reminder, the full 32-character grid (tap to cross out — plain local
  `useState<Set<string>>`, not synced anywhere, it isn't a secret), a
  "adivinar" flow (tap a candidate, confirm), win/loss banner with both
  characters revealed at resolution, host-only "jugar de nuevo".
- `games/guess-who/views/SingleDevice.tsx` (new): local name collection
  (mirrors Connect 4/Who Am I's `makeLocalPlayers`), a reveal-and-pass
  step per player (`RevealCard`, matching Impostor's precedent — "don't
  let the other see") before the match starts, then the same grid/guess
  UI with a "¿quién adivina?" selector since a single shared screen has no
  inherent sense of "whose turn."

### Scope — in
- `games/guess-who/reducer.ts`, `module.ts`, `content/characters.ts`,
  `views/CharacterCard.tsx`, `views/Player.tsx`, `views/SingleDevice.tsx`.
- Registering `guessWhoGameModule` in `AVAILABLE_GAMES`.
- `i18n/es.json`, `i18n/en.json`: `games.guess-who.*` catalog entry, a
  `GuessWho.*` section (turn-agnostic prompts, win/loss banners, guess
  confirmation, single-device reveal/selector strings).
- Unit tests: reducer (normal guess-correct win, guess-wrong loss,
  rejecting a second guess while one is pending, `PLAY_AGAIN` reset), and
  a roster-balance test asserting no single trait value covers more than
  ~60% or fewer than ~40% of the 32 characters (a guard against the
  content itself accidentally being too easy or too hard — this is the
  one place "difficulty" is actually checked).
- `getWinner` wired for M4d's tournament, same wrapped-array shape as
  Connect 4/Battleship.
- Marking `docs/ROADMAP.md`'s M6 done, updating `CURRENT_STATE.md`/
  `HANDOFF.md`.

### Scope — out (non-goals for this task)
- Real character portrait art — explicit, planned follow-up task once
  this one verifies the game works end to end with the placeholder cards.
- Team play / more than 2 players.
- Any enforced turn order for asking questions.
- A "remaining candidates count" or auto-elimination assist beyond the
  player's own manual cross-out taps — keep the deduction genuinely
  manual, matching the physical game.

### Files this task may touch
- `games/guess-who/` (new folder: `module.ts`, `reducer.ts`,
  `content/characters.ts`, `views/CharacterCard.tsx`, `views/Player.tsx`,
  `views/SingleDevice.tsx`)
- `lib/realtime/platformReducer.ts` (one registry line)
- `i18n/es.json`, `i18n/en.json`
- `tests/unit/guess-who-game.test.ts` (new), `tests/unit/guess-who-roster.test.ts` (new)
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md`

### Relevant context
- `docs/ROADMAP.md` — M6 section (design decisions already confirmed).
- `ADR-0005` — the private-state mechanism this task reuses exactly;
  `answerPendingShot` in `games/battleship/reducer.ts` is the closest
  prior art for `answerPendingGuess`.
- `games/who-am-i/views/SingleDevice.tsx` and `RevealCard` —
  reveal-and-pass precedent for this task's single-device mode.
- `games/connect4/reducer.ts` — the closest prior art for the
  `"config"`-only-for-single-device phase shape.
- `scripts/generate-ship-assets.mjs` — the processing script the future
  portrait-art follow-up task will adapt.

### Definition of Done
- Everything in `docs/05_engineering/CONVENTIONS.md`'s Definition of Done.
- Unit tests cover: a correct guess winning, a wrong guess losing, a
  second guess rejected while one is already pending, `PLAY_AGAIN`
  resetting state, and the roster-balance guard on the 32 characters'
  trait distribution.
- Live verification: a full multi-device match to both a correct-guess
  win and (a separate match) a wrong-guess loss, single-device
  reveal-and-pass working correctly for both players, and a tournament
  with Guess Who as the game reaching a champion — all across real,
  separately-connected browser tabs.
- `docs/ROADMAP.md`'s M6 marked done; `CURRENT_STATE.md`/`HANDOFF.md`
  updated, including the explicit note that real portrait art is a
  follow-up, not part of this task.

### How to verify
- `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm test:e2e`.
- Multi-tab and single-device live browser checks per the Definition of
  Done above.
