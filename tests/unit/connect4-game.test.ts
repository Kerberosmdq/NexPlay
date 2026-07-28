import { describe, expect, it } from "vitest";
import { connect4Reducer, createInitialState, type Connect4State } from "@/games/connect4/reducer";
import { COLUMNS, ROWS } from "@/games/connect4/winCheck";

describe("createInitialState", () => {
  it("starts in playing phase when two real players are given (multi-device)", () => {
    const state = createInitialState(["p1", "p2"]);
    expect(state.phase).toBe("playing");
    expect(state.sides).toEqual({ A: "p1", B: "p2" });
    expect(state.turn).toBe("A");
    expect(state.cells).toHaveLength(COLUMNS * ROWS);
    expect(state.cells.every((c) => c === null)).toBe(true);
  });

  it("starts in config phase when no players are given (single-device)", () => {
    const state = createInitialState([]);
    expect(state.phase).toBe("config");
    expect(state.sides).toEqual({ A: "", B: "" });
  });
});

describe("connect4Reducer — START_MATCH", () => {
  it("populates sides and moves to playing from config", () => {
    const state = createInitialState([]);
    const next = connect4Reducer(state, { type: "START_MATCH", playerIds: ["p1", "p2"] });
    expect(next.phase).toBe("playing");
    expect(next.sides).toEqual({ A: "p1", B: "p2" });
  });

  it("is ignored outside the config phase", () => {
    const state = createInitialState(["p1", "p2"]);
    const next = connect4Reducer(state, { type: "START_MATCH", playerIds: ["x", "y"] });
    expect(next).toBe(state);
  });
});

describe("connect4Reducer — DROP_DISC", () => {
  it("places a disc at the bottom of an empty column and flips the turn", () => {
    const state = createInitialState(["p1", "p2"]);
    const next = connect4Reducer(state, { type: "DROP_DISC", column: 3, side: "A" });
    expect(next.cells[(ROWS - 1) * COLUMNS + 3]).toBe("A");
    expect(next.turn).toBe("B");
    expect(next.phase).toBe("playing");
  });

  it("stacks a second disc in the same column on top of the first", () => {
    let state = createInitialState(["p1", "p2"]);
    state = connect4Reducer(state, { type: "DROP_DISC", column: 3, side: "A" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 3, side: "B" });
    expect(state.cells[(ROWS - 1) * COLUMNS + 3]).toBe("A");
    expect(state.cells[(ROWS - 2) * COLUMNS + 3]).toBe("B");
  });

  it("rejects a move from the side that isn't currently up", () => {
    const state = createInitialState(["p1", "p2"]);
    const next = connect4Reducer(state, { type: "DROP_DISC", column: 0, side: "B" });
    expect(next).toBe(state);
  });

  it("rejects a move into a full column", () => {
    let state = createInitialState(["p1", "p2"]);
    for (let i = 0; i < ROWS; i++) {
      state = connect4Reducer(state, { type: "DROP_DISC", column: 0, side: state.turn });
    }
    const beforeFullDrop = state;
    const next = connect4Reducer(state, { type: "DROP_DISC", column: 0, side: state.turn });
    expect(next).toBe(beforeFullDrop);
  });

  it("rejects any move once the match is resolved", () => {
    let state = createInitialState(["p1", "p2"]);
    // A wins with a horizontal run on the bottom row; B plays a filler
    // move elsewhere between each of A's moves.
    state = connect4Reducer(state, { type: "DROP_DISC", column: 0, side: "A" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 0, side: "B" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 1, side: "A" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 1, side: "B" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 2, side: "A" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 2, side: "B" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 3, side: "A" });

    expect(state.phase).toBe("resolution");
    expect(state.winnerSide).toBe("A");
    expect(state.winningLine).toHaveLength(4);

    const resolved = state;
    const next = connect4Reducer(state, { type: "DROP_DISC", column: 4, side: "B" });
    expect(next).toBe(resolved);
  });

  it("detects a draw when the board fills with no four-in-a-row", () => {
    // A verified (checked by exhaustive search, not hand-eyeballed) 42-cell
    // arrangement with zero four-in-a-row runs in any direction. Built as
    // the state directly rather than via a full 42-move DROP_DISC sequence
    // — this test cares about the reducer's full-board-with-no-winner
    // wiring, which `checkWin`/`isBoardFull` already have their own
    // dedicated coverage for.
    // prettier-ignore
    const solved: ("A" | "B")[] = [
      "A", "A", "A", "B", "A", "A", "A",
      "A", "A", "A", "B", "A", "A", "A",
      "B", "B", "A", "A", "A", "B", "B",
      "A", "A", "B", "B", "B", "A", "A",
      "A", "A", "A", "B", "A", "A", "A",
      "A", "A", "A", "B", "A", "A", "A",
    ];
    const cells: Connect4State["cells"] = [...solved];
    cells[0] = null; // top-left, column 0 — the one cell left to drop into

    const almostFull: Connect4State = {
      phase: "playing",
      cells,
      sides: { A: "p1", B: "p2" },
      turn: "A", // the removed cell was originally "A"
      winnerSide: null,
      winningLine: null,
      isDraw: false,
      firstMoverSide: "A",
    };

    const next = connect4Reducer(almostFull, { type: "DROP_DISC", column: 0, side: "A" });
    expect(next.phase).toBe("resolution");
    expect(next.isDraw).toBe(true);
    expect(next.winnerSide).toBeNull();
    expect(next.winningLine).toBeNull();
    expect(next.cells.every((c) => c !== null)).toBe(true);
  });
});

