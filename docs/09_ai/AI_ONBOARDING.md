# AI Onboarding Guide

## Welcome
Welcome to the Nex ecosystem. As an AI Developer agent, you are responsible for executing assigned repository tasks with high precision, maintaining structural integrity, and adhering strictly to project governance.

## Project Overview
NexPlay is a mobile-first web app for playing original party and logic
games together, built on one shared platform that every game plugs into.
See `docs/NEXPLAY_PLAN.md` for the full vision, scope, and non-goals.

## Repository Structure
- `docs/`: Central documentation hub.
  - `00_decisions/`: Decision records (ADR, PDR, BDR).
  - `01_foundations/`, `02_architecture/`, `03_product/`, `04_design/`,
    `06_journal/`, `07_assets/`: intentionally empty until M0/M1 produce
    real content for them — see `docs/INDEX.md`.
  - `05_engineering/`: engineering conventions and Definition of Done.
  - `08_templates/`: templates for decision records and task specs.
  - `09_ai/`: AI governance, onboarding, state, handoffs, and task specs
    (`09_ai/tasks/`).
- `app/`, `components/`, `games/`, `lib/`, `i18n/`, `supabase/`, `tests/`:
  the application code — see `docs/05_engineering/CONVENTIONS.md` for what
  goes where.
- `.github/workflows/ci.yml`: CI (lint, typecheck, unit tests, e2e).

## Mandatory Reading Order
This is the same order as the root `CLAUDE.md` — that file is the entry
point; this section exists so the order is documented once, not duplicated
and allowed to drift.

1. `docs/PROJECT_CONSTITUTION.md`
2. `docs/NEXPLAY_PLAN.md`
3. `docs/ROADMAP.md`
4. `docs/09_ai/CURRENT_STATE.md`
5. Relevant ADR(s) in `docs/00_decisions/architecture/`
6. `docs/05_engineering/CONVENTIONS.md`
7. The assigned task specification (`docs/09_ai/tasks/`, per `docs/08_templates/TASK_TEMPLATE.md`)

## Development Workflow
1. Read the mandatory documentation above before starting any work.
2. Ensure you are working on a dedicated branch (never `main` — see Git Rules).
3. Fulfill the task specification's scope strictly — no unauthorized
   redesigns, extra features, or changes outside its stated file list.
4. Document all changes and update the living status files.
5. Verify changes (lint, typecheck, test) and provide a final task summary.

## Git Rules
- **Rule 1**: Never commit directly to `main`. This is enforced by GitHub
  branch protection, not just convention — direct pushes to `main` are
  rejected by the server, including for the repo owner.
- **Rule 2**: One task = one dedicated branch, named `feat/<slug>`,
  `fix/<slug>`, or `docs/<slug>` (see `docs/05_engineering/CONVENTIONS.md`).
- **Rule 3**: Push the branch, open a PR, and wait for CI (lint, typecheck,
  unit tests, e2e) to pass before merging. There are no human-approval
  requirements today, but required status checks must be green.
- **Rule 4**: Keep commits clean and focused strictly on the task scope.

## Documentation Rules
- All repository documentation must be written in English.
- Documentation is a first-class product artifact — see
  `docs/PROJECT_CONSTITUTION.md` Article 4.

## Decision Records
- Architectural decisions: Architecture Decision Records (ADR),
  `docs/00_decisions/architecture/`.
- Product decisions: Product Decision Records (PDR), `docs/00_decisions/product/`.
- Brand decisions: Brand Decision Records (BDR), `docs/00_decisions/brand/`.
- A shared contract (the `GameModule` interface, the persistence boundary,
  etc.) is never changed as a side effect of a task — it gets its own ADR
  update first (`docs/NEXPLAY_PLAN.md` §7.2).

## How To Start A Task
Use the `start-task` skill if your tooling supports Claude Code skills
(`.claude/skills/start-task/SKILL.md`); otherwise follow it manually:
1. Read the required documents per the **Mandatory Reading Order** above.
2. Read the assigned task specification in full, including its scope
   boundaries (in/out) and the files it authorizes you to change.
3. Create and switch to the dedicated branch.
4. If anything is ambiguous or the task seems to require touching a
   non-goal (`docs/NEXPLAY_PLAN.md` §2) or a shared contract, stop and ask
   instead of improvising.

## How To Finish A Task
Use the `finish-task` skill if available; otherwise follow it manually:
1. Verify the Definition of Done in `docs/05_engineering/CONVENTIONS.md`
   (lint, typecheck, test all pass; no hardcoded strings; scope matched exactly).
2. Update `docs/09_ai/CURRENT_STATE.md` with task progress.
3. Update `docs/09_ai/HANDOFF.md` with handoff details for the next agent.
4. Push the branch and open a PR — do not attempt to merge to `main` directly.
5. Produce a final task summary.

## Checklist Before Starting
- [ ] Completed the Mandatory Reading Order above
- [ ] Read the assigned task specification, including its scope boundaries
- [ ] Created a dedicated branch (not `main`)

## Checklist Before Finishing
- [ ] Verified all task deliverables against the task spec's Definition of Done
- [ ] Confirmed no unauthorized code or business decisions were added
- [ ] Updated `CURRENT_STATE.md` and `HANDOFF.md`
- [ ] Pushed the branch and opened a PR with CI passing
