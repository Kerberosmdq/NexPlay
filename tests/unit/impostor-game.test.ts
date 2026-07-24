import { describe, expect, it } from "vitest";
import {
  impostorReducer,
  resolveImpostorCount,
  maxImpostorsFor,
  type ImpostorState,
} from "@/games/impostor/reducer";
import type { ImpostorWord } from "@/games/impostor/content";

const WORD: ImpostorWord = { id: "a1", word: "Dog", category: "Animal", easyHint: "Barks" };

function initialState(overrides: Partial<ImpostorState> = {}): ImpostorState {
  return {
    phase: "config",
    impostorCount: 1,
    votingTimeSeconds: 15,
    hintDifficulty: "easy",
    secretWord: null,
    impostorIds: [],
    playerIds: [],
    aliveIds: [],
    turnOrder: [],
    turnIndex: 0,
    votes: {},
    lastElimination: null,
    scores: {},
    lastRoundResult: null,
    ...overrides,
  };
}

function startGame(
  state: ImpostorState,
  playerIds: string[],
  shuffledPlayerIds: string[] = playerIds
): ImpostorState {
  return impostorReducer(state, { type: "START_GAME", playerIds, shuffledPlayerIds, word: WORD });
}

function voteRound(state: ImpostorState, votes: Array<[string, string]>): ImpostorState {
  let next = impostorReducer(state, { type: "PROCEED_TO_DISCUSSION" });
  next = impostorReducer(next, { type: "SKIP_TO_VOTING" });
  for (const [voterId, votedId] of votes) {
    next = impostorReducer(next, { type: "CAST_VOTE", voterId, votedId });
  }
  return impostorReducer(next, { type: "END_VOTING" });
}

describe("resolveImpostorCount / maxImpostorsFor", () => {
  it("requires 2N+1 players for N impostors", () => {
    expect(maxImpostorsFor(3)).toBe(1);
    expect(maxImpostorsFor(4)).toBe(1);
    expect(maxImpostorsFor(5)).toBe(2);
    expect(maxImpostorsFor(7)).toBe(3);
  });

  it("clamps a host's request to what the group size supports", () => {
    expect(resolveImpostorCount(3, 4)).toBe(1);
    expect(resolveImpostorCount(2, 5)).toBe(2);
    expect(resolveImpostorCount(1, 3)).toBe(1);
  });
});

