import { describe, expect, it } from "vitest";
import {
  guessWhoReducer,
  createInitialState,
  answerPendingGuess,
  otherSide,
  type GuessWhoState,
} from "@/games/guess-who/reducer";

describe("createInitialState", () => {
  it("starts in playing phase when two real players are given (multi-device)", () => {
    const state = createInitialState(["p1", "p2"]);
    expect(state.phase).toBe("playing");
    expect(state.sides).toEqual({ A: "p1", B: "p2" });
    expect(state.pendingGuess).toBeNull();
    expect(state.winnerSide).toBeNull();
  });

  it("starts in config phase when no players are given (single-device)", () => {
    const state = createInitialState([]);
    expect(state.phase).toBe("config");
    expect(state.sides).toEqual({ A: "", B: "" });
  });
});

describe("otherSide", () => {
  it("flips A to B and B to A", () => {
    expect(otherSide("A")).toBe("B");
    expect(otherSide("B")).toBe("A");
  });
});

describe("guessWhoReducer — START_MATCH", () => {
  it("populates sides and moves to playing from config", () => {
    const state = createInitialState([]);
    const next = guessWhoReducer(state, { type: "START_MATCH", playerIds: ["p1", "p2"] });
    expect(next.phase).toBe("playing");
    expect(next.sides).toEqual({ A: "p1", B: "p2" });
  });

  it("is ignored outside the config phase", () => {
    const state = createInitialState(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "START_MATCH", playerIds: ["x", "y"] });
    expect(next).toBe(state);
  });
});

describe("guessWhoReducer — GUESS", () => {
  it("sets a pending guess from the playing phase", () => {
    const state = createInitialState(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    expect(next.pendingGuess).toEqual({ guesserSide: "A", characterId: "c5" });
  });

  it("rejects a second guess while one is already pending", () => {
    let state = createInitialState(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    const beforeSecond = state;
    const next = guessWhoReducer(state, { type: "GUESS", guesserSide: "B", characterId: "c9" });
    expect(next).toBe(beforeSecond);
  });

  it("is ignored outside the playing phase", () => {
    const state: GuessWhoState = { ...createInitialState(["p1", "p2"]), phase: "resolution" };
    const next = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c1" });
    expect(next).toBe(state);
  });
});

describe("guessWhoReducer — RESOLVE_GUESS", () => {
  it("crowns the guesser the winner on a correct guess", () => {
    let state = createInitialState(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    const next = guessWhoReducer(state, { type: "RESOLVE_GUESS", correct: true });
    expect(next.phase).toBe("resolution");
    expect(next.winnerSide).toBe("A");
    expect(next.pendingGuess).toBeNull();
  });

  it("crowns the defender the winner on a wrong guess", () => {
    let state = createInitialState(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    const next = guessWhoReducer(state, { type: "RESOLVE_GUESS", correct: false });
    expect(next.phase).toBe("resolution");
    expect(next.winnerSide).toBe("B");
  });

  it("is ignored when there is nothing pending", () => {
    const state = createInitialState(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "RESOLVE_GUESS", correct: true });
    expect(next).toBe(state);
  });
});

describe("guessWhoReducer — REVEAL_CHARACTER", () => {
  it("only applies from the resolution phase", () => {
    const state = createInitialState(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "REVEAL_CHARACTER", side: "A", characterId: "c1" });
    expect(next).toBe(state);
  });

  it("records a revealed character once resolved", () => {
    const state: GuessWhoState = { ...createInitialState(["p1", "p2"]), phase: "resolution", winnerSide: "A" };
    const next = guessWhoReducer(state, { type: "REVEAL_CHARACTER", side: "B", characterId: "c9" });
    expect(next.revealedCharacters).toEqual({ B: "c9" });
  });
});

describe("guessWhoReducer — PLAY_AGAIN", () => {
  it("is ignored outside the resolution phase", () => {
    const state = createInitialState(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "PLAY_AGAIN" });
    expect(next).toBe(state);
  });

  it("resets pending/winner/revealed state, keeping the same sides", () => {
    const state: GuessWhoState = {
      ...createInitialState(["p1", "p2"]),
      phase: "resolution",
      winnerSide: "A",
      revealedCharacters: { A: "c1", B: "c2" },
    };
    const next = guessWhoReducer(state, { type: "PLAY_AGAIN" });
    expect(next.phase).toBe("playing");
    expect(next.winnerSide).toBeNull();
    expect(next.pendingGuess).toBeNull();
    expect(next.revealedCharacters).toEqual({});
    expect(next.sides).toEqual({ A: "p1", B: "p2" });
  });
});

describe("answerPendingGuess", () => {
  it("returns null when there is no pending guess", () => {
    const state = createInitialState(["p1", "p2"]);
    expect(answerPendingGuess(state, { myCharacterId: "c1" }, "p2")).toBeNull();
  });

  it("returns null for the guesser's own device (not the guessed-about side)", () => {
    let state = createInitialState(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    // p1 is side A, the guesser — the pending guess is about side B (p2).
    expect(answerPendingGuess(state, { myCharacterId: "c5" }, "p1")).toBeNull();
  });

  it("returns null when the target device hasn't privately assigned a character yet", () => {
    let state = createInitialState(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    expect(answerPendingGuess(state, { myCharacterId: null }, "p2")).toBeNull();
  });

  it("resolves correct when the guess matches the target's private character", () => {
    let state = createInitialState(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    const action = answerPendingGuess(state, { myCharacterId: "c5" }, "p2");
    expect(action).toEqual({ type: "RESOLVE_GUESS", correct: true });
  });

  it("resolves incorrect when the guess doesn't match", () => {
    let state = createInitialState(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    const action = answerPendingGuess(state, { myCharacterId: "c9" }, "p2");
    expect(action).toEqual({ type: "RESOLVE_GUESS", correct: false });
  });
});
