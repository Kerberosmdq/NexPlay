# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0029
- **Title**: Apply the Paper & Felt Direction (M3.5 code task 2)

## Current Branch
- `feat/paper-and-felt-direction`, branched off `main` after `PR #25`
  (`TASK-0028`, tokens/primitives/motion) merged — this branch is on top
  of that, not stacked on an unmerged one.

## What's in this task
`TASK-0028` proved the token/primitive system holds what already shipped.
This task is the payoff: `BDR-0001`'s actual Paper & Felt direction and
penumbra reveal, applied for real.

1. **`app/tokens.css` repainted**, not restructured — same token *names*
   as `TASK-0028`, all-new *values* per `BDR-0001`'s anchors: parchment
   ground (`#EFE6D6`), ink (`#2B2118`), felt-green primary action
   (`#1F6B52`), terracotta secondary (darkened to `#A8481F` — `#C0562A`
   alone sits just under 4.5:1 with white text), wine-red danger
   (`#8A1030`). Two small additions beyond `BDR-0001`'s literal anchors,
   both justified by things that broke when the ground flipped from dark
   to light: `--color-success-surface`/`--color-danger-surface` (pale-tint
   banner pairs — the old dark-theme translucent `bg-green-900/30` pattern
   has no light-theme equivalent without a real token), and `--color-gold`
   (a readable dark gold for point values, since `text-yellow-400` reads
   fine on a dark card and fails badly on parchment).
2. **Typography wired for real** (`BDR-0001` §3): Bevan (condensed
   display, for headlines/branding), Nunito (humanist body/UI), Space
   Mono (room codes/timers/scores) — all self-hosted via `next/font/google`
   in `app/[locale]/layout.tsx`. This also retires the audit's font-
   loading finding: `app/globals.css`'s external Google Fonts `@import`
   and the `* { font-family: ... !important }` override are both gone.
3. **`RevealCard` now implements the actual penumbra look**: a `fixed
   inset-0` scrim dims to `--color-penumbra-ground` while the card itself
   glows with `--color-penumbra-glow`, only while held/revealed. Four new
   tokens exist for this (`--color-on-penumbra`, `-muted`,
   `-penumbra-danger`, `-penumbra-success`) because the dark ground needs
   its *own* readable text colors — reusing the light-theme action/status
   pairs there would fail contrast outright (they were validated against
   parchment, not a near-black background). Who Am I does **not** get this
   treatment: its actual mechanic is showing your word to *other* people,
   not hiding it from yourself, so there's no "private reveal" moment to
   dramatize — the BDR's rule 5 ("penumbra is earned") argued against
   spreading it somewhere it doesn't structurally apply.
4. **All 6 views + the lobby re-skinned for real** — every `text-white`,
   dark translucent surface (`bg-green-900/30`, `bg-black/20`, etc.), and
   status color reconsidered against the light ground. `RoomLobby.tsx`'s
   decorative confetti-SVG background and two-tone wordmark — the one
   thing `TASK-0028` deliberately left as raw hex because it was "getting
   replaced, not migrated" — is now actually replaced: a flat
   `surface-raised` card, a small inline hexagon SVG accent (felt green,
   `BDR-0001` §4's brand anchor previewed ahead of code task 3's real icon
   system), and the wordmark in Bevan/ink instead of a purple/yellow
   gradient.

## Two real bugs found and fixed during this task's own browser verification

**1. A circular CSS custom-property reference silently broke every display
heading.** `app/tokens.css`'s `:root` block had
`--font-display: var(--font-display, "Bevan", ui-serif, serif)` — this
looks like "use Bevan, or a serif fallback," but it's actually
self-referential: `next/font`'s `variable` option *already* sets
`--font-display` on `<html>` to the real loaded font stack, and `:root`
*is* `<html>`, so this rule was trying to define `--font-display` in terms
of itself. Per spec, a custom property whose computed value contains a
cycle becomes invalid — not "falls back to the parenthesized default" as
the syntax visually suggests. Every element using `font-display` silently
rendered in the browser's default serif (verified live:
`getComputedStyle(h1).fontFamily === "Times New Roman"`). This bug almost
certainly existed in the *original* Outfit/Geist Mono setup too — it was
just invisible because `globals.css`'s old `!important` override painted
over it. Fixed by deleting the redundant `:root` redeclaration entirely
and trusting `next/font`'s own `<html>`-level variable (which already
includes its own generated fallback, e.g. `"Bevan", "Bevan Fallback"`).

