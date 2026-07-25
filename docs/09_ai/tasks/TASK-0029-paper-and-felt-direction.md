# TASK-0029: Apply the Paper & Felt Direction (M3.5 code task 2)

### Goal
Apply `BDR-0001`'s chosen visual direction — Paper & Felt as the base
language, penumbra reserved for secret reveals — on top of the token/
primitive system `TASK-0028` proved holds the current app. Where
`TASK-0028` deliberately changed nothing but the two contrast fixes, this
task is the opposite: every screen's palette and typography changes to
match `BDR-0001`, and the reveal moment gets its actual penumbra look.

### Scope — in
- `app/tokens.css`: replace the dark-purple palette with `BDR-0001`'s
  anchors — parchment ground (`#EFE6D6`), ink (`#2B2118`), felt-green
  primary action (`#1F6B52`), terracotta secondary action (darkened to
  `#A8481F` for AA — `#C0562A` alone is a hair under 4.5:1 with white
  text), a wine-red danger action (`#8A1030`), muted-gold border
  (`#C79A62`), and a warm-brown muted ink (`#635441`). Every new pair
  re-verified against `tests/unit/design-tokens.test.ts` before merge.
- Typography roles per `BDR-0001` §3: a condensed display face for
  headlines/branding, a warm humanist body/UI face, a monospace face for
  room codes/timers/scores. Self-hosted via `next/font/google` — this also
  retires the audit's font-loading finding (three fonts loaded, one used
  via `!important`, one blocking external `@import`).
- `RevealCard`'s actual penumbra treatment (`ADR-0004`/`BDR-0001`): the
  screen dims and a warm glow gathers around the card while held/revealed
  — implemented with the reserved `--color-penumbra-ground`/`-glow`
  tokens and the existing `motion-reveal` gesture, not a new one.
- Re-skin the same 6 views + platform lobby components `TASK-0028` ported
  (now for real, not just token-wiring): every `text-white`, dark
  translucent surface, and status color gets reconsidered against a light
  ground.
- A small inline hexagon accent in the lobby header, as a preview of
  `BDR-0001` §4's brand anchor — not the actual favicon/PWA icon system
  (that's code task 3's job per `docs/ROADMAP.md`).

### Scope — out (non-goals for this task)
- No favicon, PWA manifest, app icons, or per-game hexagon-interior marks
  — code task 3.
- No language switcher, no room-code share/copy button, no accessibility
  audit pass beyond what naturally falls out of the new contrast-checked
  palette — code task 3.
- No changes to any reducer, `GameModule`, or platform/realtime logic —
  views and tokens only, same boundary `TASK-0028` respected.
- No new motion gestures beyond what `ADR-0004` already named — the
  penumbra reveal reuses `motion-reveal`, not a new keyframe.

### Files this task may touch
- `app/tokens.css`, `app/globals.css`, `app/[locale]/layout.tsx`
- `components/ui/RevealCard.tsx` (penumbra look), other `components/ui/*`
  only if a token rename requires it
- `components/platform/RoomLobby.tsx`, `RoomWaitingLobby.tsx`,
  `MultiDeviceRoom.tsx`
- `app/[locale]/page.tsx`
- `games/impostor/views/Player.tsx`, `SingleDevice.tsx`, `PlayerRoster.tsx`
- `games/who-am-i/views/Player.tsx`, `SingleDevice.tsx`
- `tests/unit/design-tokens.test.ts` (new pairs, same assertions)
- `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md`,
  `docs/ROADMAP.md`, this file

### Relevant context
- `BDR-0001` — the direction and its exact palette anchors/typography
  roles/penumbra rule.
- `ADR-0004` — the contract this re-skin still has to respect (paired
  tokens, contrast tests, the four named gestures, no raw hex outside
  `app/tokens.css`).
- `TASK-0028`/`HANDOFF.md` — what's already wired (tokens, primitives,
  motion) versus what this task changes (the values, not the mechanism).

### Definition of Done
- `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass, including updated
  contrast assertions for every new token pair.
- No raw hex color literal outside `app/tokens.css`, same one documented
  exception class as `TASK-0028` (decorative art actively being designed
  in this task doesn't count as an exception — it should be tokenized now
  that it's not throwaway).
- Manually verified in-browser at 375×812: full lobby → single-device
  Impostor → reveal (penumbra visible) → discussion → voting → resolution
  flow, light ground throughout except the reveal moment, zero console
  errors.
- `docs/09_ai/CURRENT_STATE.md` / `HANDOFF.md` / `ROADMAP.md` updated.

### How to verify
- `pnpm lint && pnpm typecheck && pnpm test`
- Live contrast check on the new palette's actual rendered buttons/text
  (not just the token file's static values) — same method `TASK-0028`
  used (canvas-normalized computed styles), since that's what caught
  `TASK-0028`'s real transition bug.
- Confirm the reveal moment's penumbra dims the screen and glows the
  card, and that `prefers-reduced-motion` still suppresses `motion-reveal`
  correctly with the new look.
