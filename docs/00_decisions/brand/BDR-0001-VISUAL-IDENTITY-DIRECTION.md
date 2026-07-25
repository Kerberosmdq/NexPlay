---
id: BDR-0001
title: Visual Identity Direction — Paper & Felt, with Penumbra Reveals
status: Accepted
version: 1.0.0
category: Brand Decision Record

authors:
  - Miguel Giles (Founder & Product Owner)
  - Claude (AI Design Lead)

created: 2026-07-24
updated: 2026-07-24

language: English

depends_on:
  - PROJECT_CONSTITUTION (Article 10)
  - NEXPLAY_PLAN §5

required_by:
  - ADR-0004
  - docs/04_design/FEEL.md
  - all future UI screens

tags:
  - brand
  - visual-identity
  - design
---

# BDR-0001 — Visual Identity Direction: Paper & Felt, with Penumbra Reveals

## Status
Accepted.

## Context
A full UX/UI audit of the shipped app (M0–M3) found that NexPlay currently
has no visual identity — it has six competing button treatments, zero
components consuming `app/tokens.css`, 43 hand-written hex values across 7
files, no trace of the Nex hexagon anywhere on screen, and six measured
WCAG AA contrast failures on the entry screen alone (e.g. white text on
`#FF8C00` at 2.33:1, requiring 4.5:1). None of this is a matter of taste —
it is the direct, measurable consequence of `NEXPLAY_PLAN.md` §5's "design
tokens first" principle never having been enforced.

`PROJECT_CONSTITUTION.md` Article 10 requires every significant screen to
explore at least three distinct design directions before committing to
one, and to never default to glassmorphism. This record is that exploration
for NexPlay's signature screen (room entry) and its signature moment (the
secret reveal in Impostor / Who Am I), plus the decision that follows from
it.

Three directions were mocked up and compared side by side against the
current shipped screen:

- **A — Paper & Felt.** A physical board-game world: cardstock, table felt,
  wooden tokens, hand-stamped ink. Light ground, warm neutrals, a deep
  green primary action, terracotta accents. Motion is physical — cards
  flip, tokens drop with weight, counters click forward mechanically.
- **B — Carnival Neon.** A committed dark world: neon tube marquee,
  chasing bulbs, arcade push-buttons. This is, in effect, "the current
  direction's intention, executed for real" — same electric-purple/neon
  DNA, but with every color pair actually validated for contrast instead
  of chosen by eye.
- **C — Blocks.** A modern wooden-toy language: flat shapes, thick black
  outlines, corrected primary colors, wide bold type. Accessibility is
  structural — every element carries a 3px dark outline, so a contrast
  failure is nearly impossible to introduce by accident.

## Decision

**NexPlay's base visual language is Direction A, Paper & Felt — with
Direction B's dark, glowing treatment carved out as a deliberate exception
reserved for one specific moment: the private reveal** (a secret role, a
secret word). The rest of the product lives in A's tactile, well-lit world;
the reveal moment alone drops into penumbra — the screen dims, a warm glow
gathers around the card, as if someone cupped a hand around it to keep
others from seeing. This is not two design systems; it is one system with
one deliberately staged atmosphere change, used only where the game's own
fiction calls for secrecy.

### Why this direction, specifically
- It is the only one of the three that reads as *a board game*, not *an
  app about board games* — which is the actual differentiator NEXPLAY_PLAN
  §1 describes ("crafted, distinctive, kid-friendly"), not a generic
  party-app look.
- Light-ground-by-default solves a real, practical problem the current
  dark UI has: this app is used on phones, outdoors, at a kitchen table,
  at a kid's eye level, in daylight — a screen that fights ambient light is
  a screen that gets held at a bad angle to be read.
- Reserving darkness for the reveal moment *earns* the drama the plan asks
  for ("the reveal moment... should feel like an event, not a page load")
  instead of spending that atmosphere everywhere and diluting it.