describe("connect4Reducer — PLAY_AGAIN", () => {
  it("is ignored outside the resolution phase", () => {
    const state = createInitialState(["p1", "p2"]);
    const next = connect4Reducer(state, { type: "PLAY_AGAIN" });
    expect(next).toBe(state);
  });

  it("resets the board and alternates who moves first", () => {
    let state = createInitialState(["p1", "p2"]);
    state = connect4Reducer(state, { type: "DROP_DISC", column: 0, side: "A" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 0, side: "B" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 1, side: "A" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 1, side: "B" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 2, side: "A" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 2, side: "B" });
    state = connect4Reducer(state, { type: "DROP_DISC", column: 3, side: "A" });
    expect(state.phase).toBe("resolution");

    const rematch = connect4Reducer(state, { type: "PLAY_AGAIN" });
    expect(rematch.phase).toBe("playing");
    expect(rematch.cells.every((c) => c === null)).toBe(true);
    expect(rematch.winnerSide).toBeNull();
    expect(rematch.winningLine).toBeNull();
    expect(rematch.isDraw).toBe(false);
    // First mover alternates from A (the original match) to B.
    expect(rematch.turn).toBe("B");
    expect(rematch.firstMoverSide).toBe("B");

    // A second rematch flips back to A.
    let secondState = connect4Reducer(rematch, { type: "DROP_DISC", column: 0, side: "B" });
    secondState = connect4Reducer(secondState, { type: "DROP_DISC", column: 0, side: "A" });
    secondState = connect4Reducer(secondState, { type: "DROP_DISC", column: 1, side: "B" });
    secondState = connect4Reducer(secondState, { type: "DROP_DISC", column: 1, side: "A" });
    secondState = connect4Reducer(secondState, { type: "DROP_DISC", column: 2, side: "B" });
    secondState = connect4Reducer(secondState, { type: "DROP_DISC", column: 2, side: "A" });
    secondState = connect4Reducer(secondState, { type: "DROP_DISC", column: 3, side: "B" });
    expect(secondState.phase).toBe("resolution");

    const secondRematch = connect4Reducer(secondState, { type: "PLAY_AGAIN" });
    expect(secondRematch.turn).toBe("A");
    expect(secondRematch.firstMoverSide).toBe("A");
  });
});
