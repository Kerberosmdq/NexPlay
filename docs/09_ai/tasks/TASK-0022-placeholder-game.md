# TASK-0022: Placeholder Game & Device Modes Sync UI

### Goal
Implement the `placeholder` game module (`games/placeholder/`) following the `GameModule` contract (ADR-0002) and build the room lobby UI (`components/platform/`) for both single-device and multi-device modes. This completes the core requirements for **M1 — Platform walking skeleton** (`docs/ROADMAP.md`).

### Scope — in
- `GameModule` implementation for `placeholder` game in `games/placeholder/`:
  - `reducer.ts`: Pure state machine for placeholder counter state (`increment`, `decrement`, `finish`).
  - `module.ts`: `GameModule` export matching ADR-0002 contract.
  - `views/Host.tsx`, `views/Player.tsx`, `views/SingleDevice.tsx`: Responsive views for host, player, and pass-and-play single-device mode.
- Platform room UI in `components/platform/`:
  - Room creation and join-by-code UI (`RoomLobby.tsx` / `CreateJoinRoom.tsx`).
  - Device mode selector (`single-device` pass-and-play vs. `multi-device` room code).
- Updated home page in `app/[locale]/page.tsx` to render the lobby and interactive placeholder game loop.
- Unit tests in `tests/unit/placeholder-game.test.ts` for the pure game reducer.

### Scope — out (non-goals for this task)
- No real game logic beyond the placeholder counter — real games (Impostor) start in M2.
- No changes to Supabase database schema or RLS.

### Files this task may touch
- `games/placeholder/**` (new files)
- `components/platform/**` (new/updated components)
- `app/[locale]/page.tsx`
- `tests/unit/placeholder-game.test.ts` (new unit test file)
- `docs/09_ai/CURRENT_STATE.md`
- `docs/09_ai/HANDOFF.md`

### Relevant context
- ADR-0001 (Stack and Persistence Boundary).
- ADR-0002 (GameModule Contract).
- `docs/05_engineering/CONVENTIONS.md`.

### Definition of Done
- Matches `docs/05_engineering/CONVENTIONS.md`'s Definition of Done in full.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run test` all pass.
- Unit tests cover placeholder game reducer and phase transitions.
- `CURRENT_STATE.md` and `HANDOFF.md` updated.
- Dedicated branch `feat/placeholder-game` pushed, PR opened, CI green, merged via PR.

### How to verify
1. `pnpm run test` verifies unit tests for the placeholder reducer.
2. `pnpm run typecheck` and `pnpm run lint` pass with 0 errors.
3. Local browser test (`pnpm dev`): verify creating a room generates a code, joining displays synced placeholder state, and single-device mode renders pass-and-play view.
