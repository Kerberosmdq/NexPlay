# Games

One folder per game, each implementing the `GameModule` contract (ADR-0002):

```
games/<game-id>/
  module.ts        # GameModule implementation
  reducer.ts        # pure state machine, unit-tested in isolation
  views/
    Host.tsx
    Player.tsx
    SingleDevice.tsx
  content/
    en.ts
    es.ts
```

A new game is a new folder here. It must not require edits to another game's
folder or to the shared platform — see
`docs/00_decisions/architecture/ADR-0002-GAME-MODULE-CONTRACT.md`.

No games exist yet; the first is Impostor, scheduled for M2 (`docs/ROADMAP.md`).
