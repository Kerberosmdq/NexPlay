# The Feel

> The living personality doc `NEXPLAY_PLAN.md` §5 promises: "captures the
> personality in words and examples so every agent designs toward the same
> vibe." Formal decisions live in `BDR-0002` and `ADR-0004`; this doc is
> their companion in plain language — read this to get the *feel* right,
> read those to get the *values* right.

## In one sentence
NexPlay should feel like tipping a toy box out onto the floor: chunky
plastic pieces in bright colors, buttons that click when you push them,
tokens that drop and bounce — and, when it's time to see your secret, a
capsule that pops open just for you.

## The world this app lives in
Not a "party app." A **toy box**, rendered in a browser because that's the
only way to hand five phones to five people at once. Every surface choice
should answer: *would this exist as a molded plastic piece in a real toy?*
A studded baseplate, a chunky button with a molded edge, a keycap, a
capsule from a prize machine, a plastic Connect 4 frame — yes. Frosted
glass, glossy gradients, a soft blurry drop shadow, a dashboard card — no,
and never, per `PROJECT_CONSTITUTION.md` Article 10.

Three rules make the world hold together:
- **The baseplate is the table.** The blue studded ground is where pieces
  sit, never where text is read. Reading happens on white plastic panels.
- **Depth is a molded edge.** A raised piece has a solid, darker bottom
  edge. Never a blur, never a gradient, never shine.
- **If you can press it, it moves.** Tappable things sink by their edge
  height when pressed; things you can't tap have no edge. A child should be
  able to tell which is which without reading a word.

## The one moment that gets to be dramatic
Everything in NexPlay is bright and busy — except the secret. When a player
looks at their own role or word, they hold down a capsule from a prize
machine: the lid pops off, the card rises out, and the rest of the screen
empties to bare baseplate so nothing else competes (or leaks). Let go and
it snaps shut. That one pop *is* the drama, and it only works because
lobbies, setup screens and waiting states never borrow it.

## How it moves (and, in phase 3, sounds)
Toy physics, not app physics. Presses sink and spring back. Tokens fall,
bounce twice and settle. Pieces snap into place. Panels slide up from below
like a drawer. Everything is short and springy; nothing floats or fades in
slowly. Sounds are plastic: clicks, clacks, a little wind-up, a short toy
fanfare for a win. Whoever has turned on "reduce motion" gets the same
information without the movement.

## Who's holding the phone
A 7-year-old, a 9-year-old, a parent, and whichever guests are over that
week. Design for the 7-year-old's hands and eyes first — if it works for
them, it works for everyone:
- Big, unambiguous tap targets. Nothing a thumb has to aim carefully at.
- Words a second-grader can read at a glance beat words in all caps with
  wide letter-spacing that an adult finds "punchy" — a young reader
  recognizes words by shape, and stretched, shouting type erases that
  shape.
- Each game is a color *and* a pictogram, so it can be recognized before it
  can be read. Never color alone.
- A picture next to a word whenever the game allows it (this is why
  Who Am I's word bank carries an emoji per word — Impostor's content pack
  is the one place this promise isn't kept yet; see `docs/BACKLOG.md`).
- Never punish curiosity with confusion. An error state explains what to
  do next, not just that something went wrong, and an empty setup screen is
  a starting point, not an error.

## Voice
Warm, direct, a little playful — never corporate, never a stack of
exclamation marks pretending to be excited on the copy's behalf. A button
says what happens ("Crear sala"), not what the system calls its own
internal action ("Iniciar sesión de sala"). One language per string.

**Spanish uses vos, everywhere** (founder decision, 2026-10-07): «Mantené
apretado», «Pasale el teléfono», «Elegí tu personaje» — never a mix with
tú («Mantén», «Pásale»). Spanish copy is also sentence case («Tu rol
secreto», not «Tu Rol Secreto»); the English habit of capitalising every
word reads as foreign in Spanish.

## What NexPlay is not
- Not glassmorphism, ever (Article 10, restated because it's tempting).
- Not glossy. No gradients on plastic, no highlights, no shine — that turns
  a toy into an app icon.
- Not a gradient-hero SaaS landing page.
- Not a generic analytics-dashboard aesthetic — no floating cards with a
  faint drop shadow and a rounded corner because that's what every
  AI-generated app defaults to.
- Not the warm-cream-and-serif look either. That was `BDR-0001`'s Paper &
  Felt, retired precisely because it is the palette AI-generated apps most
  often land on.
- Not emoji-as-decoration standing in for real illustration where a game
  actually needs one (a spinning ⏳ is not a loading state, it's a
  placeholder for one).

## The hexagon
NexPlay is the first product of the Nex family, and the hexagon is its
mark (`NEXPLAY_PLAN.md` §1, §5). It is a chunky yellow plastic hex token
with a molded edge. The outer hexagon never changes shape; the pictogram
embossed *inside* it changes per game, in that game's own color:
- **Impostor** (red) — a mask.
- **¿Quién soy?** (yellow) — a head with a question mark.
- **Conecta 4** (green) — four tokens in a line.
- **¿Quién es Quién?** (purple) — a face with glasses.
- **Batalla Naval** (white, blue pictogram) — a grid with a crosshair.

The same token is the app icon, the favicon, and the PWA install icon.

## How to use this doc
Before building a new screen: picture the toy piece it should be (a
drawer, a keycap, a capsule, a game frame), check it against the three
rules above, and only then open `ADR-0004` for the tokens and primitives
that implement it. If a design choice doesn't map to anything in this
document, that's a signal to add to this document, not to invent silently
and hope it matches.

## Related Documents
- `BDR-0002` — Visual Identity Direction (the formal decision this doc
  explains in plain language)
- `BDR-0001` — the superseded Paper & Felt direction (history only)
- `ADR-0004` — Design System Contract (tokens, primitives, motion)
- `NEXPLAY_PLAN.md` §5 — Design & distinctiveness
- `PROJECT_CONSTITUTION.md` Article 10
