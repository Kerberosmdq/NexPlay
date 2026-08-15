# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: Hotfix (unnumbered) — founder feedback while playtesting Guess
  Who, not a roadmap milestone.
- **Title**: Guess Who — portraits no longer cropped by a circular frame
  (hats were invisible); 8 characters renamed to match their art's gender; a
  neighbouring-character crop-bleed cleanup added to the asset script.

## Current Branch
- `fix/guess-who-portrait-framing-and-names`, branched off `main` after PR #58
  (character selection + match-resolved modal) merged.

## What's in this change

Three defects, all in Guess Who's character art layer. The founder reported
the first two; the third is a latent one the first fix exposed.

### 1. Portraits were cropped — hats were invisible
`games/guess-who/views/CharacterCard.tsx` framed every portrait as a circle
with `object-cover`. The art is head-and-shoulders at roughly 2:3, so filling
a *square* box scaled it to width and pushed ~25% of its height out of view
top and bottom; the circular clip then trimmed the corners of what remained.
The top of every hat was the casualty — the worst possible trait to lose in a
game whose mechanic is asking "¿tiene sombrero?".

Fixed with a portrait-shaped box (`w-full aspect-[2/3]`, `rounded-xl`) and
`object-contain`. Nothing is cropped at any size now. Note this made the cards
*bigger*, not smaller — matching the art's own aspect ratio and tightening the
grid card's padding took the mobile grid portrait from a 48×48 circle to
62×93, and `size="large"` from 96×96 to 112×168.

One thing that needed a second pass: the cross-out strike (`w-[150%]
rotate-45`) was being clamped back to the frame's width by its centering flex
parent, so the slash stopped short of the edges on the now-taller frame.
`shrink-0` fixes it. Measured, not eyeballed — the rotated bounding box is
67×67 against a 62×93 frame.

### 2. Eight characters had a name of the opposite gender to their art
Root cause worth remembering: the portraits were generated from the **traits**
(hair length, facial hair, glasses…), which encode nothing about gender, so
the generator drew whoever it liked and the pre-existing names no longer
matched. Reviewed all 32 against their art; found exactly eight, four in each
direction. Renamed rather than regenerating art — names are cosmetic (no rule
reads them), so traits are untouched and `guess-who-roster.test.ts`'s balance
guarantees are unaffected. The roster's 16/16 gender split survives because
the corrections were 4-and-4.

| id | was | now |
|---|---|---|
| c9 | Camila | Bruno |
| c23 | Valeria | Thiago |
| c25 | Daniela | Ramiro |
| c27 | Constanza | Facundo |
| c24 | Máximo | Julieta |
| c26 | Tomás | Paulina |
| c30 | Agustín | Amanda |
| c32 | Ignacio | Lucía |

**Deliberately left alone**: c3 (Emma), c7 (Martina) and c11 (Isabella) read
as androgynous at grid size. Compared at full resolution against a known-male
(c9) and known-female (c31) portrait, all three carry the same drawn eyelashes
and softer jaw as c31, so they stay female-named. If the founder disagrees on
seeing them in play, these are the three to revisit.

### 3. A latent crop defect that fix (1) exposed
`CURRENT_STATE.md`'s art-batch entry records a neighbouring-character sliver
judged "harmless because the circular crop trims exactly the margin the sliver
sat in." That was true — and stopped being true the moment the card started
showing the whole portrait. **Any future change to how these assets are
displayed should re-check this class of assumption.**

A connected-component scan over all 32 assets found three real ones (c26 on
both edges, c29, c31 — fragments of neighbouring hat brims, ~1.4k/580/660px)
plus five sub-100px specks. Fixed in `scripts/generate-guesswho-assets.mjs`,
not by hand-editing PNGs: a new `removeDetachedFragments` step erases any
opaque blob that is both disconnected from the largest blob *and* touching a
left/right edge — the signature of bleed from the axis the sheet is sliced
along. Requiring the edge touch is what makes it safe to run blind (a
legitimately detached feature — an earring clear of the head, a glasses lens —
is interior and never considered), and the largest blob is always kept so a
character can never erase itself.

Because the founder-provided source sheets are **not committed to the repo**,
the script also gained a standalone `--clean <files>` mode that re-runs only
that step over already-generated assets; that's how the three shipped files
were repaired. New batches get the cleanup automatically in the normal slicing
path.

