export type PlaceholderPhase = "lobby" | "in-round" | "results";

export interface PlaceholderState {
  count: number;
  phase: PlaceholderPhase;
  lastActionBy?: string;
}

export type PlaceholderAction =
  | { type: "START_GAME" }
  | { type: "INCREMENT"; playerId?: string }
  | { type: "DECREMENT"; playerId?: string }
  | { type: "FINISH_GAME" }
  | { type: "RESET_GAME" };

export const initialPlaceholderState: PlaceholderState = {
  count: 0,
  phase: "lobby",
};

/**
 * Pure state machine reducer for the placeholder game.
 */
export function placeholderReducer(
  state: PlaceholderState = initialPlaceholderState,
  action: PlaceholderAction
): PlaceholderState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...state,
        phase: "in-round",
      };

    case "INCREMENT":
      if (state.phase !== "in-round") return state;
      return {
        ...state,
        count: state.count + 1,
        lastActionBy: action.playerId,
      };

    case "DECREMENT":
      if (state.phase !== "in-round") return state;
      return {
        ...state,
        count: state.count - 1,
        lastActionBy: action.playerId,
      };

    case "FINISH_GAME":
      if (state.phase !== "in-round") return state;
      return {
        ...state,
        phase: "results",
      };

    case "RESET_GAME":
      return initialPlaceholderState;

    default:
      return state;
  }
}
