import type { HintDifficulty, ImpostorWord } from "./content";

export type ImpostorPhase =
  | "config"
  | "role_reveal"
  | "discussion"
  | "voting"
  | "guess_word" // Only happens if impostor was caught
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
  impostorIds: string[];
  playerIds: string[];

  // Voting
  votes: Record<string, string>; // voterId -> votedId

  // Scores
  scores: Record<string, number>; // playerId -> cumulative points

  // Result
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
  | { type: "END_VOTING" } // Calculated results
  | { type: "IMPOSTOR_GUESS"; correct: boolean }
  | { type: "PLAY_AGAIN" };

/** Given the full player-id list and the config's impostor count, returns
 * how many impostors this round actually has (always at least 1, and always
 * leaves at least 2 innocents so the round is playable). Pure, no I/O. */
export function resolveImpostorCount(impostorCount: number, playerCount: number): number {
  return Math.max(1, Math.min(impostorCount, Math.floor(playerCount / 2) - 1 || 1));
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
        votes: {},
        lastRoundResult: null,
      };
    }

    case "PROCEED_TO_DISCUSSION":
      if (state.phase !== "role_reveal") return state;
      return { ...state, phase: "discussion" };

    case "SKIP_TO_VOTING":
      if (state.phase !== "discussion") return state;
      return { ...state, phase: "voting" };

    case "CAST_VOTE": {
      if (state.phase !== "voting") return state;
      if (!state.playerIds.includes(action.voterId) || !state.playerIds.includes(action.votedId)) {
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

      // Calculate who got the most votes
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

      // A tie means no single suspect was pinned down — the impostor
      // survives. Only a strict single most-voted player can be caught.
      const caughtImpostors = mostVotedIds.length === 1 && state.impostorIds.includes(mostVotedIds[0]);

      if (caughtImpostors) {
        return {
          ...state,
          phase: "guess_word",
        };
      } else {
        const pointsAwarded: Record<string, number> = {};
        for (const impId of state.impostorIds) {
          pointsAwarded[impId] = 30; // Survived!
        }

        const newScores = { ...state.scores };
        for (const [id, pts] of Object.entries(pointsAwarded)) {
          newScores[id] = (newScores[id] || 0) + pts;
        }

        return {
          ...state,
          phase: "resolution",
          scores: newScores,
          lastRoundResult: {
            impostorsCaught: false,
            impostorGuessedWord: false,
            pointsAwarded,
          },
        };
      }
    }

    case "IMPOSTOR_GUESS": {
      if (state.phase !== "guess_word") return state;

      const pointsAwarded: Record<string, number> = {};

      if (action.correct) {
        for (const impId of state.impostorIds) {
          pointsAwarded[impId] = 20;
        }
      } else {
        for (const pid of state.playerIds) {
          if (!state.impostorIds.includes(pid)) {
            pointsAwarded[pid] = 10;
          }
        }
      }

      const newScores = { ...state.scores };
      for (const [id, pts] of Object.entries(pointsAwarded)) {
        newScores[id] = (newScores[id] || 0) + pts;
      }

      return {
        ...state,
        phase: "resolution",
        scores: newScores,
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
        votes: {},
        lastRoundResult: null,
      };

    default:
      return state;
  }
}
