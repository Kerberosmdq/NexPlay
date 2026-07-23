# Task Specification Template

## Purpose
Defines one unit of assignable work. Per `docs/NEXPLAY_PLAN.md` §7.3, a task
must be small and self-contained enough that an agent can execute it without
improvising scope. Copy this template into `docs/09_ai/tasks/TASK-XXXX-slug.md`
to instantiate a real task.

---

## TASK-XXXX: <Title>

### Goal
One or two sentences: what this task achieves and why (link the relevant
`ROADMAP.md` milestone or `BACKLOG.md` item).

### Scope — in
- Bullet list of exactly what to build/change.

### Scope — out (non-goals for this task)
- Bullet list of things that might seem related but are explicitly not part
  of this task. If it's not listed as "in," treat it as "out."

### Files this task may touch
- Explicit paths or globs. Touching anything outside this list means the
  task's scope was mis-specified — stop and ask rather than expanding it.

### Relevant context
- ADRs, prior task IDs, or docs the assignee must read beyond the standard
  onboarding order.

### Definition of Done
- The concrete checklist from `docs/05_engineering/CONVENTIONS.md`, plus
  anything task-specific (e.g. "unit tests cover the reconnection case").

### How to verify
- Exact commands/steps to confirm the task works (e.g. `pnpm test`, a
  specific manual browser check).
