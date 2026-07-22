# Engineering Conventions & Definition of Done

## Purpose
Multiple AI agents will write code in this repo. This document is what keeps
their output looking like it came from one disciplined engineer instead of a
patchwork. When a convention here conflicts with a personal habit, the
convention wins — consistency across agents matters more than any individual
preference, including the assistant's own.

This document is normative for code. For architecture-level decisions, see
the ADRs in `docs/00_decisions/architecture/`. For product scope, see
`docs/NEXPLAY_PLAN.md` and `docs/ROADMAP.md`.

---

## Package manager
- **pnpm only** (ADR-0001 §1). Use `pnpm install`, `pnpm add`, `pnpm run`.
- Never run `npm install` or `yarn` in this repo — they generate a competing
  lockfile. Only `pnpm-lock.yaml` is committed.
- If `package-lock.json` or `yarn.lock` ever appear (e.g. an agent used the
  wrong command out of habit), delete them and reinstall with pnpm before
  committing — do not commit both.

## Folder structure

```
app/                    # Next.js app router routes
components/
  ui/                   # generic, game-agnostic primitives (Button, Modal...)
  platform/             # room/lobby/device-mode shared components
games/
  <game-id>/
    module.ts           # the GameModule implementation (ADR-0002)
    reducer.ts          # pure state machine, unit-tested in isolation
    views/
      Host.tsx
      Player.tsx
      SingleDevice.tsx
    content/
      en.ts
      es.ts
lib/                    # platform logic: rooms, realtime, auth, entitlements
  realtime/
  auth/
  analytics/
content-packs/          # if content is shared across games rather than per-game
i18n/
  en.json
  es.json
supabase/
  migrations/
tests/
  unit/
  e2e/
```

A new game is a new folder under `games/`. It never requires edits to another
game's folder. If a task seems to require that, stop — it likely means the
`GameModule` contract (ADR-0002) needs revisiting, not a workaround.

## Naming
- Files: `PascalCase.tsx` for components, `camelCase.ts` for everything else.
- `GameModule.id` values are `kebab-case` and match the folder name under
  `games/` (e.g. `who-am-i`).
- Realtime channel names, event names, and Supabase table names: `snake_case`.
- No abbreviations that aren't obvious (`config`, `id` fine; `cfg`, `plyr` not).

## TypeScript
- `strict` mode on, no exceptions.
- No `any`. If a type is genuinely unknown at a boundary (e.g. Realtime
  payload), narrow it explicitly with a parser/type guard, not a cast.
- Shared types (Player, Room, GameModule, ConfigSchema) live in `lib/types/`
  and are imported, never redeclared per game.

## Game logic (ADR-0002 enforcement)
- `reducer` functions are pure: no `fetch`, no Supabase client, no
  `Date.now()`/`Math.random()` without an injected value. This is what makes
  them unit-testable without mocking the network.
- `views` read only from the `state` they're given and emit actions upward.
  A view never imports the Realtime client directly.
- No user-facing string or game word lives inline in a component. It comes
  from an i18n catalog or a content pack (ADR-0003 Seam 4).

## Commits
- Conventional Commits format: `type(scope): summary`.
  Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
  Scope: the game id, `platform`, `design`, or `docs`.
  Example: `feat(impostor): add clue reveal to interlude phase`.
- One task = one branch = one focused set of commits. Do not bundle unrelated
  changes (a docs update and a game feature) in the same commit.

## Branching
- Never commit to `main`.
- Branch names: `feat/<task-slug>`, `fix/<task-slug>`, `docs/<task-slug>`.
- Branch name and the task it corresponds to must match what
  `docs/09_ai/CURRENT_STATE.md` / `HANDOFF.md` say — if they drift, fix the
  docs in the same PR, don't leave them stale.

## Testing expectations
- Every `reducer` ships with unit tests covering: normal play, the
  reconnection/absence path (ADR-0001 §4), and at least one invalid-action
  case (reducer ignores or rejects it, doesn't crash).
- Every device-mode flow (single-device pass-and-play, multi-device join) gets
  at least one Playwright e2e test once M1's skeleton exists.
- No task is done with failing or skipped tests. If a test can't be written
  yet (e.g. infra not ready), say so explicitly in the task's handoff notes —
  don't silently omit it.

## Definition of Done (applies to every task)
A task is done only when **all** of the following are true:
1. It matches its task spec's scope exactly — nothing extra, nothing missing.
2. `lint`, `typecheck`, and `test` all pass locally and in CI.
3. New/changed behavior has test coverage per the section above.
4. No hardcoded user-facing strings or game content were introduced.
5. No new durable data was added without an ADR update (ADR-0001 §3).
6. `docs/09_ai/CURRENT_STATE.md` and `docs/09_ai/HANDOFF.md` are updated.
7. The branch name, PR, and state docs agree with each other.

If any of these isn't true, the task is not finished — it's paused. Say so
in the handoff instead of marking it complete.
