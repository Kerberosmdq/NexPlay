# TASK-0040: BDR-0002 — Juguetería visual direction (redesign phase 0)

### Goal
Record the founder's choice of visual direction for the M6.5 redesign
(`docs/ROADMAP.md`): Direction C, "Juguetería" (molded plastic toy),
superseding `BDR-0001` (Paper & Felt). Docs only — this is the decision that
phase 2 implements.

### Scope — in
- `BDR-0002` with the four mocked directions as context/alternatives, the
  rules every future screen follows, and palette anchors whose text pairs
  are measured at ≥4.5:1 (the mock-up's red and green failed and are
  replaced).
- `BDR-0001` marked superseded (status, version, changelog).
- `FEEL.md` rewritten for the new world (keeping the kid-first rules, voice
  and voseo).
- `ADR-0004` amended to 1.1.0: contract unchanged; edge tokens, penumbra
  set retired, motion vocabulary extension.
- `ROADMAP.md`: the redesign as milestone M6.5.
- State docs.

### Scope — out (non-goals for this task)
- Any code, token or asset change — phase 2.
- Regenerating Guess Who portraits in the toy style — a separate founder
  decision, recorded as an open follow-up in `BDR-0002`.

### Files this task may touch
- `docs/00_decisions/brand/BDR-0001-VISUAL-IDENTITY-DIRECTION.md`
- `docs/00_decisions/brand/BDR-0002-VISUAL-IDENTITY-JUGUETERIA.md` (new)
- `docs/00_decisions/architecture/ADR-0004-DESIGN-SYSTEM-CONTRACT.md`
- `docs/04_design/FEEL.md`, `docs/04_design/README.md`
- `docs/ROADMAP.md`, `docs/09_ai/*`

### Relevant context
- 2026-10-06 audit and the four-direction comparison page; founder chose C
  on 2026-10-07 (after first naming A by mistake).
- `TASK-0039` (phase 1), `ADR-0004`, `PROJECT_CONSTITUTION.md` Article 10.

### Definition of Done
- `docs/05_engineering/CONVENTIONS.md`'s Definition of Done (docs-only: no
  broken references between BDR-0001/BDR-0002/ADR-0004/FEEL.md).

### How to verify
- `grep -rn "BDR-0001" docs` shows only historical references, the
  superseded record itself, and `BDR-0002`/`ADR-0004`/`FEEL.md` pointers to it.
