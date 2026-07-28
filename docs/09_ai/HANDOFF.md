# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: `TASK-0038`
- **Title**: Guess Who / ¿Quién es Quién? (M6)

## Current Branch
- `feat/guess-who`, branched off `main` after PR #51 (the platform UX
  hotfix) merged.

## What's in this change

A fifth game, prioritized ahead of M7's presentable-polish pass per the
founder's explicit, repeated request (same pattern M3.5/M5 already
established). Design confirmed with the founder in conversation before any
code, via a round of `AskUserQuestion` decisions: verbal question mechanic
(no enforced turns — same self-regulated philosophy as Impostor's
discussion phase), a 32-character roster, and shipping character art in
several small reference-sheet batches later rather than all at once.

### Mechanic
Classic 1-vs-1 deduction. Each side privately holds one secret character;
questions are asked out loud, never enforced by the app. Players cross out
candidates on their own device as a personal memory aid — plain local UI
state, never synced (it isn't a secret, just scratch paper). A wrong guess
ends the match **immediately in the defender's favor** — the classic board
game's real rule, and deliberately where the founder's requested "pizca de
dificultad" comes from, through genuine stakes rather than extra mechanics.

### Roster
`games/guess-who/content/{types,characters}.ts`: 32 hand-assigned names,
each a combination of 6 traits (`glasses`, `hat`, `hairColor` [4 values],
`hairLength` [3 values], `facialHair` [3 values], `earrings`). Distribution
was deliberately balanced (not hand-eyeballed) via a seeded-PRNG Node
script run once in the scratchpad directory, then hand-assigned names.
`tests/unit/guess-who-roster.test.ts` guards this permanently: exactly 32
characters, unique ids/names, no single trait value covering less than 10%
or more than 65% of the roster (a giveaway or a wasted question), and no
more than ~20% exact-duplicate trait combinations.

### Reducer and privacy
`games/guess-who/reducer.ts`: `GUESS` sets a shared `pendingGuess`;
`RESOLVE_GUESS` crowns a winner; `REVEAL_CHARACTER` lets both sides reveal
their own character once resolved (more generous than Battleship's
loser-only reveal, since revealing both leaks nothing once the match is
already decided); `PLAY_AGAIN` resets for a rematch. `answerPendingGuess`
is the second real user of `ADR-0005`'s `answerPending` pattern — the
guessed-about side's own device resolves a guess against its private
`myCharacterId`, never shared state, exactly mirroring Battleship's shot
resolution. `setupPrivate` returns `{ myCharacterId: null }`; each device
independently picks a random character on mount — deliberately no
cross-device coordination (a documented, accepted 1-in-32 collision risk).

### Views
- `CharacterCard.tsx`: placeholder representation — a colored circle
  avatar tinted by hair color, an initial letter, and emoji trait glyphs
  (👓 glasses, 🎩 hat, 💎 earrings). Real portraits are an explicit
  tracked follow-up (four reference-sheet batches of 8 characters,
  processed the same way `scripts/generate-ship-assets.mjs` already
  processes Battleship's), matching M4a → M4a-polish's "plain first, real
  art later" precedent — **not started, no source art exists yet.**
- `Player.tsx` (multi-device): picks/reveals the private character (see
  the bug below), a guessing-mode toggle, `ConfirmDialog` reuse for the
  high-stakes guess confirmation.
- `SingleDeviceView.tsx`: local `assignments: Record<Side,string>` (the
  platform's `views.singleDevice` contract has no `privateState` at all,
  so this can't go through `usePrivateState`), a `RevealCard`
  hold-to-reveal step per player (mirrors Impostor's role-reveal
  precedent) before a shared grid, and a "¿quién está adivinando?"
  two-button selector before the guess-confirmation flow, since one shared
  screen has no per-device turn concept.

`module.ts` needed zero `GameModule` contract changes; `getWinner` is
wired for M4d's tournament bracket for free.

### A real bug found during live tournament verification
Playing a real 3-player tournament (round 1: bye + a match, round 2: the
final) surfaced that the winner of round 1 kept the **exact same** secret
character into round 2, against a brand-new opponent — even though the
opponent had already seen that character revealed at round 1's resolution
screen. Root cause: `usePrivateState`'s storage key is scoped to
`(roomCode, gameId, playerId)`, not to the individual match, and the game's
own effect only re-picked a character when `myCharacterId === null` —
which it never was again, once first assigned for that room. Fixed in
`Player.tsx` by tracking phase transitions via a `useRef` and re-picking on
every fresh entry into `"playing"` (not just "still unset"), which covers
both `PLAY_AGAIN` rematches and tournament rounds uniformly. Documented in
`ADR-0005`'s changelog (v1.4.0) since this is a real gap in the shared
`usePrivateState` hook's semantics, not something specific to Guess Who —
any future private-state game whose secret must reset every match needs
the same transition-detection pattern in its own view.

### Live verification
Across real, separately-connected browser tabs:
- Multi-device: a full match ending in a correct-guess win, and a
  **separate** match ending in a wrong-guess loss — both revealed
  correctly on both tabs, host-only "jugar de nuevo" present only for the
  host.
- Single-device: name entry → reveal-and-pass (hold-to-reveal for both
  players) → shared grid → "¿quién está adivinando?" selector → guess
  confirmation → resolution, all correct.
- A real 3-player tournament (one bye, two matches) played to a champion,
  which is what surfaced the bug above — re-verified clean after the fix.

Zero console errors throughout every check. One stale-console-buffer false
alarm during setup (`MISSING_MESSAGE` for two i18n keys that genuinely
existed, from a long-running dev session's many Fast-Refresh cycles) —
confirmed clean on a fresh dev server restart, no code change needed; same
class of false positive already documented in earlier handoffs.

## Files Modified / Added
- `games/guess-who/` (new): `reducer.ts`, `module.ts`,
  `content/{types,characters,index}.ts`,
  `views/{CharacterCard,Player,SingleDevice}.tsx`
- `lib/realtime/platformReducer.ts` (registered `guessWhoGameModule` in
  `AVAILABLE_GAMES`)
- `i18n/es.json`, `i18n/en.json` (`games.guess-who.*`, full `GuessWho`
  section)
- `tests/unit/guess-who-game.test.ts`, `tests/unit/guess-who-roster.test.ts`
  (new, 29 tests total)
- `docs/ROADMAP.md` (M6 marked done; M7 renumbering already in place from
  the planning pass)
- `docs/00_decisions/architecture/ADR-0005-PRIVATE-GAME-STATE.md`
  (changelog v1.4.0)
- `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/tasks/TASK-0038-guess-who.md`

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`,
  strict branch protection, GitHub Actions secrets configured.
- No real character portrait art exists yet — `CharacterCard.tsx` is
  entirely the placeholder representation. The founder generating
  reference-sheet batches is an explicit, not-yet-scheduled follow-up.

## A testing-methodology note worth remembering (carried forward, extended)
Same-profile multi-tab testing shares **all** of `localStorage` across
tabs, including two keys that matter here: `LAST_IDENTITY_KEY`
(`lib/realtime/session.ts`, used by `getRememberedUserId`/`rememberIdentity`
so the *same* device can rejoin a room with the same id) and the full
`RoomSession` (`saveRoomSession`/`loadRoomSession`, used to silently
rejoin on page load). Both are written by **every** tab that creates or
joins a room, since they aren't scoped per tab — only per browser. Two
concrete failure modes hit this session, worth avoiding next time:
1. Setting up two new tabs' identities in the same parallel batch (clear
   localStorage + fill the join form + click join, for two tabs at once)
   can race: both tabs' `getRememberedUserId(code)` calls read the *same*
   shared key, and whichever write lands last wins for both — producing
   two tabs presenting as the same underlying player and colliding in
   Supabase's presence sync (one just overwrites the other; the room ends
   up with fewer distinct players than tabs). Fix: set up tabs **one at a
   time, fully sequentially** — clear + reload + fill + join + verify one
   tab completely before touching the next.
2. **Never call a bare `location.reload()` on an already-joined,
   already-verified tab** once other tabs have since joined the same
   room. Since `RoomSession`/`LAST_IDENTITY_KEY` are shared, a reload makes
   that tab re-read localStorage from scratch — which by then reflects
   whichever *other* tab joined most recently, not its own original
   identity, corrupting that tab's session (it will render as the wrong
   player, sometimes stealing the HOST badge). If a tab's displayed roster
   looks stale, that's expected until the next live broadcast — it is not
   a reason to reload; just wait or re-fetch page text.

Also encountered this session: the Browser pane's `computer` click
sometimes silently misses its target after a `resize_window`/viewport
change or a tool timeout (the click coordinate resolves against a stale
layout) — when a click via `ref` doesn't produce the expected page change
and there's no console error to explain it, verify with a screenshot
before assuming the app is broken; a plain `element.click()` via
`javascript_tool` is a reliable fallback for driving the UI once the
right element is confirmed to exist (debugging/inspection tool being used
to actually click is a deliberate exception here, not a habit — prefer the
real `computer` click when it's working).

## Pending Tasks
- Real character portrait art for Guess Who (four reference-sheet
  batches of 8 characters each, founder-generated) — not started.
- A dedicated founder playtest of Battleship's full feature set (M4a–M4d —
  weapons, 2-vs-2 teams, tournament) on real phones specifically is still
  worth doing — every verification in this repo's history so far has used
  up to four browser contexts on one machine, not a dedicated real-device
  pass.
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice — the latent leak the ADR documents is real but not urgent.
- The two remaining games from `BACKLOG.md`'s prioritized list (Ludo, a
  dice-and-track race game) — each its own future milestone, not yet
  started.

## Next Suggested Task
- The founder's call: **M7 (presentable)** per `docs/ROADMAP.md`, or the
  next game from `BACKLOG.md`'s prioritized list (Ludo is next). Follow
  the same pattern used for every game so far: a design conversation with
  the founder (exploring distinct directions per `PROJECT_CONSTITUTION.md`
  Article 10 whenever there's a real visual/UX decision to make) before
  any code.
