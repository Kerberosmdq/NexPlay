---
name: finish-task
description: Use when a NexPlay implementation task is complete, before reporting it done. Runs the Definition of Done checks and updates the living handoff docs so the next agent (any AI) can pick up cleanly. Trigger on "finish task", "wrap up", "mark this done".
---

# Finish Task

This skill wraps the "How To Finish A Task" section of
`docs/09_ai/AI_ONBOARDING.md` and the Definition of Done in
`docs/05_engineering/CONVENTIONS.md`. A task is not done until every check
here passes — if one fails, the task is paused, not finished.

## Steps

1. **Run the Definition of Done checklist** (`docs/05_engineering/CONVENTIONS.md`):
   - Matches the task spec's scope exactly — nothing extra, nothing missing.
   - `lint`, `typecheck`, and `test` all pass (once the app exists; for
     docs-only tasks, confirm no broken links/refs instead).
   - New/changed behavior has test coverage.
   - No hardcoded user-facing strings or game content were introduced.
   - No new durable data was added without an ADR update.
   - Branch name, any PR, and the state docs agree with each other.

2. **Update `docs/09_ai/CURRENT_STATE.md`:**
   - Move the finished task from "In Progress" to "Completed".
   - Update "Next Task" / "Current Objective" if this task changes what's next.
   - Update "Last Updated" to today's date.

3. **Update `docs/09_ai/HANDOFF.md`:**
   - Last Completed Task (ID/title).
   - Current branch.
   - Files modified.
   - Pending tasks / next suggested task.
   - Any warnings the next agent needs (e.g. "don't touch X until ADR-000N
     is updated", or a check that couldn't be run and why).

4. **Check `docs/ROADMAP.md` and `docs/BACKLOG.md`:**
   - If this task completes a milestone's "Done when" criteria, note it.
   - If anything came up mid-task that's a good idea but out of scope, add it
     to `BACKLOG.md` instead of building it — don't let it silently expand
     the task.

5. **Produce a final summary**: what changed, what the Definition of Done
   check found (pass/fail per item), and what the next agent should read
   first per the updated `HANDOFF.md`.

## If something can't be finished
Do not mark the task complete. Instead: leave it `in_progress` in
`CURRENT_STATE.md`, record exactly what's blocking it in `HANDOFF.md`
("Warnings"), and say so plainly in the summary rather than reporting success.
