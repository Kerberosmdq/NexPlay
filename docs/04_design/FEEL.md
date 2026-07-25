# The Feel

> The living personality doc `NEXPLAY_PLAN.md` §5 promises: "captures the
> personality in words and examples so every agent designs toward the same
> vibe." Formal decisions live in `BDR-0001` and `ADR-0004`; this doc is
> their companion in plain language — read this to get the *feel* right,
> read those to get the *values* right.

## In one sentence
NexPlay should feel like someone cleared the kitchen table, unpacked a
game with real cardboard and wooden pieces, and dimmed the lights for one
second when it's time to peek at your secret card.

## The world this app lives in
Not a "party app." A **board game**, rendered in a browser because that's
the only way to hand five phones to five people at once. Every surface
choice should answer: *would this material exist on a real game box or
game board?* Cardstock, felt, stamped ink, a wooden token, a wax seal —
yes. Frosted glass, a SaaS gradient hero, a dashboard card with a subtle
shadow — no, and never, per `PROJECT_CONSTITUTION.md` Article 10.

## The one moment that gets to be dramatic
Everything in NexPlay is warm and well-lit — except the reveal. When a
player looks at their own secret role or word, the screen should feel like
they cupped a hand around a card so only they can see it: the light dims,
a small warm glow gathers around the one thing that matters, and everyone
else's screen stays exactly as bright and ordinary as it was a second ago.
That contrast — ordinary, then suddenly private — *is* the drama. It only
works because the rest of the app doesn't spend that mood on lobbies,
configuration screens, or waiting states. See `BDR-0001` for the concrete
rule ("penumbra is earned, not decorative").

## Who's holding the phone
A 7-year-old, a 9-year-old, a parent, and whichever guests are over that
week. Design for the 7-year-old's hands and eyes first — if it works for
them, it works for everyone:
- Big, unambiguous tap targets. Nothing a thumb has to aim carefully at.
- Words a second-grader can read at a glance beat words in all caps with
  wide letter-spacing that an adult finds "punchy" — a young reader
  recognizes words by shape, and stretched, shouting type erases that
  shape.
- A picture next to a word whenever the game allows it (this is why
  Who Am I's word bank carries an emoji per word — Impostor's content pack
  is the one place this promise isn't kept yet; see `docs/BACKLOG.md`).
- Never punish curiosity with confusion. An error state explains what to
  do next, not just that something went wrong.

## Voice
Warm, direct, a little playful — never corporate, never a stack of
exclamation marks pretending to be excited on the copy's behalf. A button
says what happens ("Crear sala"), not what the system calls its own
internal action ("Iniciar sesión de sala"). One language per string — the
current bilingual labels like "UNIRSE A SALA / JOIN PARTY" are a symptom
of there being no language switcher anywhere in the app, not a style
choice; fixing that switcher retires the bilingual labels for good.

## What NexPlay is not
- Not glassmorphism, ever (Article 10, restated because it's tempting).
- Not a gradient-hero SaaS landing page.
- Not a generic analytics-dashboard aesthetic — no floating cards with a
  faint drop shadow and a rounded corner because that's what every
  AI-generated app defaults to.
- Not neon everywhere — that's the mistake the current build made, and
  `BDR-0001` deliberately narrows that language to one moment instead of
  discarding it.
- Not emoji-as-decoration standing in for real illustration where a game
  actually needs one (a spinning ⏳ is not a loading state, it's a
  placeholder for one).

## The hexagon
NexPlay is the first product of the Nex family, and the hexagon is its
mark (`NEXPLAY_PLAN.md` §1, §5). The outer hexagon never changes shape; its
*interior* is reinterpreted per game, the way a wax seal carries a
different crest for a different house:
- **Impostor** — a mask/silhouette cut into the hex.
- **Who Am I** — a question mark.
- **Battleship** (M4) — a grid, or a single wave line.

This is also the app icon, the favicon, and the PWA install icon — today
none of those exist; the app still ships Next.js's default favicon and
scaffold SVGs in `public/`.

## How to use this doc
Before building a new screen: read the relevant phase description above,
picture a real object it should feel like (a game box, a scorepad, a felt
tray), and only then open `ADR-0004` for the tokens/primitives that
implement it. If a design choice doesn't map to anything in this document,
that's a signal to add to this document, not to invent silently and hope
it matches.

## Related Documents
- `BDR-0001` — Visual Identity Direction (the formal decision this doc
  explains in plain language)
- `ADR-0004` — Design System Contract (tokens, primitives, motion)
- `NEXPLAY_PLAN.md` §5 — Design & distinctiveness
- `PROJECT_CONSTITUTION.md` Article 10
