# Backlog

> The idea drawer. Anything worth remembering that is not currently scheduled
> lives here — so nothing gets lost, and nothing gets built before its time.
>
> **Rule:** an idea graduates from here to `ROADMAP.md`/`CURRENT_STATE.md`
> only through an explicit decision (a milestone update or a new task spec).
> Nothing moves from backlog to code silently.
>
> When you add an idea, add just enough context that a future agent (or the
> founder, months later) understands *why* it mattered without re-reading
> this whole conversation history.

---

## Game ideas
- **Future games after M4 (Battleship), in the founder's proposed order
  (2026-07-25).** Everything below must support *both* device modes so the
  founder's kids can play with friends who are each in their own house, not
  physically together — this isn't a new requirement to design for, it's
  already guaranteed by the shared `GameModule` contract (`ADR-0002`): every
  game implements single-device *and* multi-device from the same reducer.
  1. **Connect 4 (4 en línea).** Strictly 2 players, a fully open board (no
     hidden information at all) — the simplest of this batch technically,
     good as a quick win right after Battleship.
  2. **Juego de la Oca.** No player maximum — everyone shares one spiral
     board and takes turns rolling a die. A deliberate identity touch (a
     game the family actually knows from Argentina, not a generic import).
  3. **Ludo / Parchís.** 4 players max, matching the classic cross-shaped
     board's four starting arms. Shared board + dice + a "capture the
     opponent's piece" mechanic.
  4. **Memory (memoria / buscar parejas).** The first game in this batch
     with a *shared, simultaneously-visible* board rather than the
     per-device private state Impostor/Who Am I use (your own secret
     word/role) — turn-based flip-and-match on one board everyone sees at
     once. Worth building once the simpler shared-board games above prove
     that sync pattern.
  5. **¿Quién es Quién? (Guess Who).** Deliberately named differently from
     the existing "¿Quién Soy?" despite the similar name in casual
     conversation — this is a genuinely different game, not a variant:
     each player has one secret character from a shared gallery, and wins
     by asking yes/no questions about physical traits (glasses? hat? hair
     color?) to eliminate candidates and guess the *opponent's* character
     — the inverse of "¿Quién Soy?", where you guess your *own* hidden
     word instead. Technically fits the existing per-device-private-state
     pattern (same shape as Impostor's secret role); the real cost is
     content authoring — a character roster tagged with checkable
     attributes, not just a word list, the heaviest content lift of this
     batch. Like every other verbal game here, assumes remote players are
     on a call while playing; the app doesn't handle voice.
  6. **Pictionary-style drawing/guessing game.** Placed **last on purpose**
     (founder's explicit call): unlike the five games above, this needs a
     genuinely new platform capability — real-time synced drawing strokes
     over Supabase Realtime, not just discrete phase/state sync like every
     game built so far. Benefits from the platform having several more
     games under its belt (and the shared-board sync pattern proven by
     Oca/Ludo/Memory) before taking this on.
- **More Impostor categories/word packs.** Ongoing — new packs are additions
  via PR (ADR-0003 §Seam 4), not a milestone; add packs here as ideas come up
  before someone writes them:
  - (none captured yet beyond the initial kid-safe set for M2)

## Product/UX ideas
- **Player avatars.** A small set of selectable avatars (icons/illustrations)
  each player picks when joining a room, shown next to their name everywhere
  (lobby, reveal, voting, resolution). Purely visual/identity — no gameplay
  impact. Raised during TASK-0025 playtesting as a "nice for the family"
  idea, explicitly deferred to be scoped later, not built opportunistically.
- **Image-based words/prompts more broadly.** M2 already includes images for
  Impostor specifically so the 7-year-old and 9-year-old play evenly. Consider
  whether this should become a platform-level content requirement (every
  content pack, every game) rather than an Impostor-specific choice — revisit
  once Who Am I (M3) content is designed.
- **Player count edge cases.** Impostor with very few players (e.g. 3) makes
  the impostor too easy to spot. Needs a design decision (e.g. minimum
  recommended players, or a rule variant) before or during M2 — don't let it
  surface as a surprise during first real playtest.

## Technical/process ideas
- **Analytics event taxonomy.** The exact list of `events` rows (names, enum
  values) is deferred from ADR-0003 to be finalized during M1 — low risk, just
  needs to happen before M1 is called done.
- **Pre-public-launch privacy/legal review** (COPPA/GDPR-K style
  considerations for minors) — flagged in ADR-0003, scheduled for review
  approaching M5, not before.

## Explicitly deferred (from ADR-0003, do not build early)
- User accounts (upgrade from anonymous auth) — only if cross-device history
  for one person becomes a real, requested need.
- Any monetization implementation — model intentionally left undecided; seam
  exists (ADR-0003 §Seam 3), decision comes later, informed by real usage data.
- User-generated content packs — founder chose curated-by-us for v1; revisit
  only if there's a real reason to reopen it.
- Analytics dashboards/reporting UI — the `events` writes exist; reporting is
  written on demand, not built speculatively.
