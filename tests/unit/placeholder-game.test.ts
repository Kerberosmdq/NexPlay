import { describe, expect, it } from "vitest";
import { placeholderGameModule } from "@/games/placeholder/module";
import { initialPlaceholderState } from "@/games/placeholder/reducer";

describe("Placeholder Game Module & Reducer", () => {
  it("initializes placeholder game module setup correctly", () => {
    const state = placeholderGameModule.setup([], { initialCount: 5 });
    expect(state.count).toBe(5);
    expect(state.phase).toBe("lobby");
  });

  it("transitions from lobby to in-round when START_GAME action is dispatched", () => {
    const nextState = placeholderGameModule.reducer(initialPlaceholderState, { type: "START_GAME" });
    expect(nextState.phase).toBe("in-round");
  });

  it("increments and decrements counter during in-round phase", () => {
    let state = placeholderGameModule.reducer(initialPlaceholderState, { type: "START_GAME" });
    expect(state.count).toBe(0);

    state = placeholderGameModule.reducer(state, { type: "INCREMENT", playerId: "p1" });
    expect(state.count).toBe(1);
    expect(state.lastActionBy).toBe("p1");

    state = placeholderGameModule.reducer(state, { type: "INCREMENT", playerId: "p2" });
    expect(state.count).toBe(2);

    state = placeholderGameModule.reducer(state, { type: "DECREMENT", playerId: "p1" });
    expect(state.count).toBe(1);
  });

  it("ignores increment/decrement actions when not in in-round phase", () => {
    const stateInLobby = placeholderGameModule.reducer(initialPlaceholderState, { type: "INCREMENT" });
    expect(stateInLobby.count).toBe(0);
  });

  it("transitions from in-round to results when FINISH_GAME is dispatched", () => {
    let state = placeholderGameModule.reducer(initialPlaceholderState, { type: "START_GAME" });
    state = placeholderGameModule.reducer(state, { type: "FINISH_GAME" });
    expect(state.phase).toBe("results");
  });

  it("resets game state when RESET_GAME is dispatched", () => {
    let state = placeholderGameModule.reducer(initialPlaceholderState, { type: "START_GAME" });
    state = placeholderGameModule.reducer(state, { type: "INCREMENT" });
    state = placeholderGameModule.reducer(state, { type: "RESET_GAME" });
    expect(state).toEqual(initialPlaceholderState);
  });
});
