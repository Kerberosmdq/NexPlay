# TASK-0028: Design System — Tokens, Primitives & Motion (M3.5 code task 1)

### Goal
Implement `ADR-0004`'s contract for real: rewrite `app/tokens.css` as
semantic, paired, contrast-tested tokens; build the mandatory
`components/ui/` primitive set; add the named motion vocabulary with
`prefers-reduced-motion` fallbacks; and port every existing view onto them.
Per `docs/ROADMAP.md`'s M3.5 entry, this task proves the system holds what
already exists — it is **not** the visual redesign (that's code task 2,
which applies `BDR-0001`'s Paper & Felt direction). The one deliberate
exception: token pairs are contrast-corrected where the audit found a
failure, because `ADR-0004` requires every token pair to pass its own test
before merge — shipping a "new" token pair that's a known failure would
contradict the ADR in its very first implementation.

### Scope — in
- `app/tokens.css` rewritten: semantic paired tokens (`surface`,
  `surface-raised`, `ink`, `ink-muted`, `line`, `focus`, `action-primary`/
  `-on`, `action-secondary`/`-on`, `action-danger`/`-on`, plus
  `penumbra-ground`/`penumbra-glow` reserved for code task 2), mapped into
  Tailwind's theme via `@theme inline` so components use plain utility
  classes, never raw hex.
- `app/motion.css` (new): four named gestures — `reveal`, `deal`,
  `celebrate`, `pulse` — as CSS keyframes + utility classes, with a single
  `@media (prefers-reduced-motion: reduce)` block that neutralizes all
  four. Fixes the audit's "High" finding: the Impostor reveal currently
  references `animate-in`/`tailwindcss-animate`, a package that was never
  installed (`animationName: "none"` verified live).
- `components/ui/`: `Button`, `Card`, `Field`, `CodeInput`, `PlayerChip`,
  `Screen`, `RevealCard`, `Scoreboard`, `WaitingState` — composed only from
  tokens, no per-instance raw color.
- `tests/unit/design-tokens.test.ts`: parses `app/tokens.css` for the three
  `action-*` pairs and asserts each meets WCAG AA (≥4.5:1) via a small pure
  contrast-ratio helper.
- Port every existing view/component to the new primitives:
  `components/platform/RoomLobby.tsx`, `RoomWaitingLobby.tsx`,
  `MultiDeviceRoom.tsx`, `app/[locale]/page.tsx`,
  `games/impostor/views/{Player,SingleDevice,PlayerRoster}.tsx`,
  `games/who-am-i/views/{Player,SingleDevice}.tsx`.

### Scope — out (non-goals for this task)
- No palette/hue change beyond the specific contrast corrections above —
  `BDR-0001`'s Paper & Felt palette and the penumbra reveal *look* are code
  task 2.
- No hexagon/favicon/PWA manifest, no language switcher, no room-code
  share button — code task 3.
- No i18n string content changes. `RoomLobby.tsx`'s hardcoded/bilingual
  labels stay exactly as they are; only their visual scaffolding (colors,
  buttons, code tiles) moves onto primitives. Retiring those labels needs
  the language switcher from code task 3 first.
- No changes to any reducer, `GameModule`, or platform/realtime logic —
  this task touches views only.

### Files this task may touch
- `app/tokens.css`, `app/motion.css` (new), `app/globals.css` (import the
  new stylesheet)
- `components/ui/*` (new)
- `tests/unit/design-tokens.test.ts` (new)
- `components/platform/RoomLobby.tsx`, `RoomWaitingLobby.tsx`,
  `MultiDeviceRoom.tsx`
- `app/[locale]/page.tsx`
- `games/impostor/views/Player.tsx`, `SingleDevice.tsx`, `PlayerRoster.tsx`
- `games/who-am-i/views/Player.tsx`, `SingleDevice.tsx`
- `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md`,
  `docs/09_ai/tasks/TASK-0028-design-system-tokens-and-primitives.md`

### Relevant context
- `ADR-0004` — the contract this task implements.
- `BDR-0001` — the direction this task deliberately does *not* apply yet
  (reserved for code task 2).
- `docs/ROADMAP.md` M3.5 — the milestone and its three-task sequence.
- `ADR-0002` §3 — views read only from `state`/`players` props; nothing in
  this task changes that boundary, only what a view renders with.

### Definition of Done
- `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass.
- No raw hex color literal remains in any file listed above outside
  `app/tokens.css` itself, with one documented exception:
  `RoomLobby.tsx`'s decorative background art, text-shadow wordmark
  effect, and the "Nex"/"Play" two-tone text color are the current
  Option C identity being fully *replaced* (not migrated) by code task
  2/3's real hexagon mark — tokenizing throwaway pixels isn't worth the
  churn. Everything structural (surfaces, buttons, fields, code tiles)
  is tokenized.
- The Impostor role-reveal actually animates (manually verified in
  browser — `animationName` is no longer `"none"`).
- `docs/09_ai/CURRENT_STATE.md` / `HANDOFF.md` updated.
- Manually verified in the browser at mobile viewport: the six ported
  screens look the same as before this task (same colors, same layout) —
  this task is plumbing, not redesign.

### How to verify
- `pnpm lint && pnpm typecheck && pnpm test`
- `pnpm test tests/unit/design-tokens.test.ts` specifically, to confirm
  the three action-pair contrast assertions pass.
- Run the dev server, open the lobby and both games at 375×812, compare
  against pre-task screenshots for visual parity; confirm the role-reveal
  animates and that reduced-motion (`prefers-reduced-motion: reduce`)
  suppresses it.
