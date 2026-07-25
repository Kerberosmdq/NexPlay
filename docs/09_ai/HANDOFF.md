# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0028
- **Title**: Design System — Tokens, Primitives & Motion (M3.5 code task 1)

## Current Branch
- `feat/design-system-tokens-and-primitives`, branched off `main` after
  `PR #23` (paperwork) and `PR #24` (autoPort) were both merged — this
  branch is rebased cleanly on top of both.
- Also independently on `main` since this branch was created: `PR #22`
  (`feat/who-am-i-lose-on-wrong-guess`) was already merged before this
  branch existed, so it's included, not a parallel thread to reconcile.

## What's in this task
`ADR-0004` (from `TASK-0027`) said the design-system contract would be
proven by porting the *existing* six views onto it with no visual change,
before `BDR-0001`'s Paper & Felt direction changes how anything looks
(that's code task 2). This task is that proof:

1. **`app/tokens.css` rewritten** as semantic, paired tokens (`surface`,
   `surface-raised`, `surface-sunken`, `surface-well`, `ink`, `ink-muted`,
   `line`, `focus`, `action-primary`/`-hover`/on-primary`,
   `action-secondary`/.../`action-danger`/..., plus reserved
   `penumbra-ground`/`penumbra-glow` for code task 2), mapped into
   Tailwind's theme via `@theme inline`. The two real contrast failures
   the audit found (white on `#FF8C00` at 2.33:1, white on `#8B5CF6` at
   4.23:1) are fixed using hues **already in the brand** — `#7c3aed`
   (previously only the hover shade) as the primary action background, and
   dark ink (`#13072b`, previously only a surface color) as the secondary
   action's foreground instead of white. Verified live: both pairs now
   pass AA (5.70:1 and 8.24:1).
2. **`app/motion.css` added**: the four named gestures from `ADR-0004` §3
   (`reveal`, `deal`, `celebrate`, `pulse`), each a CSS keyframe + utility
   class, with one `prefers-reduced-motion` block neutralizing all four.
   This is the real fix for the audit's top finding: the Impostor reveal
   used to reference `animate-in fade-in zoom-in` from
   `tailwindcss-animate`, a package that was never installed
   (`animationName: "none"` verified live, before this task). Verified
   live, after: `animationName: "nx-reveal"`, 320ms,
   `cubic-bezier(0.34, 1.56, 0.64, 1)`.
3. **`components/ui/` built**: `Button`, `Card`, `Field`, `CodeInput`,
   `PlayerChip`, `Screen`, `RevealCard`, `Scoreboard`, `WaitingState` — the
   full mandatory set from `ADR-0004` §2. `Button` enforces a 56px minimum
   height unconditionally (no smaller size exists), which is why the old
   12px unlabeled "✕" exit control and the segmented mode-switch tabs are
   now real tap targets as a direct, mechanical consequence of adopting
   the primitive — not a separate redesign decision.
4. **`tests/unit/design-tokens.test.ts` added**: parses the real
   `app/tokens.css` (no duplicated palette to drift out of sync) and
   asserts WCAG AA for all three action pairs plus the ink/ink-muted-on-
   surface combinations. 8 assertions, all passing.
5. **All 6 existing views ported** (`RoomLobby`, `RoomWaitingLobby`,
   `MultiDeviceRoom`, `page.tsx`'s `Screen` wrapper, both Impostor views +
   `PlayerRoster`, both Who Am I views) onto tokens/primitives with no
   palette or layout change — verified by reading computed styles live,
   not just by eye.

## Why this task matters beyond "swapped some class names"
This is the task `ADR-0004` exists to make provable: that a shared design
contract holds what already shipped before it's asked to hold something
new (`BDR-0001`'s direction, in code task 2). If this task had needed to
change how anything *looked* to make the system fit, that would have been
a signal the tokens/primitives were mis-designed — it didn't happen here
outside the two deliberate, documented exceptions (the two contrast fixes,
and `RoomLobby.tsx`'s decorative art/wordmark left un-tokenized because
it's being fully replaced, not migrated, by code task 2/3).

## A real bug found and fixed during this task's own browser verification
`CodeInput`'s tiles (the 4-letter room code) briefly rendered the *wrong*
border color after typing two characters back-to-back: a filled tile
would show orange (the "current empty tile" color) instead of mint (the
"filled" color), even though its `className` was verifiably correct at
the same instant. Root cause: the tile had `transition-all` alongside
`motion-pulse` (an infinite CSS animation) toggling on/off on the *same*
element as its class changed rapidly — the combination produced a
genuinely stuck/incorrect computed `border-color` in this browser, not a
transient timing artifact (confirmed by testing an isolated `<div>` with
the same utility classes, which resolved correctly every time in
isolation). Fixed by dropping `transition-all` from the tile — a
snap-to-filled-color change doesn't need a transition, and it isn't one of
`ADR-0004`'s four named gestures anyway. Re-verified live after the fix:
all four tile states show the correct token color simultaneously.

## Files Modified / Added
- `app/tokens.css` (rewritten), `app/motion.css` (new), `app/globals.css`
  (imports motion.css; `body` now reads `--color-surface`/`--color-ink`
  instead of hardcoded hex)
- `components/ui/{Button,Card,Field,CodeInput,PlayerChip,Screen,
  RevealCard,Scoreboard,WaitingState,index}.tsx` (new), `README.md`
  updated
- `tests/unit/design-tokens.test.ts` (new)
- `components/platform/RoomLobby.tsx`, `RoomWaitingLobby.tsx`,
  `MultiDeviceRoom.tsx`
- `app/[locale]/page.tsx`
- `games/impostor/views/Player.tsx`, `SingleDevice.tsx`, `PlayerRoster.tsx`
- `games/who-am-i/views/Player.tsx`, `SingleDevice.tsx`
- `docs/09_ai/tasks/TASK-0028-design-system-tokens-and-primitives.md`
  (new), `docs/09_ai/CURRENT_STATE.md`, this file

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`,
  strict branch protection. Unchanged by this task.
- Local dev note: port 3000 is often occupied by another project on this
  machine (`NexIndu`); `.claude/launch.json`'s `autoPort: true` (merged in
  `PR #24`) handles this automatically now.
- This task's browser verification hit a real tooling quirk worth knowing:
  a plain `element.click()` via `javascript_tool` did **not** reliably
  trigger this app's React 19 event handlers in this environment, even
  though it should per spec. Dispatching a full
  `pointerdown → mousedown → pointerup → mouseup → click` `MouseEvent`
  sequence at the element's actual bounding-rect coordinates worked
  reliably every time. If a future agent sees a click "not doing
  anything" during browser verification here, try the full event sequence
  before concluding the app has a bug.

## Pending Tasks
- **M3.5 code task 2 (Direction):** apply `BDR-0001`'s Paper & Felt
  palette/typography and the penumbra reveal treatment (dim + glow around
  `RevealCard` specifically) screen by screen. The two reserved
  `--color-penumbra-*` tokens and `RevealCard`'s structure already exist
  for this; the palette itself (parchment ground, felt green primary,
  terracotta accent) is `BDR-0001`'s job, not carried over from this task.
- **M3.5 code task 3 (Identity & polish):** real hexagon mark (favicon,
  PWA manifest + icons), a visible language switcher (retires
  `RoomLobby.tsx`'s remaining bilingual labels — deliberately untouched by
  this task, since it's purely a copy/i18n change, not a tokens/primitives
  one), room-code copy/share affordance, final accessibility pass.
- Founder playtest of multi-device Who Am I on real phones (M3's last open
  item — independent of all of the above).
- M1's dedicated two-real-phones reconnection test (independent, still
  open from earlier handoffs).

## Next Suggested Task
- M3.5 code task 2: apply the Paper & Felt direction. Read `BDR-0001` for
  the palette/typography/motion rationale and this handoff's "Pending
  Tasks" note on what's already reserved (`penumbra-*` tokens,
  `RevealCard`'s shape) versus what still needs deciding (exact new
  palette hex values, the display/body/mono typefaces).
- Founder's multi-device Who Am I playtest remains independent and can
  happen whenever — doesn't block or get blocked by code task 2.
