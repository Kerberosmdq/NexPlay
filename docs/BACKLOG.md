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

### Next games, in priority order (confirmed with the founder, 2026-07-28)
The founder has a family trip in about a week and wants more games to play
together, not a public-facing polish pass — this ordering is optimized for
that, not for M6 (presentable). Each of these is a real milestone once
picked up (design conversation with the founder before any code, same as
every prior game), not yet scoped as a task spec.

1. ~~**Conecta 4 (Connect 4).**~~ **Graduated to `docs/ROADMAP.md`'s M5**
   (2026-07-28) — no longer just a backlog idea. Board/token design
   already confirmed with the founder (hexagonal tokens, weighted-drop/
   preview/dramatic-win animation); see `ROADMAP.md`'s M5 section for the
   full rationale and `HANDOFF.md` for implementation status.
2. **¿Quién es Quién? (Guess Who).** 1-vs-1 deduction: each player has a
   secret character the opponent tries to identify via yes/no questions.
   Reuses the "per-player secret" shape from Who Am I (M3) and `ADR-0005`'s
   private-state mechanism, but needs a new character-grid content pack
   with portraits — the real new work here is content, not architecture.
3. **Ludo.** The first genuinely new platform shape: 2–4 players racing
   tokens around a shared board with dice turns and captures — not a
   "two sides" game like every game shipped so far. Expect this to need a
   platform-level design conversation (does `GameModule`'s contract need a
   >2-participant turn-order primitive, or does each game keep inventing
   its own?) before implementation, flagged the same way M4's team-play
   gap led to `ADR-0005`.
4. **Juego de la oca, or a similar dice-and-track race game (open to a
   different theme, doesn't have to literally be La Oca).** A classic
   Spanish/European board game: players roll dice and race tokens around a
   spiral of numbered squares, with special squares (a bridge that
   teleports you forward, a well/prison that traps you, a goose square
   that grants another roll or doubles your move, a skull that sends you
   back to start). Pure luck, no strategy — good for younger kids. Ordered
   last specifically because it should be near-free once Ludo (#3) has
   already solved "multi-player dice-driven turns on a shared track" at the
   platform level; this one mostly reuses that shape with a different
   board layout and special-square table.

- **Pictionary-style drawing/guessing game.** Previously the top game
  candidate; deprioritized below the four above per the founder (2026-07-28)
  — still worth building eventually, just not next.
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
  approaching M6 ("Presentable"), not before.

## Explicitly deferred (from ADR-0003, do not build early)
- User accounts (upgrade from anonymous auth) — only if cross-device history
  for one person becomes a real, requested need.
- Any monetization implementation — model intentionally left undecided; seam
  exists (ADR-0003 §Seam 3), decision comes later, informed by real usage data.
- User-generated content packs — founder chose curated-by-us for v1; revisit
  only if there's a real reason to reopen it.
- Analytics dashboards/reporting UI — the `events` writes exist; reporting is
  written on demand, not built speculatively.
