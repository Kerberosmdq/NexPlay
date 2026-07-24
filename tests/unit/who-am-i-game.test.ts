import { describe, expect, it } from "vitest";
import { whoAmIReducer, type WhoAmIState } from "@/games/who-am-i/reducer";
import type { WhoAmIWord } from "@/games/who-am-i/content";

const W1: WhoAmIWord = { id: "a1", word: "Dog", emoji: "🐶" };
const W2: WhoAmIWord = { id: "a2", word: "Cat", emoji: "🐱" };
const W3: WhoAmIWord = { id: "a3", word: "Cow", emoji: "🐮" };

function initialState(overrides: Partial<WhoAmIState> = {}): WhoAmIState {
  return {
    phase: "config",
    timerSeconds: 300,
    playerIds: [],
    usedWordIds: [],
    wordAssignments: {},
    guessedIds: [],
    lostIds: [],
    roundEndsAt: null,
    scores: {},
    ...overrides,
  };
}

function startGame(state: WhoAmIState, playerIds: string[], now = 1_000_000): WhoAmIState {
  const words = [W1, W2, W3];
  const assignments: Record<string, WhoAmIWord> = {};
  playerIds.forEach((id, i) => (assignments[id] = words[i % words.length]));
  return whoAmIReducer(state, {
    type: "START_GAME",
    playerIds,
    assignments,
    now,
  });
}

describe("whoAmIReducer — config & setup", () => {
  it("SET_CONFIG updates the timer while in config phase", () => {
    const next = whoAmIReducer(initialState(), { type: "SET_CONFIG", timerSeconds: 600 });
    expect(next.timerSeconds).toBe(600);
  });

  it("START_GAME assigns each player their own word and computes roundEndsAt from the timer", () => {
    const state = startGame(initialState({ timerSeconds: 300 }), ["p1", "p2", "p3"], 1_000_000);
    expect(state.phase).toBe("playing");
    expect(state.wordAssignments.p1).toEqual(W1);
    expect(state.wordAssignments.p2).toEqual(W2);
    expect(state.wordAssignments.p3).toEqual(W3);
    expect(state.roundEndsAt).toBe(1_000_000 + 300_000);
  });

  it("an unlimited timer (0) leaves roundEndsAt null", () => {
    const state = startGame(initialState({ timerSeconds: 0 }), ["p1", "p2", "p3"]);
    expect(state.roundEndsAt).toBeNull();
  });

  it("records assigned word ids as used, surviving PLAY_AGAIN", () => {
    let state = startGame(initialState(), ["p1", "p2", "p3"]);
    expect(state.usedWordIds).toEqual([W1.id, W2.id, W3.id]);
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p1" });
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p2" });
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p3" });
    expect(state.phase).toBe("resolution");
    state = whoAmIReducer(state, { type: "PLAY_AGAIN" });
    expect(state.usedWordIds).toEqual([W1.id, W2.id, W3.id]);
  });
});

describe("whoAmIReducer — guessing", () => {
  it("a correct guess scores points and marks that player as guessed", () => {
    let state = startGame(initialState(), ["p1", "p2", "p3", "p4"]);
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p1" });
    expect(state.scores.p1).toBe(10);
    expect(state.guessedIds).toEqual(["p1"]);
  });

  it("guessing twice doesn't double-score", () => {
    let state = startGame(initialState(), ["p1", "p2", "p3"]);
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p1" });
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p1" });
    expect(state.scores.p1).toBe(10);
  });

  it("everyone guessing ends the round immediately, without waiting for the timer", () => {
    let state = startGame(initialState(), ["p1", "p2"]);
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p1" });
    expect(state.phase).toBe("playing");
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p2" });
    expect(state.phase).toBe("resolution");
  });

  it("is ignored outside the playing phase", () => {
    const state = initialState({ phase: "config" });
    const next = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p1" });
    expect(next).toBe(state);
  });
});

describe("whoAmIReducer — losing", () => {
  it("a wrong guess scores nothing and marks that player as lost", () => {
    let state = startGame(initialState(), ["p1", "p2", "p3", "p4"]);
    state = whoAmIReducer(state, { type: "GUESS_WRONG", playerId: "p1" });
    expect(state.scores.p1).toBeUndefined();
    expect(state.lostIds).toEqual(["p1"]);
  });

  it("a player who already lost can't retry", () => {
    let state = startGame(initialState(), ["p1", "p2", "p3", "p4"]);
    state = whoAmIReducer(state, { type: "GUESS_WRONG", playerId: "p1" });
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p1" });
    expect(state.scores.p1).toBeUndefined();
    expect(state.guessedIds).toEqual([]);
    expect(state.lostIds).toEqual(["p1"]);
  });

  it("a player who already guessed correctly can't be marked as lost", () => {
    let state = startGame(initialState(), ["p1", "p2", "p3", "p4"]);
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p1" });
    state = whoAmIReducer(state, { type: "GUESS_WRONG", playerId: "p1" });
    expect(state.scores.p1).toBe(10);
    expect(state.lostIds).toEqual([]);
  });

  it("everyone resolving (guessed or lost) ends the round immediately", () => {
    let state = startGame(initialState(), ["p1", "p2"]);
    state = whoAmIReducer(state, { type: "GUESS_WRONG", playerId: "p1" });
    expect(state.phase).toBe("playing");
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p2" });
    expect(state.phase).toBe("resolution");
  });

  it("is ignored outside the playing phase", () => {
    const state = initialState({ phase: "config" });
    const next = whoAmIReducer(state, { type: "GUESS_WRONG", playerId: "p1" });
    expect(next).toBe(state);
  });
});

describe("whoAmIReducer — ending a round", () => {
  it("END_ROUND moves to resolution without touching scores", () => {
    let state = startGame(initialState(), ["p1", "p2", "p3"]);
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p1" });
    state = whoAmIReducer(state, { type: "END_ROUND" });
    expect(state.phase).toBe("resolution");
    expect(state.scores.p1).toBe(10);
    expect(state.scores.p2).toBeUndefined();
  });

  it("PLAY_AGAIN resets round data but keeps scores and usedWordIds", () => {
    let state = startGame(initialState(), ["p1", "p2", "p3"]);
    state = whoAmIReducer(state, { type: "GUESS_CORRECT", playerId: "p1" });
    state = whoAmIReducer(state, { type: "END_ROUND" });
    state = whoAmIReducer(state, { type: "PLAY_AGAIN" });
    expect(state.phase).toBe("config");
    expect(state.wordAssignments).toEqual({});
    expect(state.guessedIds).toEqual([]);
    expect(state.roundEndsAt).toBeNull();
    expect(state.scores.p1).toBe(10); // not reset
  });
});

describe("whoAmIReducer — invalid actions are ignored, not crashes", () => {
  it("ignores START_GAME outside the config phase", () => {
    const state = initialState({ phase: "playing" });
    const next = startGame(state, ["p1", "p2", "p3"]);
    expect(next).toBe(state);
  });

  it("ignores an unknown action type", () => {
    const state = initialState();
    // @ts-expect-error deliberately invalid action for the robustness check
    const next = whoAmIReducer(state, { type: "NOT_A_REAL_ACTION" });
    expect(next).toBe(state);
  });
});
