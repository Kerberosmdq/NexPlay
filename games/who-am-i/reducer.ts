import type { WhoAmIWord } from "./content";

export type WhoAmIPhase = "config" | "playing" | "resolution";

export interface WhoAmIState {
  phase: WhoAmIPhase;

  // Config
  timerSeconds: number; // 0 = unlimited, family self-regulates by question count

  // Game data — fixed for the whole match
  playerIds: string[];
  usedWordIds: string[]; // never repeats within one match, across PLAY_AGAIN rounds too

  // Round data — set at START_GAME, cleared at PLAY_AGAIN
  wordAssignments: Record<string, WhoAmIWord>; // playerId -> that player's own (hidden-from-them) word
  turnOrder: string[]; // who asks next, in order — guessed players are skipped, not removed
  turnIndex: number;
  guessedIds: string[]; // in the order they guessed
  roundEndsAt: number | null; // epoch ms; null when timerSeconds === 0 (unlimited)

  // Scores — persist across PLAY_AGAIN within the match
  scores: Record<string, number>;
}

export type WhoAmIAction =
  | { type: "SET_CONFIG"; timerSeconds: number }
  // `assignments` (one distinct word per player) and `turnOrder` (shuffled)
  // are chosen by the caller — using Math.random() and the locale content
  // pack — so the reducer itself stays pure and unit-testable per
  // CONVENTIONS.md.
  | {
      type: "START_GAME";
      playerIds: string[];
      assignments: Record<string, WhoAmIWord>;
      turnOrder: string[];
      now: number; // injected instead of Date.now() for the same reason
    }
  | { type: "NEXT_TURN" }
  | { type: "GUESS_CORRECT"; playerId: string }
  | { type: "END_ROUND" } // timer expired, or the host ended it early
  | { type: "PLAY_AGAIN" };

const POINTS_PER_CORRECT_GUESS = 10;

/** Finds the next player in turnOrder, starting just after `fromIndex` and
 * wrapping around, who hasn't guessed yet. Returns `fromIndex` unchanged if
 * everyone (or everyone left) has already guessed. Pure, no I/O. */
function advanceToNextUnguessed(turnOrder: string[], guessedIds: string[], fromIndex: number): number {
  for (let step = 1; step <= turnOrder.length; step++) {
    const candidate = (fromIndex + step) % turnOrder.length;
    if (!guessedIds.includes(turnOrder[candidate])) return candidate;
  }
  return fromIndex;
}

export function whoAmIReducer(state: WhoAmIState, action: WhoAmIAction): WhoAmIState {
  switch (action.type) {
    case "SET_CONFIG":
      if (state.phase !== "config") return state;
      return { ...state, timerSeconds: action.timerSeconds };

    case "START_GAME": {
      if (state.phase !== "config") return state;

      return {
        ...state,
        phase: "playing",
        playerIds: action.playerIds,
        wordAssignments: action.assignments,
        turnOrder: action.turnOrder,
        turnIndex: 0,
        guessedIds: [],
        roundEndsAt: state.timerSeconds > 0 ? action.now + state.timerSeconds * 1000 : null,
        usedWordIds: [...state.usedWordIds, ...Object.values(action.assignments).map((w) => w.id)],
      };
    }

    case "NEXT_TURN": {
      if (state.phase !== "playing") return state;
      if (state.guessedIds.length >= state.turnOrder.length) return state; // nobody left to ask
      return { ...state, turnIndex: advanceToNextUnguessed(state.turnOrder, state.guessedIds, state.turnIndex) };
    }

    case "GUESS_CORRECT": {
      if (state.phase !== "playing") return state;
      if (state.guessedIds.includes(action.playerId)) return state; // already scored

      const guessedIds = [...state.guessedIds, action.playerId];
      const scores = { ...state.scores, [action.playerId]: (state.scores[action.playerId] || 0) + POINTS_PER_CORRECT_GUESS };

      // Everyone's guessed — no reason to keep waiting for the clock.
      if (guessedIds.length >= state.playerIds.length) {
        return { ...state, phase: "resolution", guessedIds, scores };
      }

      const turnIndex =
        state.turnOrder[state.turnIndex] === action.playerId || guessedIds.includes(state.turnOrder[state.turnIndex])
          ? advanceToNextUnguessed(state.turnOrder, guessedIds, state.turnIndex)
          : state.turnIndex;

      return { ...state, guessedIds, scores, turnIndex };
    }

    case "END_ROUND":
      if (state.phase !== "playing") return state;
      return { ...state, phase: "resolution" };

    case "PLAY_AGAIN":
      if (state.phase !== "resolution") return state;
      return {
        ...state,
        phase: "config",
        wordAssignments: {},
        turnOrder: [],
        turnIndex: 0,
        guessedIds: [],
        roundEndsAt: null,
      };

    default:
      return state;
  }
}
