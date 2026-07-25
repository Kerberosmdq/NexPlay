---
id: ADR-0004
title: Design System Contract — Semantic Tokens, UI Primitives, Motion Vocabulary
status: Accepted
version: 1.0.0
category: Architecture Decision Record

authors:
  - Miguel Giles (Founder & Product Owner)
  - Claude (AI Architect)

created: 2026-07-24
updated: 2026-07-24

language: English

depends_on:
  - ADR-0001 (§1 styling clause)
  - BDR-0001

required_by:
  - all future game and platform UI work

tags:
  - architecture
  - design-system
  - accessibility
  - motion
---

# ADR-0004 — Design System Contract

## Status
Accepted.

## Context
`ADR-0001` §1 already states the intent: "Tailwind CSS driven entirely by a
design-tokens layer... No component hardcodes a raw color/spacing value."
That clause has never been enforced. A full UX/UI audit of the app as
shipped (M0–M3) found the gap precisely:

- `app/tokens.css` defines 20 CSS custom properties. **Zero** components,
  views, or pages reference any of them (`grep -r "var(--color-" — no
  matches outside the token file itself).
- **43 raw hex color literals** are hand-written across 7 files instead
  (`components/platform/RoomLobby.tsx` alone has 27).
- The same UI concept — a primary call-to-action button — is implemented
  **six different ways** with no shared component, because
  `components/ui/` is empty (a README only).
- Measured directly on the running app at 375×812: **six WCAG AA contrast
  failures** on the entry screen alone, the worst being white text on
  `#FF8C00` at 2.33:1 against a 4.5:1 requirement — caused by
  `--color-text-muted` being defined as a decorative purple that then gets
  used as if it were readable body text.
- The game's signature moment — the Impostor role reveal, which
  `NEXPLAY_PLAN.md` §5 explicitly calls out as needing to "feel like an
  event, not a page load" — is animated with `animate-in fade-in zoom-in`,
  Tailwind classes from `tailwindcss-animate`, **a package that is not
  installed**. Verified live: `getComputedStyle(el).animationName` returns
  `"none"`. The reveal has no animation at all.
- Zero matches for `prefers-reduced-motion` anywhere in the repo.

This ADR turns the unenforced intent in `ADR-0001` §1 into a checkable
contract, and gives `BDR-0001`'s chosen direction (Paper & Felt, with a
penumbra treatment reserved for reveals) a concrete implementation shape.

## Decision

### 1. Tokens are semantic and paired, never raw palette names
`app/tokens.css` is rewritten so every token names a *use*, not a color:
`--surface-default`, `--surface-raised`, `--text-primary`,
`--text-secondary`, `--action-primary-bg` / `--action-primary-fg`,
`--action-secondary-bg` / `--action-secondary-fg`, `--border-default`,
`--focus-ring`, plus the penumbra-only set (`--penumbra-ground`,
`--penumbra-glow`) gated to the reveal component only. Background/foreground
tokens are **defined and consumed in pairs** — a component asks for
`action-primary`, gets both colors together, and can never combine a
background from one pair with text from another. This is what makes the
`#FF8C00` + white failure structurally impossible going forward: the pair
that ships together is the pair that was tested together.

### 2. A mandatory primitive set in `components/ui/`
Every screen composes from these primitives; no game view writes a raw
Tailwind color utility (`bg-[#...]`, `text-purple-...`, etc.) for a
surface/text/action concern again:

- `Button` (variants: primary, secondary, danger; one minimum size, 56px
  tall — a real tap target, not the ~1px-tall ghost input the audit found
  in the room-code field)
- `Card`, `Field`, `CodeInput` (the 4-letter room code entry)
- `PlayerChip` (a player's name + online/host/eliminated state, replacing
  the three near-duplicate roster renderings across Impostor/Who Am I)
- `Screen` (the persistent layout: room code, player name, and an actual
  exit-with-confirmation control, replacing the 12px unlabeled "✕")
- `RevealCard` (the penumbra treatment from `BDR-0001`, implemented once)
- `Scoreboard`, `WaitingState`

