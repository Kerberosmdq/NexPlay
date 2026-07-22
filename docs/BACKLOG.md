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
- **Pictionary-style drawing/guessing game.** Fits the shared platform well
  (rooms, turns, reveal); suggested as a strong candidate for a 4th/5th game
  given it's a natural fit for the target ages. Not yet scoped as a milestone.
- **More Impostor categories/word packs.** Ongoing — new packs are additions
  via PR (ADR-0003 §Seam 4), not a milestone; add packs here as ideas come up
  before someone writes them:
  - (none captured yet beyond the initial kid-safe set for M2)

## Product/UX ideas
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
