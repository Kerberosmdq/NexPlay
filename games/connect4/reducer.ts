import { checkWin, isBoardFull, lowestEmptyRow, COLUMNS, ROWS, type Cell } from "./winCheck";

export type Connect4Side = "A" | "B";
// "config" only exists when `setup()` didn't already receive two real
// player ids — single-device mode always starts here (the platform calls
// `setup([])`, same as Impostor/Who Am I, since no room roster exists yet
// and names are collected locally); multi-device's two already-connected
// players skip straight to "playing", the same way Battleship's
// "teamSetup" is skipped entirely for a 2-player match.
export type Connect4Phase = "config" | "playing" | "resolution";

export interface Connect4State {
  phase: Connect4Phase;
  // Flat, row-major, index 0 = top-left (row 0, col 0) — a 2D array would
  // just add an indexing layer `winCheck.ts` already handles once, here.
  cells: Cell<Connect4Side>[];
  // Exactly one player per side — team play is an explicit non-goal for
  // this game (docs/09_ai/tasks/TASK-0037-connect4.md). Empty strings while
  // `phase === "config"`.
  sides: Record<Connect4Side, string>;
  turn: Connect4Side;
  winnerSide: Connect4Side | null;
  winningLine: number[] | null;
  isDraw: boolean;
  // Alternates who moves first each rematch, so a long session of "jugar
  // de nuevo" doesn't always favor whoever went first the very first time.
  firstMoverSide: Connect4Side;
}

export type Connect4Action =
  | { type: "START_MATCH"; playerIds: [string, string] }
  | { type: "DROP_DISC"; column: number; side: Connect4Side }
  | { type: "PLAY_AGAIN" };

function emptyBoard(): Cell<Connect4Side>[] {
  return new Array(COLUMNS * ROWS).fill(null);
}

export function createInitialState(playerIds: string[]): Connect4State {
  const [playerA, playerB] = playerIds;
  const readyToPlay = playerIds.length === 2;
  return {
    phase: readyToPlay ? "playing" : "config",
    cells: emptyBoard(),
    sides: { A: playerA ?? "", B: playerB ?? "" },
    turn: "A",
    winnerSide: null,
    winningLine: null,
    isDraw: false,
    firstMoverSide: "A",
  };
}

function otherSide(side: Connect4Side): Connect4Side {
  return side === "A" ? "B" : "A";
}

export function connect4Reducer(state: Connect4State, action: Connect4Action): Connect4State {
  switch (action.type) {
    case "START_MATCH": {
      if (state.phase !== "config") return state;
      const [playerA, playerB] = action.playerIds;
      return { ...state, phase: "playing", sides: { A: playerA, B: playerB } };
    }

    case "DROP_DISC": {
      if (state.phase !== "playing") return state;
      if (action.side !== state.turn) return state;

      const row = lowestEmptyRow(state.cells, action.column);
      if (row === null) return state; // full column — invalid move, ignored

      const index = row * COLUMNS + action.column;
      const cells = [...state.cells];
      cells[index] = action.side;

      const winningLine = checkWin(cells, index);
      if (winningLine) {
        return { ...state, phase: "resolution", cells, winnerSide: action.side, winningLine };
      }

      if (isBoardFull(cells)) {
        return { ...state, phase: "resolution", cells, isDraw: true };
      }

      return { ...state, cells, turn: otherSide(action.side) };
    }

    case "PLAY_AGAIN": {
      if (state.phase !== "resolution") return state;
      const firstMoverSide = otherSide(state.firstMoverSide);
      return {
        ...state,
        phase: "playing",
        cells: emptyBoard(),
        turn: firstMoverSide,
        winnerSide: null,
        winningLine: null,
        isDraw: false,
        firstMoverSide,
      };
    }

    default:
      return state;
  }
}
