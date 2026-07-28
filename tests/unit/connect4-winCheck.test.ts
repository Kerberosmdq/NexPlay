import { describe, expect, it } from "vitest";
import { checkWin, isBoardFull, lowestEmptyRow, COLUMNS, ROWS, type Cell } from "@/games/connect4/winCheck";

type Side = "A" | "B";

function emptyBoard(): Cell<Side>[] {
  return new Array(COLUMNS * ROWS).fill(null);
}

function index(row: number, col: number): number {
  return row * COLUMNS + col;
}

describe("checkWin", () => {
  it("detects a horizontal win", () => {
    const cells = emptyBoard();
    cells[index(5, 0)] = "A";
    cells[index(5, 1)] = "A";
    cells[index(5, 2)] = "A";
    cells[index(5, 3)] = "A";

    const line = checkWin(cells, index(5, 3));
    expect(line).not.toBeNull();
    expect(new Set(line)).toEqual(new Set([index(5, 0), index(5, 1), index(5, 2), index(5, 3)]));
  });

  it("detects a vertical win", () => {
    const cells = emptyBoard();
    cells[index(2, 0)] = "B";
    cells[index(3, 0)] = "B";
    cells[index(4, 0)] = "B";
    cells[index(5, 0)] = "B";

    const line = checkWin(cells, index(2, 0));
    expect(new Set(line)).toEqual(new Set([index(2, 0), index(3, 0), index(4, 0), index(5, 0)]));
  });

  it("detects a top-left-to-bottom-right diagonal win", () => {
    const cells = emptyBoard();
    cells[index(2, 0)] = "A";
    cells[index(3, 1)] = "A";
    cells[index(4, 2)] = "A";
    cells[index(5, 3)] = "A";

    // Triggering from an interior cell of the run must still find both ends.
    const line = checkWin(cells, index(3, 1));
    expect(new Set(line)).toEqual(
      new Set([index(2, 0), index(3, 1), index(4, 2), index(5, 3)])
    );
  });

  it("detects a top-right-to-bottom-left diagonal win", () => {
    const cells = emptyBoard();
    cells[index(2, 3)] = "B";
    cells[index(3, 2)] = "B";
    cells[index(4, 1)] = "B";
    cells[index(5, 0)] = "B";

    const line = checkWin(cells, index(4, 1));
    expect(new Set(line)).toEqual(
      new Set([index(2, 3), index(3, 2), index(4, 1), index(5, 0)])
    );
  });

  it("does not false-positive on three in a row broken by the opponent", () => {
    const cells = emptyBoard();
    cells[index(5, 0)] = "A";
    cells[index(5, 1)] = "A";
    cells[index(5, 2)] = "A";
    cells[index(5, 3)] = "B"; // breaks the run

    expect(checkWin(cells, index(5, 2))).toBeNull();
  });

  it("does not false-positive on three in a row with an empty gap", () => {
    const cells = emptyBoard();
    cells[index(5, 0)] = "A";
    cells[index(5, 1)] = "A";
    cells[index(5, 2)] = "A";
    // index(5,3) stays empty — only 3 connected, no 4th cell placed yet.

    expect(checkWin(cells, index(5, 2))).toBeNull();
  });

  it("returns null for an empty cell", () => {
    const cells = emptyBoard();
    expect(checkWin(cells, index(0, 0))).toBeNull();
  });
});

describe("isBoardFull", () => {
  it("is false on an empty board", () => {
    expect(isBoardFull(emptyBoard())).toBe(false);
  });

  it("is false when even one cell is empty", () => {
    const cells: Cell<Side>[] = new Array(COLUMNS * ROWS).fill("A");
    cells[index(0, 0)] = null;
    expect(isBoardFull(cells)).toBe(false);
  });

  it("is true when every cell is filled", () => {
    const cells: Cell<Side>[] = new Array(COLUMNS * ROWS).fill("A");
    expect(isBoardFull(cells)).toBe(true);
  });
});

describe("lowestEmptyRow", () => {
  it("returns the bottom row for an empty column", () => {
    expect(lowestEmptyRow(emptyBoard(), 0)).toBe(ROWS - 1);
  });

  it("returns the next row up once the bottom is filled", () => {
    const cells = emptyBoard();
    cells[index(ROWS - 1, 0)] = "A";
    expect(lowestEmptyRow(cells, 0)).toBe(ROWS - 2);
  });

  it("returns null for a full column", () => {
    const cells = emptyBoard();
    for (let row = 0; row < ROWS; row++) cells[index(row, 3)] = "A";
    expect(lowestEmptyRow(cells, 3)).toBeNull();
  });
});
