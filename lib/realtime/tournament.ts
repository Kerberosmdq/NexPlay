/** M4d: a single-elimination bracket of 1-vs-1 matches, built as a platform
 * capability (not inside any game's own folder) since it applies to any
 * two-side game. Pure, no I/O, no `Math.random()` — the shuffle itself
 * happens in the view (same rule as `games/battleship/placement.ts`'s
 * `randomFleetPlacement`), and the already-shuffled roster is what these
 * functions receive. */
export interface TournamentMatch {
  round: number; // 1-indexed
  slotInRound: number; // 0-indexed position within the round
  playerA: string;
  // `null` means this "match" is a bye — no game is ever played for it,
  // `winner` is filled in immediately at construction.
  playerB: string | null;
  winner: string | null; // null until the match resolves (by play or bye)
}

function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

/** Builds round 1 from an already-shuffled roster. Pads to the next power
 * of 2 with byes — the first `byeCount` entrants each get an automatic
 * bye (fine since the list is already random; there's no seed ranking to
 * protect by spreading byes out more cleverly). Requires at least 3
 * players (2 is just a normal match, not a bracket). */
export function buildFirstRound(shuffledPlayerIds: string[]): TournamentMatch[] {
  const n = shuffledPlayerIds.length;
  const bracketSize = nextPowerOfTwo(n);
  const byeCount = bracketSize - n;

  const matches: TournamentMatch[] = [];
  let idx = 0;
  let slot = 0;
  for (let i = 0; i < byeCount; i++) {
    const playerA = shuffledPlayerIds[idx];
    matches.push({ round: 1, slotInRound: slot, playerA, playerB: null, winner: playerA });
    idx += 1;
    slot += 1;
  }
  while (idx < n) {
    matches.push({ round: 1, slotInRound: slot, playerA: shuffledPlayerIds[idx], playerB: shuffledPlayerIds[idx + 1], winner: null });
    idx += 2;
    slot += 1;
  }
  return matches;
}

/** Builds the next round from a *fully resolved* previous round (every
 * match's `winner` set — the caller is responsible for only calling this
 * once that's true; same "trust the caller within this module family"
 * precondition `games/battleship/reducer.ts` already uses for its own
 * pure helpers). Returns `null` when the previous round had exactly one
 * match — that match's winner is the tournament champion, not a new round. */
export function buildNextRound(previousRound: TournamentMatch[]): TournamentMatch[] | null {
  if (previousRound.length === 1) return null;

  const winners = previousRound.map((m) => m.winner);
  const round = previousRound[0].round + 1;
  const matches: TournamentMatch[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    matches.push({ round, slotInRound: i / 2, playerA: winners[i]!, playerB: winners[i + 1]!, winner: null });
  }
  return matches;
}

/** The first match in a round that still needs to be played (i.e. not a
 * pre-resolved bye) — or `null` if every match in the round is already
 * resolved (all byes, only possible for a round of size 1 built from an
 * all-bye previous round, which can't happen past round 1 in practice). */
export function nextPlayableMatch(round: TournamentMatch[]): TournamentMatch | null {
  return round.find((m) => m.winner === null) ?? null;
}

/** Whether every match in a round has a decided winner — the signal to
 * either build the next round or, if this was the final, crown a champion. */
export function isRoundComplete(round: TournamentMatch[]): boolean {
  return round.every((m) => m.winner !== null);
}

export interface TournamentAdvanceResult {
  rounds: TournamentMatch[][];
  // Set only once the tournament has just ended on this advance.
  champion: string | null;
  // The match to start next — `null` exactly when `champion` is set.
  nextMatch: TournamentMatch | null;
}

/** All the bookkeeping for "a match just resolved with this winner" — kept
 * pure and free of any `GameModule`/registry dependency (unlike
 * `platformReducer.ts`'s `PLATFORM_ADVANCE_TOURNAMENT`, which also has to
 * call the actual game's `setup()`) specifically so this stays unit
 * testable: `platformReducer.ts` transitively imports every registered
 * game's view components (for `GameModule.views`), which pull in
 * `next-intl`/`next/navigation` — unresolvable in this project's Node-only
 * Vitest environment (no jsdom/Next.js runtime, same reason
 * `usePrivateState`/`useAnswerPending` are verified live rather than via
 * `renderHook`). Assumes the caller already confirmed a match in the
 * current round is actually pending (`rounds[rounds.length - 1]` has an
 * unresolved match) — same "trust the caller" precondition as
 * `buildNextRound`. */
export function advanceTournament(rounds: TournamentMatch[][], winnerId: string): TournamentAdvanceResult {
  const newRounds = rounds.map((r) => [...r]);
  const currentRound = newRounds[newRounds.length - 1];
  const matchIndex = currentRound.findIndex((m) => m.winner === null);
  currentRound[matchIndex] = { ...currentRound[matchIndex], winner: winnerId };

  if (!isRoundComplete(currentRound)) {
    return { rounds: newRounds, champion: null, nextMatch: nextPlayableMatch(currentRound) };
  }

  const nextRound = buildNextRound(currentRound);
  if (!nextRound) {
    return { rounds: newRounds, champion: winnerId, nextMatch: null };
  }

  newRounds.push(nextRound);
  return { rounds: newRounds, champion: null, nextMatch: nextPlayableMatch(nextRound) };
}