- The hexagon (NexPlay's brand anchor per `NEXPLAY_PLAN.md` §5) sits
  naturally as a wax-seal / token motif in A's material world; it has no
  equally natural home in B or C.

### What this commits every future screen to
1. **Ground:** warm, light neutrals (parchment, not white) as the default
   surface. Dark is never the default; it is invoked, not inherited.
2. **Palette anchors** (formalized as semantic tokens in `ADR-0004`):
   - Parchment ground — `#EFE6D6`
   - Ink (primary text) — `#2B2118`
   - Primary action (felt green) — `#1F6B52`
   - Accent (terracotta stamp) — `#C0562A`
   - Border / muted gold — `#C79A62`
   - Penumbra ground (reveal-only) — `#0A0F2C`, with a single warm glow
     accent, not the full neon palette from Direction B.
3. **Typography roles:** a condensed, confident display face for
   headlines/branding (does the job the current all-caps `font-black`
   overuse was reaching for, deliberately instead of accidentally); a
   warm, humanist body/UI face for everything read at length or tapped;
   a monospace utility face reserved for room codes, timers, and scores
   (digits benefit from tabular, unambiguous glyphs — a 4-letter room
   code is data, not prose).
4. **The hexagon is real.** A literal hexagon mark, used as the app icon,
   favicon, and PWA install icon, with each game reinterpreting its
   *interior* per `NEXPLAY_PLAN.md` §5 (e.g. a mask silhouette for
   Impostor, a question mark for Who Am I, a grid for Battleship) while
   the outer hexagon shape never changes.
5. **Penumbra is earned, not decorative.** The dark/glow treatment is used
   *only* for: viewing your own secret role or word, and the moment it is
   revealed to the group. It is never used for lobbies, configuration,
   waiting states, or scoreboards — using it there would cheapen the one
   moment it exists to dramatize.
6. **No glassmorphism, no gradient-hero SaaS look, no generic dashboard
   chrome** — already law under Article 10, reaffirmed here because both
   rejected alternatives (B and C in isolation) would have been easy to
   let drift toward one of those defaults over time.

## Alternatives Considered
- **Direction B alone (Carnival Neon), full-time:** rejected as a
  full-product ground. It is, in essence, a corrected version of what
  ships today, and the audit's own contrast failures happened *because* a
  dark-neon UI makes every color choice a live accessibility risk that has
  to be individually validated. It remains valuable — repurposed as the
  reveal-only penumbra treatment above, where its glow and drama are an
  asset rather than a liability.
- **Direction C alone (Blocks):** rejected as the sole direction, not for
  any flaw — it is the most accessible of the three by construction and
  the safest choice — but because it is also the least atmospheric, and a
  secret-reveal moment (the emotional core of both Impostor and Who Am I)
  needs a mood shift that flat, evenly-lit blocks can't provide. Its
  discipline (thick outlines, corrected primaries) is worth keeping in
  mind as a reference point when validating contrast in `ADR-0004`, even
  though it isn't the chosen aesthetic.
- **Repainting the current direction rather than replacing it:** rejected.
  The audit found the current direction's problems are structural (no
  token consumption, no motion system, no reduced-motion support), not
  cosmetic — a repaint would reproduce the same failure mode with new
  colors inside two or three screens.

## Consequences
- **Positive:** one coherent world to design every future screen and every
  future game (Battleship, and beyond) into, with a single named exception
  for one dramatic moment instead of ad-hoc per-screen mood choices.
- **Positive:** a light-ground default is inherently easier to keep AA/AAA
  compliant than the dark-and-neon status quo, reducing how much contrast
  policing `ADR-0004`'s enforcement mechanism has to do.
- **Negative / cost:** every existing screen (6 views across 2 games plus
  the lobby/room components) needs to be ported to the new direction. This
  is scoped as M3.5's second code task (`docs/ROADMAP.md`) — not silently
  absorbed into unrelated feature work.
- **Follow-up:** exact token values, component primitives, and the motion
  vocabulary implementing "penumbra" are specified in `ADR-0004`, not
  here — this record fixes the *direction and rationale*, not the
  implementation.

## Related Documents
- `docs/NEXPLAY_PLAN.md` §5 (Design & distinctiveness)
- `docs/PROJECT_CONSTITUTION.md` Article 10
- `ADR-0004` — Design System Contract (tokens, primitives, motion)
- `docs/04_design/FEEL.md` — personality doc built on this decision
- `docs/ROADMAP.md` — M3.5, the milestone this record opens

## Changelog
### Version 1.0.0
- Initial accepted version, following a full UX/UI audit and three mocked
  directions (Paper & Felt, Carnival Neon, Blocks) compared side by side.
