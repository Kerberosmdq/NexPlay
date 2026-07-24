import { describe, expect, it } from "vitest";
import { impostorReducer, resolveImpostorCount, type ImpostorState } from "@/games/impostor/reducer";
import type { ImpostorWord } from "@/games/impostor/content";

const WORD: ImpostorWord = { id: "a1", word: "Dog", category: "Animal", easyHint: "Barks" };

function initialState(overrides: Partial<ImpostorState> = {}): ImpostorState {
  return {
    phase: "config",
    impostorCount: 1,
    discussionTimeSeconds: 60,
    votingTimeSeconds: 15,
    hintDifficulty: "easy",
    secretWord: null,
    impostorIds: [],
    playerIds: [],
    votes: {},
    scores: {},
    lastRoundResult: null,
    ...overrides,
  };
}

describe("resolveImpostorCount", () => {
  it("always leaves at least 2 innocents for small groups", () => {
    expect(resolveImpostorCount(1, 3)).toBe(1);
    expect(resolveImpostorCount(3, 4)).toBe(1);
  });

  it("respects the configured count once the group is large enough", () => {
    expect(resolveImpostorCount(2, 8)).toBe(2);
  });
});

describe("impostorReducer — normal play through all phases", () => {
  it("SET_CONFIG updates config fields while in the config phase", () => {
    const state = initialState();
    const next = impostorReducer(state, {
      type: "SET_CONFIG",
      impostorCount: 2,
      discussionTimeSeconds: 120,
      votingTimeSeconds: 30,
      hintDifficulty: "hard",
    });
    expect(next.impostorCount).toBe(2);
    expect(next.hintDifficulty).toBe("hard");
  });

  it("START_GAME picks impostors from shuffledPlayerIds and moves to role_reveal", () => {
    const state = initialState({ impostorCount: 1 });
    const next = impostorReducer(state, {
      type: "START_GAME",
      playerIds: ["p1", "p2", "p3", "p4"],
      shuffledPlayerIds: ["p3", "p1", "p2", "p4"],
      word: WORD,
    });
    expect(next.phase).toBe("role_reveal");
    expect(next.secretWord).toEqual(WORD);
    expect(next.impostorIds).toEqual(["p3"]);
    expect(next.playerIds).toEqual(["p1", "p2", "p3", "p4"]);
  });

  it("walks discussion -> voting -> catches the impostor -> guess_word -> resolution", () => {
    let state = initialState({ impostorCount: 1 });
    state = impostorReducer(state, {
      type: "START_GAME",
      playerIds: ["p1", "p2", "p3"],
      shuffledPlayerIds: ["p1", "p2", "p3"],
      word: WORD,
    });
    expect(state.impostorIds).toEqual(["p1"]);

    state = impostorReducer(state, { type: "PROCEED_TO_DISCUSSION" });
    expect(state.phase).toBe("discussion");

    state = impostorReducer(state, { type: "SKIP_TO_VOTING" });
    expect(state.phase).toBe("voting");

    state = impostorReducer(state, { type: "CAST_VOTE", voterId: "p2", votedId: "p1" });
    state = impostorReducer(state, { type: "CAST_VOTE", voterId: "p3", votedId: "p1" });
    state = impostorReducer(state, { type: "END_VOTING" });
    expect(state.phase).toBe("guess_word");

    state = impostorReducer(state, { type: "IMPOSTOR_GUESS", correct: false });
    expect(state.phase).toBe("resolution");
    expect(state.lastRoundResult?.impostorsCaught).toBe(true);
    expect(state.lastRoundResult?.impostorGuessedWord).toBe(false);
    expect(state.scores.p2).toBe(10);
    expect(state.scores.p3).toBe(10);

    state = impostorReducer(state, { type: "PLAY_AGAIN" });
    expect(state.phase).toBe("config");
    expect(state.secretWord).toBeNull();
  });

  it("impostor survives a tie vote and scores 30 points", () => {
    let state = initialState({ impostorCount: 1 });
    state = impostorReducer(state, {
      type: "START_GAME",
      playerIds: ["p1", "p2", "p3"],
      shuffledPlayerIds: ["p1", "p2", "p3"],
      word: WORD,
    });
    state = impostorReducer(state, { type: "PROCEED_TO_DISCUSSION" });
    state = impostorReducer(state, { type: "SKIP_TO_VOTING" });
    state = impostorReducer(state, { type: "CAST_VOTE", voterId: "p1", votedId: "p2" });
    state = impostorReducer(state, { type: "CAST_VOTE", voterId: "p2", votedId: "p3" });
    state = impostorReducer(state, { type: "END_VOTING" });

    expect(state.phase).toBe("resolution");
    expect(state.lastRoundResult?.impostorsCaught).toBe(false);
    expect(state.scores.p1).toBe(30);
  });

  it("impostor guesses the word correctly and steals the win", () => {
    let state = initialState({ impostorCount: 1 });
    state = impostorReducer(state, {
      type: "START_GAME",
      playerIds: ["p1", "p2", "p3"],
      shuffledPlayerIds: ["p1", "p2", "p3"],
      word: WORD,
    });
    state = impostorReducer(state, { type: "PROCEED_TO_DISCUSSION" });
    state = impostorReducer(state, { type: "SKIP_TO_VOTING" });
    state = impostorReducer(state, { type: "CAST_VOTE", voterId: "p2", votedId: "p1" });
    state = impostorReducer(state, { type: "CAST_VOTE", voterId: "p3", votedId: "p1" });
    state = impostorReducer(state, { type: "END_VOTING" });
    state = impostorReducer(state, { type: "IMPOSTOR_GUESS", correct: true });

    expect(state.lastRoundResult?.impostorGuessedWord).toBe(true);
    // A comeback, but smaller than surviving undetected (30) — see
    // resolveImpostorCount's sibling comment in the reducer for why.
    expect(state.scores.p1).toBe(10);
    // The innocents who voted correctly still get credit for the read,
    // even though the impostor pulled off the comeback.
    expect(state.scores.p2).toBe(5);
    expect(state.scores.p3).toBe(5);
  });

  it("does not give the correct-vote bonus to an innocent who voted for the wrong person", () => {
    let state = initialState({ impostorCount: 1 });
    state = impostorReducer(state, {
      type: "START_GAME",
      playerIds: ["p1", "p2", "p3", "p4"],
      shuffledPlayerIds: ["p1", "p2", "p3", "p4"],
      word: WORD,
    });
    state = impostorReducer(state, { type: "PROCEED_TO_DISCUSSION" });
    state = impostorReducer(state, { type: "SKIP_TO_VOTING" });
    // p2 and p4 correctly vote for the impostor (p1); p3 votes for p4 (wrong).
    state = impostorReducer(state, { type: "CAST_VOTE", voterId: "p2", votedId: "p1" });
    state = impostorReducer(state, { type: "CAST_VOTE", voterId: "p3", votedId: "p4" });
    state = impostorReducer(state, { type: "CAST_VOTE", voterId: "p4", votedId: "p1" });
    state = impostorReducer(state, { type: "END_VOTING" });
    expect(state.phase).toBe("guess_word");

    state = impostorReducer(state, { type: "IMPOSTOR_GUESS", correct: true });
    expect(state.scores.p2).toBe(5);
    expect(state.scores.p4).toBe(5);
    expect(state.scores.p3).toBeUndefined();
  });
});

describe("impostorReducer — invalid actions are ignored, not crashes", () => {
  it("ignores CAST_VOTE outside the voting phase", () => {
    const state = initialState({ phase: "discussion", playerIds: ["p1", "p2"] });
    const next = impostorReducer(state, { type: "CAST_VOTE", voterId: "p1", votedId: "p2" });
    expect(next).toBe(state);
  });

  it("ignores a vote from/for an unknown player id", () => {
    const state = initialState({ phase: "voting", playerIds: ["p1", "p2"] });
    const next = impostorReducer(state, { type: "CAST_VOTE", voterId: "p1", votedId: "ghost" });
    expect(next.votes).toEqual({});
  });

  it("ignores START_GAME when not in the config phase", () => {
    const state = initialState({ phase: "voting" });
    const next = impostorReducer(state, {
      type: "START_GAME",
      playerIds: ["p1"],
      shuffledPlayerIds: ["p1"],
      word: WORD,
    });
    expect(next).toBe(state);
  });

  it("ignores an unknown action type", () => {
    const state = initialState();
    // @ts-expect-error deliberately invalid action for the robustness check
    const next = impostorReducer(state, { type: "NOT_A_REAL_ACTION" });
    expect(next).toBe(state);
  });
});