A raw hex literal or an un-paired color utility inside `games/` or
`components/` outside `components/ui/` itself is a contract violation once
this ADR's migration (`docs/ROADMAP.md` M3.5) completes.

### 3. A named motion vocabulary, not per-screen animation classes
Four gestures are defined once, in `components/ui/` or a shared
`lib/motion/` module, and consumed by name everywhere:

- **reveal** — the penumbra moment (role/word reveal)
- **deal** — entering a new phase (a card/tile arriving)
- **celebrate** — a correct guess, a win, a score increment
- **pulse** — an idle/waiting state (replacing the spinning-hourglass-emoji
  pattern found in three separate files)

Every gesture ships with a `prefers-reduced-motion` fallback (typically: an
instant state change with no transform/scale, keeping any color or opacity
change that conveys the same information) as part of its single
definition — never bolted on later per screen.

### 4. Contrast is a checked property, not an eyeballed one
Every `action-*` and `text-*` pair added to the token file gets a unit test
(same spirit as `ADR-0002`'s "reducers must be pure and unit-tested")
asserting a ≥4.5:1 contrast ratio between the pair's foreground and
background. A new token pair without a passing test is not merged — this
is the mechanism that prevents the audit's six failures from recurring
under a new color scheme.

### 5. Migration is scheduled, not silent
This ADR governs all *new* UI work immediately. The six existing views
(Impostor ×3, Who Am I ×3) and the platform lobby components are known,
tracked debt — ported as `docs/ROADMAP.md` M3.5's second code task, not
grandfathered indefinitely and not fixed opportunistically inside unrelated
feature branches.

## Consequences
- **Positive:** changing NexPlay's palette, a button's tap target, or how
  a reveal animates becomes a change in one place, provably correct,
  instead of a grep-and-hope across every game.
- **Positive:** `prefers-reduced-motion` support and WCAG contrast become
  properties of the *system*, inherited by every future game (including
  Battleship, M4) for free — the same leverage `ADR-0001` §4's reconnection
  policy gives every game today.
- **Negative:** upfront migration cost across 6 views before the benefit is
  fully realized; explicitly scoped as its own task rather than absorbed
  invisibly into feature work.
- **Follow-up (non-blocking):** a CI check (ESLint rule or a grep-based
  script) that fails a PR introducing a raw hex literal under `games/` or
  `components/` (outside `components/ui/`) would make this contract
  self-enforcing instead of review-dependent. Not mandated by this ADR;
  worth a small follow-up task once M3.5's migration is complete and the
  primitive set has stabilized.

## Alternatives Considered
- **Keep ad-hoc Tailwind per screen:** rejected — this is the status quo
  that produced the audit's findings; not a hypothetical risk but the
  measured, current state of the app.
- **Adopt a third-party component library (shadcn/ui, Chakra, etc.):**
  rejected. It would resolve the primitive-duplication problem but
  conflicts with `PROJECT_CONSTITUTION.md` Article 10 ("original, never
  generic") and `BDR-0001`'s chosen tactile identity — off-the-shelf kits
  are tuned for dashboard aesthetics, the exact look NexPlay exists to
  avoid.
- **Raw palette tokens (`--color-purple-500`) instead of semantic pairs:**
  rejected — this is close to what `tokens.css` already had, and it is
  precisely what allowed a decorative purple to be reused as body text.
  Naming tokens by *use* and pairing fg/bg is what makes misuse structurally
  harder, not just discouraged by convention.

## Related Documents
- `ADR-0001` §1 (the styling clause this ADR enforces)
- `ADR-0002` — GameModule Contract (the pattern followed here: a shared
  contract gets its own ADR before parallel work builds against it)
- `BDR-0001` — Visual Identity Direction (the direction this contract
  implements)
- `docs/04_design/FEEL.md`
- `docs/ROADMAP.md` — M3.5

## Changelog
### Version 1.0.0
- Initial accepted version, following the UX/UI audit that motivated
  `BDR-0001`.
