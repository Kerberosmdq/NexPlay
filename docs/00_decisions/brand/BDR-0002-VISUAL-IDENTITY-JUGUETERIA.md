---
id: BDR-0002
title: Visual Identity Direction — Juguetería (molded plastic toy)
status: Accepted
version: 1.0.0
category: Brand Decision Record

authors:
  - Miguel Giles (Founder & Product Owner)
  - Claude (AI Design Lead)

created: 2026-10-07
updated: 2026-10-07

language: English

supersedes:
  - BDR-0001

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

# BDR-0002 — Visual Identity Direction: Juguetería

## Status
Accepted. Supersedes `BDR-0001` (Paper & Felt, with penumbra reveals).

## Context
`BDR-0001` gave NexPlay one coherent system for the first time, and its
discipline (semantic paired tokens, tested contrast, one motion vocabulary,
reduced-motion fallbacks) is what makes replacing the *look* cheap now. The
look itself, though, did not achieve the goal it was chosen for. A full
audit of the shipped app on 2026-10-06 found:

- **It reads as the AI default.** A warm cream ground, a heavy slab serif,
  felt green and terracotta is the single most common palette AI-generated
  interfaces converge on today. Article 10 asks for the opposite.
- **Everything has the same weight.** Every surface is a rounded card with a
  tan border; the primary action and a secondary one look alike; the game
  picker was four identical green buttons.
- **It doesn't feel physical.** The direction promised cardboard and wooden
  tokens, but nothing on screen responds like an object: no depth, no
  press, no sound, six animations in total.

The founder asked for a full redesign "outside what AI normally makes."
Following Article 10, four directions were mocked side by side (entry
screen, game picker, the secret moment, and a Connect 4 board, each with a
working press-and-hold reveal and droppable tokens):

- **A — Cuaderno de Recreo.** A school graph-paper notebook: ballpoint ink,
  highlighter, tape, stickers; the secret is a folded note.
- **B — Riso Club.** A risograph zine: two or three overprinted fluorescent
  inks, halftones, misregistration; the secret only becomes legible when
  the two ink plates align.
- **C — Juguetería.** Molded plastic toys: a studded baseplate, buttons
  that physically sink when pressed, chunky tokens with a molded edge,
  primary colors; the secret is a capsule-machine capsule that pops open.
- **D — Teatro de Sombras.** A paper shadow theater: red curtain, a
  backlit screen, cut-out silhouettes; the secret is the curtain opening.

## Decision
**NexPlay's visual language is Direction C, Juguetería.** Every screen is a
piece of a toy box: chunky molded plastic sitting on a studded baseplate,
in a small set of saturated primary colors, where everything you can touch
looks — and reacts — like a physical button.

### Why this direction, specifically
- **It is the clearest for the youngest player.** The audit's priority user
  is a 7-year-old. In this world, "can I tap this?" is answered by shape
  alone: anything tappable has a molded edge and sinks when pressed;
  anything that isn't, doesn't. Games are told apart by color and pictogram
  before reading.
- **It makes the app feel physical, which was the promise `BDR-0001` didn't
  deliver.** Press, snap, bounce and click are the native motions of
  plastic toys, and they map directly onto sound and haptics (phase 3).
- **Every game already lives here.** Connect 4 *is* a plastic toy; so are
  the classic Battleship and Guess Who boards. Impostor and Who Am I fit as
  cards and capsules from the same box.
- **Accessibility is structural.** Solid colors, no translucency, no blur,
  dark ink on white plastic for anything read at length.

### What this commits every future screen to
1. **Ground: the baseplate.** The page background is a toy-blue baseplate
   with a subtle stud pattern. It is the table, not a surface for text:
   body text never sits directly on it.
2. **Panels: white plastic.** Content lives on large white plastic panels
   with a molded bottom edge. Running text is always dark ink on white (or
   on the pale "sunken" plastic used for inputs).
3. **Depth is a solid molded edge, never a blur.** Raised elements carry a
   solid, darker bottom edge (an offset with no blur). No soft drop
   shadows, no gradients, no gloss, no translucency — this is what keeps it
   a toy and not a glossy app icon, and it keeps Article 10's
   no-glassmorphism rule structurally out of reach.
4. **Pressed means pushed down.** A pressed button travels down by its
   edge height and the edge disappears. Disabled controls lose their edge
   entirely (flat, faded) so they never look pressable.
5. **Palette anchors** (formalized as semantic, paired tokens in `ADR-0004`;
   every text/background pair below is ≥4.5:1, measured):

   | Role | Color | Pairs with | Contrast |
   |---|---|---|---|
   | Baseplate (ground) | `#2A66E0` toy blue | white | 5.15:1 |
   | Panel | `#FFFFFF` white plastic | ink `#13213F` | 15.95:1 |
   | Sunken (inputs) | `#EEF3FB` | ink / muted | 14.31 / 6.37:1 |
   | Ink (text) | `#13213F` | — | — |
   | Muted text | `#4A5878` | white | 7.10:1 |
   | Primary action | `#D3261B` toy red | white | 5.17:1 |
   | Secondary action | `#FFC928` toy yellow | ink | 10.35:1 |
   | Success | `#178244` toy green | white | 4.87:1 |
   | Accent | `#8B45D6` toy purple | white | 5.36:1 |
   | Water (Battleship) | `#2D7AB8` | white | 4.58:1 |

   The brighter red (`#EF3B2D`) and green (`#1FA357`) from the mock-up fail
   AA with white text (3.94:1 and 3.26:1) and are **not** used for text
   backgrounds; they may appear only as non-text decoration. Each color has
   a darker *edge* shade for its molded bottom edge — edges are never
   text backgrounds.