**2. The `transition-*` + concurrent-animation rendering bug from
`TASK-0028` recurred twice more, and this time it got a systemic fix
instead of a one-off patch.** `TASK-0028`'s handoff already documented one
instance (`CodeInput`'s tiles). This task hit it again: `RevealCard`'s
penumbra scrim had `transition-opacity duration-300` and got stuck showing
`opacity: 0` in the DOM despite its `className` correctly including
`opacity-95` (confirmed by reading both in the same query — this is not a
before/after-render timing mismatch). Then `Button`'s `danger` variant did
the same thing right after a phase transition (`transition-colors` stuck
on the *previous* variant's background/text color, again with a verifiably
correct `className`). Waiting and re-querying did **not** self-heal either
case — these are stuck, not slow. Given three independent occurrences, all
involving a `transition-*` utility co-occurring with unrelated
animation/DOM activity elsewhere on the page (never a case of two
transitions racing on the *same* element), the fix this time was
systemic: removed `transition-colors` from `Button` entirely (all four
variants) and the two leftover `transition-colors` instances on native
`<select>` elements, rather than patching each button/element that
happened to get caught by it. None of these transitions were load-bearing
UX — a button's color changing instantly on click/hover reads fine — so
removing them trades a barely-noticeable hover polish for eliminating a
whole bug class. **If a future agent sees a "className is right but the
color/opacity is wrong" bug during browser verification here, check for a
`transition-*` utility on that element before assuming the component logic
is broken — this is now three-for-three.**

## Files Modified / Added
- `app/tokens.css` (repainted), `app/[locale]/layout.tsx` (fonts),
  `app/globals.css` (font cleanup)
- `components/ui/RevealCard.tsx` (penumbra look), `Button.tsx`
  (`transition-colors` removed), `CodeInput.tsx`/`PlayerChip.tsx`
  (`accent-mint`/`accent-rose` tokens removed — repointed to
  `action-primary`)
- `components/platform/RoomLobby.tsx` (full re-skin, hexagon accent),
  `RoomWaitingLobby.tsx`, `MultiDeviceRoom.tsx`
- `app/[locale]/page.tsx`
- `games/impostor/views/Player.tsx`, `SingleDevice.tsx` (`select`
  `transition-colors` removed)
- `games/who-am-i/views/Player.tsx` (`select` `transition-colors`
  removed), `SingleDevice.tsx`
- `tests/unit/design-tokens.test.ts` (new pairs: success/danger surfaces,
  gold, penumbra text — 17 assertions total)
- `docs/09_ai/tasks/TASK-0029-paper-and-felt-direction.md` (new),
  `docs/09_ai/CURRENT_STATE.md`, `docs/ROADMAP.md`, this file

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`,
  strict branch protection. Unchanged by this task.
- The dev server in this environment binds whatever port is free
  (`autoPort: true`); at the time of this task's verification it happened
  to land on `:3000` since the other project on this machine wasn't
  running. Don't assume a fixed port.
- The `element.click()` vs. full pointer/mouse event sequence tooling
  quirk from `TASK-0028`'s handoff still applies — use the full
  `pointerdown → mousedown → pointerup → mouseup → click` sequence for
  reliable programmatic clicks during browser verification here.

## Pending Tasks
- **M3.5 code task 3 (Identity & polish):** the real Nex hexagon as an
  actual favicon/PWA manifest/app icon system (this task only added a
  small inline SVG preview in the lobby header — not the real icon
  files), per-game hexagon-interior marks (`BDR-0001` §4: a mask
  silhouette for Impostor, a question mark for Who Am I, a grid for
  Battleship later), a visible language switcher (retires
  `RoomLobby.tsx`'s remaining bilingual labels — untouched by this task
  since it's a copy/i18n concern, not a tokens/palette one), room-code
  copy/share affordance, and a final accessibility pass.
- Founder playtest of multi-device Who Am I on real phones (M3's last open
  item — independent of all of the above).
- M1's dedicated two-real-phones reconnection test (independent, still
  open from earlier handoffs).

## Next Suggested Task
- M3.5 code task 3: hexagon/PWA/language switcher/room-code share/a11y
  pass — the last of the three queued code tasks, after which M4
  (Battleship) can start on a genuinely finished design system.
- Founder's multi-device Who Am I playtest remains independent and can
  happen whenever.
