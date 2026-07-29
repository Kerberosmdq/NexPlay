import { describe, expect, it } from "vitest";
import {
  guessWhoReducer,
  createInitialState,
  answerPendingGuess,
  otherSide,
  type GuessWhoState,
} from "@/games/guess-who/reducer";

/** Drives a fresh two-player state through both sides confirming a
 * character choice, landing in "playing" — the shape every GUESS/
 * RESOLVE_GUESS/answerPendingGuess test needs as its starting point now
 * that character selection is a real phase instead of instant. */
function startPlaying(playerIds: [string, string]): GuessWhoState {
  let state = createInitialState(playerIds);
  state = guessWhoReducer(state, { type: "CONFIRM_CHARACTER", side: "A" });
  state = guessWhoReducer(state, { type: "CONFIRM_CHARACTER", side: "B" });
  return state;
}

describe("createInitialState", () => {
  it("starts in selecting phase when two real players are given (multi-device)", () => {
    const state = createInitialState(["p1", "p2"]);
    expect(state.phase).toBe("selecting");
    expect(state.sides).toEqual({ A: "p1", B: "p2" });
    expect(state.readySides).toEqual({ A: false, B: false });
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
  it("populates sides and moves to selecting from config", () => {
    const state = createInitialState([]);
    const next = guessWhoReducer(state, { type: "START_MATCH", playerIds: ["p1", "p2"] });
    expect(next.phase).toBe("selecting");
    expect(next.sides).toEqual({ A: "p1", B: "p2" });
    expect(next.readySides).toEqual({ A: false, B: false });
  });

  it("is ignored outside the config phase", () => {
    const state = createInitialState(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "START_MATCH", playerIds: ["x", "y"] });
    expect(next).toBe(state);
  });
});

describe("guessWhoReducer — CONFIRM_CHARACTER", () => {
  it("marks a side ready and stays in selecting until both confirm", () => {
    const state = createInitialState(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "CONFIRM_CHARACTER", side: "A" });
    expect(next.phase).toBe("selecting");
    expect(next.readySides).toEqual({ A: true, B: false });
  });

  it("moves to playing once both sides have confirmed", () => {
    let state = createInitialState(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "CONFIRM_CHARACTER", side: "A" });
    state = guessWhoReducer(state, { type: "CONFIRM_CHARACTER", side: "B" });
    expect(state.phase).toBe("playing");
    expect(state.readySides).toEqual({ A: true, B: true });
  });

  it("is ignored outside the selecting phase", () => {
    const state = startPlaying(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "CONFIRM_CHARACTER", side: "A" });
    expect(next).toBe(state);
  });
});

describe("guessWhoReducer — GUESS", () => {
  it("sets a pending guess from the playing phase", () => {
    const state = startPlaying(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    expect(next.pendingGuess).toEqual({ guesserSide: "A", characterId: "c5" });
  });

  it("rejects a second guess while one is already pending", () => {
    let state = startPlaying(["p1", "p2"]);
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

  it("is ignored while still selecting", () => {
    const state = createInitialState(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c1" });
    expect(next).toBe(state);
  });
});

describe("guessWhoReducer — RESOLVE_GUESS", () => {
  it("crowns the guesser the winner on a correct guess", () => {
    let state = startPlaying(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    const next = guessWhoReducer(state, { type: "RESOLVE_GUESS", correct: true });
    expect(next.phase).toBe("resolution");
    expect(next.winnerSide).toBe("A");
    expect(next.pendingGuess).toBeNull();
  });

  it("crowns the defender the winner on a wrong guess", () => {
    let state = startPlaying(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    const next = guessWhoReducer(state, { type: "RESOLVE_GUESS", correct: false });
    expect(next.phase).toBe("resolution");
    expect(next.winnerSide).toBe("B");
  });

  it("is ignored when there is nothing pending", () => {
    const state = startPlaying(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "RESOLVE_GUESS", correct: true });
    expect(next).toBe(state);
  });
});

describe("guessWhoReducer — REVEAL_CHARACTER", () => {
  it("only applies from the resolution phase", () => {
    const state = startPlaying(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "REVEAL_CHARACTER", side: "A", characterId: "c1" });
    expect(next).toBe(state);
  });

  it("records a revealed character once resolved", () => {
    const state: GuessWhoState = { ...startPlaying(["p1", "p2"]), phase: "resolution", winnerSide: "A" };
    const next = guessWhoReducer(state, { type: "REVEAL_CHARACTER", side: "B", characterId: "c9" });
    expect(next.revealedCharacters).toEqual({ B: "c9" });
  });
});

describe("guessWhoReducer — PLAY_AGAIN", () => {
  it("is ignored outside the resolution phase", () => {
    const state = startPlaying(["p1", "p2"]);
    const next = guessWhoReducer(state, { type: "PLAY_AGAIN" });
    expect(next).toBe(state);
  });

  it("resets back to selecting, keeping the same sides", () => {
    const state: GuessWhoState = {
      ...startPlaying(["p1", "p2"]),
      phase: "resolution",
      winnerSide: "A",
      revealedCharacters: { A: "c1", B: "c2" },
    };
    const next = guessWhoReducer(state, { type: "PLAY_AGAIN" });
    expect(next.phase).toBe("selecting");
    expect(next.readySides).toEqual({ A: false, B: false });
    expect(next.winnerSide).toBeNull();
    expect(next.pendingGuess).toBeNull();
    expect(next.revealedCharacters).toEqual({});
    expect(next.sides).toEqual({ A: "p1", B: "p2" });
  });

  it("requires both sides to confirm again before a new guess can be made", () => {
    const state: GuessWhoState = { ...startPlaying(["p1", "p2"]), phase: "resolution", winnerSide: "A" };
    const rematch = guessWhoReducer(state, { type: "PLAY_AGAIN" });
    const next = guessWhoReducer(rematch, { type: "GUESS", guesserSide: "A", characterId: "c1" });
    expect(next).toBe(rematch);
  });
});

describe("answerPendingGuess", () => {
  it("returns null when there is no pending guess", () => {
    const state = startPlaying(["p1", "p2"]);
    expect(answerPendingGuess(state, { myCharacterId: "c1" }, "p2")).toBeNull();
  });

  it("returns null for the guesser's own device (not the guessed-about side)", () => {
    let state = startPlaying(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    // p1 is side A, the guesser — the pending guess is about side B (p2).
    expect(answerPendingGuess(state, { myCharacterId: "c5" }, "p1")).toBeNull();
  });

  it("returns null when the target device hasn't privately assigned a character yet", () => {
    let state = startPlaying(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    expect(answerPendingGuess(state, { myCharacterId: null }, "p2")).toBeNull();
  });

  it("resolves correct when the guess matches the target's private character", () => {
    let state = startPlaying(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    const action = answerPendingGuess(state, { myCharacterId: "c5" }, "p2");
    expect(action).toEqual({ type: "RESOLVE_GUESS", correct: true });
  });

  it("resolves incorrect when the guess doesn't match", () => {
    let state = startPlaying(["p1", "p2"]);
    state = guessWhoReducer(state, { type: "GUESS", guesserSide: "A", characterId: "c5" });
    const action = answerPendingGuess(state, { myCharacterId: "c9" }, "p2");
    expect(action).toEqual({ type: "RESOLVE_GUESS", correct: false });
  });
});