6. **Each game owns a color and a pictogram**, used on its picker block,
   its hexagon mark and its setup screen header:
   Impostor — red; ¿Quién soy? — yellow; Conecta 4 — green;
   ¿Quién es Quién? — purple; Batalla Naval — white with blue pictogram.
   Color is never the only signal: the pictogram and name always travel
   with it.
7. **Typography.** Titan One for titles, buttons and big numbers (a chunky,
   rounded display face that reads like molded lettering), used with
   restraint; Baloo 2 for everything read or typed (rounded, humanist,
   friendly to early readers). Sentence case, never forced uppercase
   (`FEEL.md`). Room codes need no monospace face — their alphabet already
   excludes ambiguous letters and digits — and render as individual keycap
   tiles. Timers and scores must use tabular figures; phase 2 verifies
   Baloo 2's support and keeps a monospace face for digits only if it
   lacks them.
8. **The hexagon is a plastic token.** The Nex hexagon becomes a chunky
   yellow molded hex token with its edge, carrying each game's pictogram
   embossed inside (the interior-per-game rule from `NEXPLAY_PLAN.md` §5 is
   unchanged). It replaces the current app icon, favicon and PWA icon.
9. **The secret moment is a capsule.** `BDR-0001`'s penumbra (the screen
   dimming to a dark glow) is retired. Viewing a secret role or word is a
   capsule-machine capsule: while the player holds it, the lid pops off and
   the card inside rises; on release it closes. The rest of the screen
   shows nothing but the baseplate while it's open, so no other content can
   leak. It stays the one staged, dramatic moment in the app — just staged
   with this world's own object instead of a change of lighting.
10. **Physical motion.** Motion follows toy physics: presses sink, tokens
    fall and bounce, pieces snap into place, panels slide in from below.
    Short and springy, never floaty. Every gesture keeps the
    `prefers-reduced-motion` fallback `ADR-0004` already requires.
11. **No new dark theme.** NexPlay remains one deliberate look. Battleship's
    sea is a literal depiction (water), not a theme.

## Alternatives Considered
- **A — Cuaderno de Recreo.** Strongest fit for every game (all five are
  played on paper at school) and best in daylight. Not chosen: the
  founder's choice was C. It remains the reference if the toy look ever
  proves too young for adult guests.
- **B — Riso Club.** The most graphic and the most distinctive in a
  screenshot. Rejected: fluorescent inks fail contrast with white text,
  and what is tappable is the least obvious of the four for a young child.
- **D — Teatro de Sombras.** The most dramatic secret moment. Rejected: a
  dark ground reads poorly in daylight (the same reason `BDR-0001` rejected
  a dark default), and Connect 4 / Battleship have little relation to a
  theater.
- **Keep `BDR-0001` and polish it.** Rejected: the problem is the
  direction itself landing on the AI-default palette, not its execution.

## Consequences
- **Positive:** a single toy-box world with an unambiguous "this is
  pressable" language, ideal for the primary users and a natural home for
  sound and haptics.
- **Positive:** `ADR-0004`'s contract (semantic paired tokens, contrast
  tests, primitives, motion vocabulary) is unchanged, so the switch is a
  token-and-primitive change, not a rewrite of every view.
- **Negative / risk:** it can read as too childish for adult guests, and a
  saturated blue ground is intense over a long session. Mitigations are
  built into the rules above: large white panels, ink text, Titan One only
  for titles and buttons.
- **Negative / cost:** every screen is restyled (phase 2), the app icon set
  regenerated, and emoji illustrations replaced with pictograms.
- **Open follow-up:** the Guess Who portraits are a generic cartoon style
  that belongs to neither the old nor the new world. Phase 2 frames them in
  white plastic card holders; redrawing them in the toy style is a separate
  decision for the founder (it needs the external image tool again). If it
  happens, the agent writes the image-generation prompt (per batch of 8,
  matching `scripts/generate-guesswho-assets.mjs`'s sheet format and each
  character's traits) and the founder runs it in the image tool.

## Implementation phases
- **Phase 2 — visual system:** tokens in `app/tokens.css` (keeping the
  paired-token names and the contrast test), fonts, baseplate and molded
  edge treatment, `Button`/`Card`/`Field`/`CodeInput` restyled, the
  capsule `RevealCard`, per-game pictograms replacing emoji, the hex token
  mark and icon set.
- **Phase 3 — motion, sound, haptics:** phase transitions, toy-physics
  gestures added to the motion vocabulary, a short plastic sound kit with a
  mute control, `navigator.vibrate` on Android.

## Related Documents
- `BDR-0001` — the superseded direction
- `ADR-0004` — Design System Contract (tokens, primitives, motion)
- `docs/04_design/FEEL.md` — this decision in plain language
- `docs/NEXPLAY_PLAN.md` §5, `docs/PROJECT_CONSTITUTION.md` Article 10
- `TASK-0039` — redesign phase 1 (flow fixes that preceded this decision)

## Changelog
### Version 1.0.0
- Initial accepted version, after the 2026-10-06 audit and four mocked
  directions compared side by side.
