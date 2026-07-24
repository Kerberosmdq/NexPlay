import type { HintDifficulty, ImpostorWord } from "./content";

export type ImpostorPhase =
  | "config"
  | "role_reveal"
  | "discussion"
  | "voting"
  | "elimination_result" // who got voted out (or nobody, on a tie) — game continues from here unless it's game over
  | "guess_word" // only reached when the last remaining impostor was just caught
  | "resolution";

export interface ImpostorState {
  phase: ImpostorPhase;

  // Config
  impostorCount: number;
  discussionTimeSeconds: number; // 0 = unlimited
  votingTimeSeconds: number;
  hintDifficulty: HintDifficulty;

  // Game Data
  secretWord: ImpostorWord | null;
  impostorIds: string[]; // fixed for the whole match, set at START_GAME
  playerIds: string[]; // fixed for the whole match, set at START_GAME
  aliveIds: string[]; // shrinks by one (or stays the same, on a tie) each round

  // Voting — reset at the start of every voting round
  votes: Record<string, string>; // voterId -> votedId

  // What just happened in the elimination_result phase
  lastElimination: { eliminatedId: string | null; wasImpostor: boolean } | null;

  // Scores
  scores: Record<string, number>; // playerId -> cumulative points

  // Result — only set once the match reaches "resolution"
  lastRoundResult: {
    impostorsCaught: boolean;
    impostorGuessedWord: boolean;
    pointsAwarded: Record<string, number>;
  } | null;
}

export type ImpostorAction =
  | {
      type: "SET_CONFIG";
      impostorCount: number;
      discussionTimeSeconds: number;
      votingTimeSeconds: number;
      hintDifficulty: HintDifficulty;
    }
  // `word` and `shuffledPlayerIds` are chosen by the caller (the host's view,
  // using the locale-appropriate content pack and Math.random) so the
  // reducer itself stays pure and unit-testable per CONVENTIONS.md.
  | { type: "START_GAME"; playerIds: string[]; shuffledPlayerIds: string[]; word: ImpostorWord }
  | { type: "PROCEED_TO_DISCUSSION" }
  | { type: "SKIP_TO_VOTING" }
  | { type: "CAST_VOTE"; voterId: string; votedId: string }
  | { type: "END_VOTING" } // Tallies the round's votes: eliminates someone, ties, or ends the match
  | { type: "IMPOSTOR_GUESS"; correct: boolean }
  | { type: "PLAY_AGAIN" };

/** Max impostors a group of `playerCount` can safely support while keeping
 * innocents in the majority from the very first round (classic "social
 * deduction" balance: N impostors need at least 2N+1 players). Pure, no I/O. */
export function maxImpostorsFor(playerCount: number): number {
  return Math.max(1, Math.floor((playerCount - 1) / 2));
}

/** Clamps a host's requested impostor count to what the group size actually
 * supports. Pure, no I/O. */
export function resolveImpostorCount(impostorCount: number, playerCount: number): number {
  return Math.max(1, Math.min(impostorCount, maxImpostorsFor(playerCount)));
}

function teamVictoryPoints(
  impostorIds: string[],
  playerIds: string[],
  outcome: "impostors_survived" | "innocents_won"
): Record<string, number> {
  const pointsAwarded: Record<string, number> = {};
  if (outcome === "impostors_survived") {
    for (const id of impostorIds) pointsAwarded[id] = 30;
  } else {
    for (const id of playerIds) {
      if (!impostorIds.includes(id)) pointsAwarded[id] = 10;
    }
  }
  return pointsAwarded;
}

function applyPoints(scores: ImpostorState["scores"], pointsAwarded: Record<string, number>) {
  const newScores = { ...scores };
  for (const [id, pts] of Object.entries(pointsAwarded)) {
    newScores[id] = (newScores[id] || 0) + pts;
  }
  return newScores;
}

