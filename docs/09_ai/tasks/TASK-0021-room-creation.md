# TASK-0021: Room Creation & Join-by-Code Primitives

### Goal
Implement the room creation, room code generation (4-character uppercase e.g. `ABCD`), and join-by-code primitives in `lib/realtime/` using Supabase Realtime Presence and Broadcast. This is the second slice of M1 (`docs/ROADMAP.md`).

### Scope — in
- Room code generator in `lib/realtime/code.ts` (4-character uppercase code using unambiguous characters: A-Z minus O, I, Z, 0, 1).
- Room channel management and presence state in `lib/realtime/room.ts`:
  - `createRoom(userId, displayName)`: Creates a Supabase Realtime channel for room `room:<CODE>`, tracks presence, sets creator as host.
  - `joinRoom(code, userId, displayName)`: Connects to existing channel `room:<CODE>`, tracks presence.
  - Reconnection & Host Migration (ADR-0001 §4): Host role automatically transfers to the next longest connected present player if current host leaves/disconnects.
- Shared TypeScript types for Room, Player, and Presence in `lib/types/room.ts`.
- Unit tests in `tests/unit/room.test.ts` covering room code generation, presence state updates, and host migration logic using mocks.

### Scope — out (non-goals for this task)
- No complex UI screens or game views yet — that's the next slice of M1 (placeholder state & device modes).
- No new durable database tables (all room/presence state is ephemeral per ADR-0001 §3).
- No game reducers or game content.

### Files this task may touch
- `lib/realtime/**`
- `lib/types/**`
- `tests/unit/room.test.ts`
- `docs/09_ai/CURRENT_STATE.md`
- `docs/09_ai/HANDOFF.md`

### Relevant context
- ADR-0001 §3 (ephemeral state) & §4 (realtime resilience: reconnection by user_id, host migration).
- `docs/05_engineering/CONVENTIONS.md` (naming and strict TypeScript rules).

### Definition of Done
- Matches `docs/05_engineering/CONVENTIONS.md`'s Definition of Done in full.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run test` all pass.
- Unit tests cover room code generation, presence state tracking, and host migration.
- `CURRENT_STATE.md` and `HANDOFF.md` updated.
- Dedicated branch `feat/room-creation` pushed, PR opened, CI green, merged via PR.

### How to verify
1. `pnpm run test` verifies room code generator and room state machine unit tests.
2. `pnpm run typecheck` and `pnpm run lint` pass cleanly with 0 errors.
