# TASK-0027: Visual Identity Direction & Design System Contract (paperwork phase)

### Goal
Close the gap a full UX/UI audit surfaced: NexPlay has no enforced design
system (`app/tokens.css` has zero consumers; 43 hand-written hex values are
scattered across 7 files; the entry screen fails WCAG AA contrast in six
places; the "reveal" animation the plan calls "the" signature moment
references a CSS class that doesn't exist). Per `PROJECT_CONSTITUTION.md`
Article 10 and `NEXPLAY_PLAN.md` §7.2 rule 3, a shared visual contract needs
its own decision records *before* multiple screens get rebuilt against it —
this task is that paperwork, opening the new `M3.5` milestone
(`docs/ROADMAP.md`). No component code changes in this task; those are the
three follow-up code tasks M3.5 tracks.

### Scope — in
- `docs/00_decisions/brand/BDR-0001-VISUAL-IDENTITY-DIRECTION.md` — the
  chosen visual direction ("Paper & Felt" base, with the neon/penumbra
  treatment reserved for secret-reveal moments), satisfying Article 10's
  "explore ≥3 directions" requirement, with the other two documented as
  alternatives considered.
- `docs/00_decisions/architecture/ADR-0004-DESIGN-SYSTEM-CONTRACT.md` —
  turns `ADR-0001` §1's "styling driven entirely by design tokens" from
  aspiration into an enforceable contract: semantic paired tokens, a
  mandatory `components/ui/` primitive set, a named motion vocabulary with
  mandatory `prefers-reduced-motion` fallbacks, and contrast checked by unit
  test rather than eyeballed.
- `docs/04_design/FEEL.md` — the living personality doc `NEXPLAY_PLAN.md`
  §5 promises and that has never been written (the folder currently has
  only a placeholder README).
- `docs/ROADMAP.md` — insert milestone **M3.5 — Design System & Visual
  Identity** between M3 and M4, as an explicit, written scope decision (not
  silent scope creep), and note that M5's "visual polish pass" now builds
  on M3.5's foundation instead of starting from zero.
- `docs/04_design/README.md` — list `FEEL.md` under Contents.

### Scope — out (non-goals for this task)
- No changes to `app/tokens.css`, any component, or any game view. Token
  values and primitive components are M3.5's first code task.
- No changes to `games/who-am-i/` or anything touched by the still-open
  `feat/who-am-i-lose-on-wrong-guess` branch (PR #22) — unrelated,
  untouched by this task.
- Does not resolve M1's outstanding two-real-phones reconnection test or
  M3's outstanding founder playtest of multi-device Who Am I — both remain
  open, tracked separately, and are not blocked by or blocking this task.
- No new dependencies, no CI changes.

### Files this task may touch
- `docs/00_decisions/brand/BDR-0001-VISUAL-IDENTITY-DIRECTION.md` (new)
- `docs/00_decisions/architecture/ADR-0004-DESIGN-SYSTEM-CONTRACT.md` (new)
- `docs/04_design/FEEL.md` (new)
- `docs/04_design/README.md`
- `docs/ROADMAP.md`
- `docs/09_ai/CURRENT_STATE.md`
- `docs/09_ai/HANDOFF.md`
- `docs/09_ai/tasks/TASK-0027-design-system-direction.md` (this file)

### Relevant context
- `docs/PROJECT_CONSTITUTION.md` Article 10 (original design, ≥3 directions
  explored per significant screen, never glassmorphism).
- `docs/NEXPLAY_PLAN.md` §5 (Design & distinctiveness — tokens first, the
  living "Feel" doc, motion as an event not a page load).
- `ADR-0001` §1 (styling clause this ADR-0004 makes enforceable) and
  `ADR-0002` (the `GameModule` contract — the pattern this follows for how
  a shared contract gets amended deliberately, not silently).
- The audit that produced this task measured the running app directly
  (contrast ratios via computed styles at 375×812, `animate-in` verified
  absent via `document.fonts`/computed `animationName`, token usage via
  grep for `var(--color-`) rather than reading code alone.

### Definition of Done
- All five files above exist/are updated, cross-reference each other and
  the existing docs they depend on, and use the same frontmatter shape as
  `ADR-0001`/`ADR-0002` (BDR/ADR) so tooling and future agents parse them
  uniformly.
- `docs/ROADMAP.md`'s milestone-ordering rule ("milestones ship in order")
  is respected in spirit: M3.5 is written as a deliberate, explicit
  insertion, and it's stated plainly that M3's playtest gap is unrelated
  and still open — not quietly dropped.
- This is a docs-only task: no `lint`/`typecheck`/`test` regressions are
  possible, so the check is "no broken cross-references between docs" in
  place of running the app's test suite.
- No hardcoded UI strings/content introduced (n/a — no UI code in this
  task).
- `docs/09_ai/CURRENT_STATE.md` and `docs/09_ai/HANDOFF.md` updated per
  `finish-task`.

### How to verify
- Read `BDR-0001` → `ADR-0004` → `FEEL.md` → `ROADMAP.md` M3.5 entry in
  that order and confirm each links back correctly and none contradicts
  another (e.g. the palette anchors named in `BDR-0001` are the ones
  `ADR-0004` turns into tokens; `FEEL.md`'s "penumbra" ritual matches
  `BDR-0001`'s decision).
- Confirm `docs/ROADMAP.md` still reads top-to-bottom as one coherent
  milestone sequence after the insertion.
- `git diff main --stat` should show only the files listed above.