### Live verification
All 32 portraits fetched through the dev server return 200 and decode; every
one renders fully contained (drawn size ≤ box size, measured via
`getBoundingClientRect` against `naturalWidth`/`naturalHeight`) at both grid
and large sizes; no horizontal overflow at 375px; the cross-out strike spans
the frame; the eight renamed characters render their new labels against the
correct art. Played through selection → playing → guess → resolution to reach
the `size="large"` card. Zero console errors. `lint`, `typecheck`, and all
206 unit tests pass.

### Known cosmetic quirk (pre-existing, not fixed here)
Several characters' near-white/cream clothing is fully transparent in the PNG
— the chroma key can't distinguish it from the parchment background it was cut
from. It reads correctly *because* the card background
(`--color-surface-raised`, `#fbf6ec`) is itself near-white, so the clothing
appears cream as intended. Verified by compositing the assets against that
exact token. It would look wrong on a dark background, so anyone introducing a
dark theme needs to regenerate these assets from the source sheets (which
means asking the founder for them — they aren't in git).

## Superseded context (previous handoff)

The prior change on `main` was: Guess Who choose-your-own-character (a
`"selecting"` reducer phase) plus `MatchResolvedModal` gating tournament
auto-advance across every game with `getWinner`. See PR #58 and
`CURRENT_STATE.md`'s entry for the detail; nothing in it was modified here.

## Files Modified / Added
- `games/guess-who/views/CharacterCard.tsx` (portrait-shaped `object-contain`
  frame replacing the circular `object-cover` one; `shrink-0` on the cross-out
  strike; grid-size padding tightened; stale "placeholder" doc comment
  corrected — the fallback is now the exception, not the default)
- `games/guess-who/content/characters.ts` (8 renames; a comment recording that
  names must agree with the art, since nothing in code enforces it)
- `scripts/generate-guesswho-assets.mjs` (`removeDetachedFragments` wired into
  the normal slicing path, plus a standalone `--clean <files>` mode)
- `public/guess-who/{c11,c12,c13,c14,c26,c27,c29,c31,c32}.png` (regenerated by
  `--clean`; alpha-only changes, dimensions unchanged)

No test files changed: the renames are cosmetic and `guess-who-roster.test.ts`
asserts trait balance and name *uniqueness*, both of which still hold. The
framing change is pure CSS in a component with no existing render tests (the
project's Vitest environment is Node-only, no jsdom), so it was verified live
in-browser instead — see above.

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`, strict
  branch protection, GitHub Actions secrets configured.
- All 32 Guess Who characters now have real portrait art — the placeholder
  path in `CharacterCard.tsx` has no live callers for the current roster,
  but is kept in place for any future roster growth.

## A testing-methodology note worth remembering (carried forward)
Console log dumps can exceed the tool's token limit on a long-running dev
session (`read_console_messages` without a filter overflowed at ~63K
characters this session) — use the `pattern` parameter (e.g.
`"Error|error"`) to search instead of dumping everything. Also reconfirmed:
restarting the dev server clean after a batch of hot-reloads is worth doing
before trusting a scary-looking console error — this session saw a stale
`useTournamentAdvance doesn't exist in target module` error that was already
fixed in the source, left over from a mid-edit HMR pass.

## Pending Tasks
- A dedicated founder playtest of Battleship's full feature set (M4a–M4d —
  weapons, 2-vs-2 teams, tournament) on real phones specifically is still
  worth doing — every verification in this repo's history so far has used
  up to four browser contexts on one machine, not a dedicated real-device
  pass.
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice — the latent leak the ADR documents is real but not urgent.
- The two remaining games from `BACKLOG.md`'s prioritized list (Ludo, a
  dice-and-track race game) — each its own future milestone, not yet
  started.

## Next Suggested Task
- The founder's call: **M7 (presentable)** per `docs/ROADMAP.md`, or the
  next game from `BACKLOG.md`'s prioritized list (Ludo is next). Follow
  the same pattern used for every game so far: a design conversation with
  the founder (exploring distinct directions per `PROJECT_CONSTITUTION.md`
  Article 10 whenever there's a real visual/UX decision to make) before
  any code.
