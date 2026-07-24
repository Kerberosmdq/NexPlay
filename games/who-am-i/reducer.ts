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
  guessedIds: string[]; // correctly guessed, in order — scored, done for the round
  lostIds: string[]; // guessed wrong, in order — no points, done for the round, can't retry
  roundEndsAt: number | null; // epoch ms; null when timerSeconds === 0 (unlimited)

  // Scores — persist across PLAY_AGAIN within the match
  scores: Record<string, number>;
}

export type WhoAmIAction =
  | { type: "SET_CONFIG"; timerSeconds: number }
  // `assignments` (one distinct word per player) is chosen by the caller —
  // using Math.random() and the locale content pack — so the reducer
  // itself stays pure and unit-testable per CONVENTIONS.md. Who asks
  // questions in what order is a verbal, family-regulated convention (like
  // "go around the circle") — the app doesn't track or enforce it.
  | {
      type: "START_GAME";
      playerIds: string[];
      assignments: Record<string, WhoAmIWord>;
      now: number; // injected instead of Date.now() for the same reason
    }
  // Both fired once, after the player has already said their guess out
  // loud — the app just records what the group's reaction was, it doesn't
  // judge the guess itself.
  | { type: "GUESS_CORRECT"; playerId: string }
  | { type: "GUESS_WRONG"; playerId: string }
  | { type: "END_ROUND" } // timer expired, or the host ended it early
  | { type: "PLAY_AGAIN" };

const POINTS_PER_CORRECT_GUESS = 10;

function isDone(state: WhoAmIState, playerId: string): boolean {
  return state.guessedIds.includes(playerId) || state.lostIds.includes(playerId);
}

/** Every player has either succeeded or failed — no reason to keep the
 * round open waiting for a clock nobody needs anymore. */
function allResolved(state: WhoAmIState): boolean {
  return state.guessedIds.length + state.lostIds.length >= state.playerIds.length;
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
        guessedIds: [],
        lostIds: [],
        roundEndsAt: state.timerSeconds > 0 ? action.now + state.timerSeconds * 1000 : null,
        usedWordIds: [...state.usedWordIds, ...Object.values(action.assignments).map((w) => w.id)],
      };
    }

    case "GUESS_CORRECT": {
      if (state.phase !== "playing") return state;
      if (isDone(state, action.playerId)) return state; // already resolved (guessed or lost)

      const guessedIds = [...state.guessedIds, action.playerId];
      const scores = { ...state.scores, [action.playerId]: (state.scores[action.playerId] || 0) + POINTS_PER_CORRECT_GUESS };
      const next = { ...state, guessedIds, scores };

      return allResolved(next) ? { ...next, phase: "resolution" as const } : next;
    }

    case "GUESS_WRONG": {
      if (state.phase !== "playing") return state;
      if (isDone(state, action.playerId)) return state; // already resolved (guessed or lost)

      const lostIds = [...state.lostIds, action.playerId];
      const next = { ...state, lostIds };

      return allResolved(next) ? { ...next, phase: "resolution" as const } : next;
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
        guessedIds: [],
        lostIds: [],
        roundEndsAt: null,
      };

    default:
      return state;
  }
}
