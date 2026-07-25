# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0027
- **Title**: Visual Identity Direction & Design System Contract (paperwork phase)

## Current Branch
- `docs/design-system-direction`, branched fresh off `main` (not on top of
  any feature branch) — this task is docs-only and deliberately unrelated
  to any in-flight game work.
- **Heads-up for the next agent:** `PR #22` (`feat/who-am-i-lose-on-wrong-
  guess`) merged into `main` (squashed as `158b5bc`) while this task was in
  progress. `docs/09_ai/CURRENT_STATE.md` already reflected that merge by
  the time this task edited it — no conflict, just noting the timing in
  case anyone is confused about why this branch's diff doesn't include
  that game-logic change (it's already on `main` independently).

## What's in this task
A founder request for an exhaustive UX/UI audit ("busca mejoras visuales,
profesionalismo y animaciones divertidas... quiero lo mejor de lo mejor")
led to measuring the shipped app live in a browser (375×812, computed
styles, `document.fonts`, contrast ratios from actual rendered colors —
not just reading source). That audit found the app has no enforced visual
system, and the founder chose to open the resulting redesign as a real
milestone rather than freelance it into unrelated branches. This task is
the paperwork half of that decision — see `docs/ROADMAP.md`'s new **M3.5**
entry for the full plan and the three code tasks it queues.

Founder's two explicit choices that shaped this task:
1. **Visual direction:** "A + penumbra de B" — Paper & Felt as the base
   language, with the neon/dark treatment from the rejected "Carnival
   Neon" direction narrowed to one use: the secret-reveal moment only.
   Recorded in `BDR-0001`.
2. **Sequencing:** "Papeles primero" — write the BDR, the ADR, the FEEL
   doc, and the ROADMAP entry *before* any component code, per
   `NEXPLAY_PLAN.md` §7.2 rule 3 (shared contracts get an ADR before
   parallel work builds against them) and Article 10 (explore ≥3
   directions before committing). This task is exactly that; no
   `components/ui/`, `app/tokens.css`, or game-view code was touched.

## Why this task matters beyond "one more doc"
`ADR-0001` §1 already *said* "no component hardcodes a raw value" — it was
never enforced, and the audit's numbers show what that costs in practice
(zero token consumers, 43 hardcoded hex values, six contrast failures, a
signature animation that silently does nothing because its package was
never installed). `ADR-0004` is what makes that clause a checked contract
instead of a sentence nobody follows. Skipping this paperwork and jumping
straight to repainting components would very likely reproduce the same
failure mode with new colors — which is exactly what the audit found wrong
with the *current* direction relative to what shipped before it.

## Files Modified / Added
- `docs/00_decisions/brand/BDR-0001-VISUAL-IDENTITY-DIRECTION.md` (new)
- `docs/00_decisions/architecture/ADR-0004-DESIGN-SYSTEM-CONTRACT.md` (new)
- `docs/04_design/FEEL.md` (new)
- `docs/04_design/README.md` — links to `FEEL.md`
- `docs/ROADMAP.md` — new M3.5 entry between M3 and M4; M5's polish-pass
  description updated to build on M3.5 instead of starting from zero
- `docs/09_ai/tasks/TASK-0027-design-system-direction.md` (new)
- `docs/09_ai/CURRENT_STATE.md`, this file

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase project live, Vercel auto-deploying
  `main`, branch protection strict on `main`. Nothing about this task
  changes any of that.
- **Not part of this task, but observed in passing:** a small,
  unrelated dev-convenience change (`"autoPort": true` in
  `.claude/launch.json`, so the local preview tool can find a free port
  when 3000 is occupied by another project on this machine) is sitting in
  a `git stash` on `feat/who-am-i-lose-on-wrong-guess` from this same
  session, deliberately kept out of this docs branch to avoid bundling
  unrelated changes in one commit. Pop it there if useful
  (`git stash list` to find it), or drop it — it's a convenience tweak,
  not a fix tied to any task.
- The audit that produced this task's decisions is not itself checked into
  the repo (it was a conversational deliverable) — `BDR-0001`, `ADR-0004`,
  and `FEEL.md` carry forward every finding that matters; nothing was left
  only in chat history.

## Pending Tasks
- **M3.5 code task 1 (System):** implement `ADR-0004` — rewrite
  `app/tokens.css` as semantic paired tokens, build the `components/ui/`
  primitive set (`Button`, `Card`, `Field`, `CodeInput`, `PlayerChip`,
  `Screen`, `RevealCard`, `Scoreboard`, `WaitingState`), add contrast unit
  tests per token pair, port the 6 existing views onto the new primitives
  with **no visual change yet** — this task proves the system before the
  next one changes how anything looks.
- **M3.5 code task 2 (Direction):** apply `BDR-0001`'s Paper & Felt
  palette/typography and the penumbra reveal treatment, screen by screen.
- **M3.5 code task 3 (Identity & polish):** real hexagon mark (favicon,
  PWA manifest + icons), a visible language switcher (this retires the
  bilingual labels the audit found in `RoomLobby.tsx` for good), room-code
  copy/share affordance, and a final accessibility pass against
  `ADR-0004`'s contrast tests.
- Founder playtest of multi-device Who Am I on real phones (M3's last open
  item — independent of all of the above).
- M1's dedicated two-real-phones reconnection test (independent, still
  open from earlier handoffs).

## Next Suggested Task
- Start M3.5 code task 1 (tokens + primitives + motion vocabulary, ported
  onto the existing 6 views with no visual change) — this is the one that
  unblocks task 2 and 3, and is independent of the founder's own playtest
  work on Who Am I.
- If the founder plays multi-device Who Am I first instead, that's fine —
  the two threads don't block each other; whichever happens first, update
  this file and `CURRENT_STATE.md` accordingly rather than letting them
  drift out of sync with the branch/PR that lands.
