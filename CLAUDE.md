# NexPlay — Agent Entry Point

Before doing anything in this repo, read `docs/09_ai/AI_ONBOARDING.md` and
follow its mandatory reading order. In short:

1. `docs/PROJECT_CONSTITUTION.md`
2. `docs/NEXPLAY_PLAN.md`
3. `docs/ROADMAP.md`
4. `docs/09_ai/CURRENT_STATE.md`
5. Relevant ADR(s) in `docs/00_decisions/architecture/`
6. `docs/05_engineering/CONVENTIONS.md`
7. Your assigned task spec in `docs/09_ai/tasks/` (see `docs/09_ai/CURRENT_STATE.md`
   for which one is active, and `docs/08_templates/TASK_TEMPLATE.md` for the format)

Use the `start-task` skill before starting work and `finish-task` before
reporting a task done — both wrap the docs above. If your tooling doesn't
support Claude Code skills, follow `docs/09_ai/AI_ONBOARDING.md` manually;
it documents the same steps.

`main` is protected by GitHub — direct pushes are rejected, even for the
repo owner. Every change goes through a branch, a PR, and green CI.

Framework-specific notes (this Next.js version may differ from training
data) are in `AGENTS.md`.