describe("impostorReducer — single round (3 players, 1 impostor)", () => {
  it("SET_CONFIG updates config fields while in the config phase", () => {
    const state = initialState();
    const next = impostorReducer(state, {
      type: "SET_CONFIG",
      impostorCount: 2,
      votingTimeSeconds: 30,
      hintDifficulty: "hard",
    });
    expect(next.impostorCount).toBe(2);
    expect(next.hintDifficulty).toBe("hard");
  });

  it("PROCEED_TO_DISCUSSION seeds a fresh speaking order from aliveIds", () => {
    let state = startGame(initialState({ impostorCount: 1 }), ["p1", "p2", "p3"]);
    state = impostorReducer(state, { type: "PROCEED_TO_DISCUSSION" });
    expect(state.turnOrder).toEqual(["p1", "p2", "p3"]);
    expect(state.turnIndex).toBe(0);
  });

  it("NEXT_TURN advances through the speaking order and stops at the end", () => {
    let state = startGame(initialState({ impostorCount: 1 }), ["p1", "p2", "p3"]);
    state = impostorReducer(state, { type: "PROCEED_TO_DISCUSSION" });
    state = impostorReducer(state, { type: "NEXT_TURN" });
    expect(state.turnIndex).toBe(1);
    state = impostorReducer(state, { type: "NEXT_TURN" });
    state = impostorReducer(state, { type: "NEXT_TURN" });
    expect(state.turnIndex).toBe(3); // everyone has spoken
    const afterEnd = impostorReducer(state, { type: "NEXT_TURN" });
    expect(afterEnd).toBe(state); // ignored once nobody's left to speak
  });

  it("NEXT_TURN is ignored outside the discussion phase", () => {
    const state = initialState({ phase: "voting", turnOrder: ["p1"], turnIndex: 0 });
    const next = impostorReducer(state, { type: "NEXT_TURN" });
    expect(next).toBe(state);
  });

  it("START_GAME picks impostors from shuffledPlayerIds and seeds aliveIds", () => {
    const state = initialState({ impostorCount: 1 });
    const next = startGame(state, ["p1", "p2", "p3", "p4"], ["p3", "p1", "p2", "p4"]);
    expect(next.phase).toBe("role_reveal");
    expect(next.impostorIds).toEqual(["p3"]);
    expect(next.aliveIds).toEqual(["p1", "p2", "p3", "p4"]);
  });

  it("catching the (only) impostor immediately goes to guess_word", () => {
    let state = startGame(initialState({ impostorCount: 1 }), ["p1", "p2", "p3"]);
    state = voteRound(state, [
      ["p2", "p1"],
      ["p3", "p1"],
    ]);
    expect(state.phase).toBe("guess_word");
    expect(state.aliveIds).toEqual(["p2", "p3"]);
  });

  it("wrong guess after the last impostor is caught scores innocent victory", () => {
    let state = startGame(initialState({ impostorCount: 1 }), ["p1", "p2", "p3"]);
    state = voteRound(state, [
      ["p2", "p1"],
      ["p3", "p1"],
    ]);
    state = impostorReducer(state, { type: "IMPOSTOR_GUESS", correct: false });
    expect(state.phase).toBe("resolution");
    expect(state.lastRoundResult?.impostorsCaught).toBe(true);
    expect(state.scores.p2).toBe(10);
    expect(state.scores.p3).toBe(10);
  });

  it("correct guess scores a smaller comeback for the impostor + a bonus for correct voters", () => {
    let state = startGame(initialState({ impostorCount: 1 }), ["p1", "p2", "p3"]);
    state = voteRound(state, [
      ["p2", "p1"],
      ["p3", "p1"],
    ]);
    state = impostorReducer(state, { type: "IMPOSTOR_GUESS", correct: true });
    expect(state.scores.p1).toBe(10);
    expect(state.scores.p2).toBe(5);
    expect(state.scores.p3).toBe(5);
  });

  it("PLAY_AGAIN resets phase, roles and alive list", () => {
    let state = startGame(initialState({ impostorCount: 1 }), ["p1", "p2", "p3"]);
    state = voteRound(state, [
      ["p2", "p1"],
      ["p3", "p1"],
    ]);
    state = impostorReducer(state, { type: "IMPOSTOR_GUESS", correct: false });
    state = impostorReducer(state, { type: "PLAY_AGAIN" });
    expect(state.phase).toBe("config");
    expect(state.secretWord).toBeNull();
    expect(state.aliveIds).toEqual([]);
  });
});