export function impostorReducer(state: ImpostorState, action: ImpostorAction): ImpostorState {
  switch (action.type) {
    case "SET_CONFIG":
      if (state.phase !== "config") return state;
      return {
        ...state,
        impostorCount: action.impostorCount,
        discussionTimeSeconds: action.discussionTimeSeconds,
        votingTimeSeconds: action.votingTimeSeconds,
        hintDifficulty: action.hintDifficulty,
      };

    case "START_GAME": {
      if (state.phase !== "config") return state;

      const safeImpostorCount = resolveImpostorCount(state.impostorCount, action.playerIds.length);
      const impostorIds = action.shuffledPlayerIds.slice(0, safeImpostorCount);

      return {
        ...state,
        phase: "role_reveal",
        secretWord: action.word,
        impostorIds,
        playerIds: action.playerIds,
        aliveIds: action.playerIds,
        votes: {},
        lastElimination: null,
        lastRoundResult: null,
      };
    }

    case "PROCEED_TO_DISCUSSION":
      if (state.phase !== "role_reveal" && state.phase !== "elimination_result") return state;
      return { ...state, phase: "discussion" };

    case "SKIP_TO_VOTING":
      if (state.phase !== "discussion") return state;
      // Fresh ballot for this round — a prior round's votes must not leak in.
      return { ...state, phase: "voting", votes: {} };

    case "CAST_VOTE": {
      if (state.phase !== "voting") return state;
      if (!state.aliveIds.includes(action.voterId) || !state.aliveIds.includes(action.votedId)) {
        return state;
      }
      return {
        ...state,
        votes: {
          ...state.votes,
          [action.voterId]: action.votedId,
        },
      };
    }

    case "END_VOTING": {
      if (state.phase !== "voting") return state;

      const voteCounts: Record<string, number> = {};
      for (const votedId of Object.values(state.votes)) {
        voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
      }

      let maxVotes = 0;
      let mostVotedIds: string[] = [];
      for (const [id, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
          maxVotes = count;
          mostVotedIds = [id];
        } else if (count === maxVotes) {
          mostVotedIds.push(id);
        }
      }

      // A tie means nobody is eliminated this round — same players, another
      // round of discussion and voting.
      if (mostVotedIds.length !== 1) {
        return {
          ...state,
          phase: "elimination_result",
          lastElimination: { eliminatedId: null, wasImpostor: false },
        };
      }

      const eliminatedId = mostVotedIds[0];
      const wasImpostor = state.impostorIds.includes(eliminatedId);
      const newAliveIds = state.aliveIds.filter((id) => id !== eliminatedId);
      const aliveImpostorCount = newAliveIds.filter((id) => state.impostorIds.includes(id)).length;
      const aliveInnocentCount = newAliveIds.length - aliveImpostorCount;

      // Every impostor has now been caught — the last one gets a chance to
      // guess the word and steal a smaller comeback win (existing mechanic).
      if (wasImpostor && aliveImpostorCount === 0) {
        return {
          ...state,
          phase: "guess_word",
          aliveIds: newAliveIds,
          lastElimination: { eliminatedId, wasImpostor: true },
        };
      }

      // Impostors can no longer be out-voted by the remaining innocents —
      // the match ends immediately, same payout as surviving undetected.
      if (!wasImpostor && aliveImpostorCount >= aliveInnocentCount) {
        const pointsAwarded = teamVictoryPoints(state.impostorIds, state.playerIds, "impostors_survived");
        return {
          ...state,
          phase: "resolution",
          aliveIds: newAliveIds,
          lastElimination: { eliminatedId, wasImpostor: false },
          scores: applyPoints(state.scores, pointsAwarded),
          lastRoundResult: { impostorsCaught: false, impostorGuessedWord: false, pointsAwarded },
        };
      }

      // Otherwise: the match isn't over yet (an impostor remains hidden, or
      // innocents still outnumber them) — show who was eliminated, then
      // continue to another round.
      return {
        ...state,
        phase: "elimination_result",
        aliveIds: newAliveIds,
        lastElimination: { eliminatedId, wasImpostor },
      };
    }

    case "IMPOSTOR_GUESS": {
      if (state.phase !== "guess_word") return state;

      let pointsAwarded: Record<string, number>;

      if (action.correct) {
        // Caught AND guessed the word: a real comeback, but a smaller one
        // than surviving undetected (30) — being caught still cost them.
        pointsAwarded = {};
        for (const impId of state.impostorIds) {
          pointsAwarded[impId] = 10;
        }
        // The innocents who correctly fingered the impostor this round did
        // their job — the comeback shouldn't erase that entirely.
        for (const [voterId, votedId] of Object.entries(state.votes)) {
          if (state.impostorIds.includes(votedId) && !state.impostorIds.includes(voterId)) {
            pointsAwarded[voterId] = 5;
          }
        }
      } else {
        pointsAwarded = teamVictoryPoints(state.impostorIds, state.playerIds, "innocents_won");
      }

      return {
        ...state,
        phase: "resolution",
        scores: applyPoints(state.scores, pointsAwarded),
        lastRoundResult: {
          impostorsCaught: true,
          impostorGuessedWord: action.correct,
          pointsAwarded,
        },
      };
    }

    case "PLAY_AGAIN":
      if (state.phase !== "resolution") return state;
      return {
        ...state,
        phase: "config",
        secretWord: null,
        impostorIds: [],
        aliveIds: [],
        votes: {},
        lastElimination: null,
        lastRoundResult: null,
      };

    default:
      return state;
  }
}
