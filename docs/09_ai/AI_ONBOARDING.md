# AI Onboarding Guide

## Welcome
Welcome to the Nex ecosystem. As an AI Developer agent, you are responsible for executing assigned repository tasks with high precision, maintaining structural integrity, and adhering strictly to project governance.

## Project Overview
NexPlay is a core project within the Nex ecosystem. All development follows the Nex Development System (NDS), emphasizing clean architecture, documentation as code, strict Git branching, and standardized AI workflows.

## Repository Structure
The repository is structured as follows:
- `docs/`: Central documentation hub.
  - `00_decisions/`: Decision records (ADR, PDR, BDR).
  - `01_foundations/`: Core principles and foundational specs.
  - `02_architecture/`: System and technical architecture.
  - `03_product/`: Product specifications and requirements.
  - `04_design/`: UI/UX designs and specifications.
  - `05_engineering/`: Onboarding, setup, and engineering guides.
  - `06_journal/`: Work logs and session entries.
  - `07_assets/`: Diagrams and documentation images.
  - `08_templates/`: Standard templates for docs and tasks.
  - `09_ai/`: AI governance, onboarding, state, and handoffs.
- `prompts/`: AI prompts and task definitions.
- `.github/`: Repository issue and pull request templates.

## Development Workflow
1. Read mandatory documentation before starting any work.
2. Ensure you are working on a dedicated feature branch.
3. Fulfill task instructions strictly without unauthorized redesigns or extra features.
4. Document all changes and update living status files.
5. Verify changes and provide final task output summary.

## Git Rules
- **Rule 1**: Never work directly on `main`.
- **Rule 2**: Create a dedicated branch for every task (e.g., `feature/<task-name>`).
- **Rule 3**: Keep commits clean and focused strictly on the task scope.

## Documentation Rules
- All repository documentation must be written in English.
- Every documentation file must follow established Markdown standards.
- Documentation is a first-class product artifact.

## Decision Records
- Architectural decisions must be documented via Architecture Decision Records (ADR).
- Product decisions must be documented via Product Decision Records (PDR).
- Brand decisions must be documented via Brand Decision Records (BDR).

## How To Start A Task
1. Read the required documents according to the **Mandatory Reading Order**.
2. Verify or create the specified Git branch for the task and switch to it.
3. Review the task requirements and definition of done.
4. Execute the step-by-step instructions precisely.

## How To Finish A Task
1. Verify that all requirements are met and no unauthorized files were modified or created.
2. Update `docs/09_ai/CURRENT_STATE.md` with task progress.
3. Update `docs/09_ai/HANDOFF.md` with handoff details for the next agent/developer.
4. Produce the required final task output summary.

## Mandatory Reading Order
1. `docs/PROJECT_CONSTITUTION.md`
2. `docs/INDEX.md`
3. `docs/09_ai/CURRENT_STATE.md`
4. Assigned Task Specification

## Checklist Before Starting
- [ ] Read `PROJECT_CONSTITUTION.md`
- [ ] Read `INDEX.md`
- [ ] Read `CURRENT_STATE.md`
- [ ] Read the assigned task specification thoroughly
- [ ] Confirmed current Git branch is correct and not `main`

## Checklist Before Finishing
- [ ] Verified all task deliverables against acceptance criteria
- [ ] Confirmed no unauthorized code or business decisions were added
- [ ] Updated `CURRENT_STATE.md`
- [ ] Updated `HANDOFF.md`
- [ ] Verified repository clean state and correct Git branch