describe("impostorReducer — multi-round elimination (the actual bug report)", () => {
  it("a tie eliminates nobody and the same players continue to another round", () => {
    let state = startGame(initialState({ impostorCount: 1 }), ["p1", "p2", "p3"]);
    // p1 is the impostor. Everyone votes for someone different — a 3-way tie.
    state = voteRound(state, [
      ["p1", "p2"],
      ["p2", "p3"],
      ["p3", "p1"],
    ]);
    expect(state.phase).toBe("elimination_result");
    expect(state.lastElimination).toEqual({ eliminatedId: null, wasImpostor: false });
    expect(state.aliveIds).toEqual(["p1", "p2", "p3"]); // nobody removed

    // Host continues — back to discussion for another round, not resolution.
    state = impostorReducer(state, { type: "PROCEED_TO_DISCUSSION" });
    expect(state.phase).toBe("discussion");
  });

  it("voting out an innocent (4 players) continues the match instead of ending it", () => {
    let state = startGame(initialState({ impostorCount: 1 }), ["p1", "p2", "p3", "p4"], [
      "p1",
      "p2",
      "p3",
      "p4",
    ]);
    expect(state.impostorIds).toEqual(["p1"]);

    // Everyone votes out p2, an innocent — NOT a tie, NOT the impostor.
    state = voteRound(state, [
      ["p1", "p2"],
      ["p3", "p2"],
      ["p4", "p2"],
    ]);

    expect(state.phase).toBe("elimination_result");
    expect(state.lastElimination).toEqual({ eliminatedId: "p2", wasImpostor: false });
    expect(state.aliveIds).toEqual(["p1", "p3", "p4"]); // down to 3, game continues
  });

  it("plays a full second round after a wrong elimination, then catches the impostor", () => {
    let state = startGame(initialState({ impostorCount: 1 }), ["p1", "p2", "p3", "p4"]);
    expect(state.impostorIds).toEqual(["p1"]);

    // Round 1: vote out p2 (innocent) — game continues.
    state = voteRound(state, [
      ["p1", "p2"],
      ["p3", "p2"],
      ["p4", "p2"],
    ]);
    expect(state.phase).toBe("elimination_result");
    state = impostorReducer(state, { type: "PROCEED_TO_DISCUSSION" });
    expect(state.phase).toBe("discussion");

    // Round 2: p3 and p4 correctly gang up on p1, the impostor.
    state = voteRound(state, [
      ["p3", "p1"],
      ["p4", "p1"],
    ]);
    expect(state.phase).toBe("guess_word"); // last impostor caught
    expect(state.aliveIds).toEqual(["p3", "p4"]);
  });

  it("impostors win outright once they can no longer be out-voted (majority lock)", () => {
    // 1v1 aftermath: 2 innocents + 1 impostor. Eliminate an innocent and the
    // impostor is now tied 1-1 with the last innocent — game should end
    // immediately as an impostor win, without waiting for another vote.
    let state = startGame(initialState({ impostorCount: 1 }), ["p1", "p2", "p3"]);
    expect(state.impostorIds).toEqual(["p1"]);

    state = voteRound(state, [
      ["p1", "p2"], // impostor votes to eliminate an innocent
      ["p3", "p2"], // the other innocent votes wrong too — p2 is eliminated
    ]);

    expect(state.phase).toBe("resolution");
    expect(state.lastRoundResult?.impostorsCaught).toBe(false);
    expect(state.aliveIds).toEqual(["p1", "p3"]);
    expect(state.scores.p1).toBe(30);
  });

  it("supports 2 impostors requiring all impostors caught before resolving", () => {
    // 5 players, 2 impostors (p1, p2). Catch p1 first — game must continue
    // because p2 is still alive and uncaught.
    let state = startGame(
      initialState({ impostorCount: 2 }),
      ["p1", "p2", "p3", "p4", "p5"],
      ["p1", "p2", "p3", "p4", "p5"]
    );
    expect(state.impostorIds).toEqual(["p1", "p2"]);

    state = voteRound(state, [
      ["p3", "p1"],
      ["p4", "p1"],
      ["p5", "p1"],
    ]);
    expect(state.phase).toBe("elimination_result");
    expect(state.lastElimination).toEqual({ eliminatedId: "p1", wasImpostor: true });
    expect(state.aliveIds).toEqual(["p2", "p3", "p4", "p5"]); // still 1 impostor alive — not guess_word yet

    state = impostorReducer(state, { type: "PROCEED_TO_DISCUSSION" });
    state = voteRound(state, [
      ["p3", "p2"],
      ["p4", "p2"],
      ["p5", "p2"],
    ]);
    expect(state.phase).toBe("guess_word"); // now the last impostor is caught
  });
});

describe("impostorReducer — invalid actions are ignored, not crashes", () => {
  it("ignores CAST_VOTE outside the voting phase", () => {
    const state = initialState({ phase: "discussion", playerIds: ["p1", "p2"], aliveIds: ["p1", "p2"] });
    const next = impostorReducer(state, { type: "CAST_VOTE", voterId: "p1", votedId: "p2" });
    expect(next).toBe(state);
  });

  it("ignores a vote from/for an eliminated (no longer alive) player", () => {
    const state = initialState({
      phase: "voting",
      playerIds: ["p1", "p2", "p3"],
      aliveIds: ["p1", "p3"], // p2 was eliminated in an earlier round
    });
    const next = impostorReducer(state, { type: "CAST_VOTE", voterId: "p1", votedId: "p2" });
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
