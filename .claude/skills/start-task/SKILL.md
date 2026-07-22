---
name: start-task
description: Use before starting any NexPlay implementation task. Reads the mandatory governance docs, verifies branch and scope, and confirms readiness before touching code. Trigger on "start task", "begin task", "let's start working on <task>".
---

# Start Task

This skill wraps `docs/09_ai/AI_ONBOARDING.md`'s mandatory reading order so any
agent — regardless of which AI is running it — starts a task the same way.
The docs are the source of truth; this skill just enforces reading them in
order, every time, before any code is written.

## Steps

1. **Read, in this exact order:**
   - `docs/PROJECT_CONSTITUTION.md`
   - `docs/NEXPLAY_PLAN.md`
   - `docs/ROADMAP.md` (confirm the current milestone)
   - `docs/09_ai/CURRENT_STATE.md`
   - Any ADR relevant to the area being touched (`docs/00_decisions/architecture/`)
   - `docs/05_engineering/CONVENTIONS.md`
   - The assigned task specification

2. **Verify branch state:**
   - Confirm you are NOT on `main`.
   - If no dedicated branch exists yet for this task, create one following
     `CONVENTIONS.md` naming (`feat/<slug>`, `fix/<slug>`, `docs/<slug>`).
   - Confirm the branch name matches what will be recorded in
     `CURRENT_STATE.md`/`HANDOFF.md` once the task starts.

3. **Verify scope before writing anything:**
   - Restate the task's definition of done in your own words.
   - Check it against `docs/ROADMAP.md` — is this task actually part of the
     current milestone, or does it belong in `docs/BACKLOG.md` instead?
   - Check it against the current milestone's non-goals
     (`docs/NEXPLAY_PLAN.md` §2). If the task touches a non-goal or requires
     changing a shared contract (ADR-0002's `GameModule` interface, the
     persistence boundary in ADR-0001), stop and ask before proceeding —
     don't improvise past it.

4. **Report readiness** in one short summary: branch name, task scope
   restated, any ADR constraints that apply, and confirmation that nothing
   here reaches into an explicit non-goal or backlog item.

## When to stop and ask instead of proceeding
- The task isn't clearly scoped in an existing task spec.
- The task would change a contract other agents depend on (`GameModule`,
  room/session API, design tokens) without an ADR update.
- The task touches something listed as an explicit non-goal.
