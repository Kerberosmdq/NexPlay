export const COLUMNS = 7;
export const ROWS = 6;

export type Cell<TSide extends string> = TSide | null;

function rowColOf(index: number): { row: number; col: number } {
  return { row: Math.floor(index / COLUMNS), col: index % COLUMNS };
}

function indexOf(row: number, col: number): number {
  return row * COLUMNS + col;
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLUMNS;
}

/** Where a disc dropped into `column` would land (gravity — the lowest
 * empty row), or `null` if the column is already full (an invalid move). */
export function lowestEmptyRow<TSide extends string>(cells: Cell<TSide>[], column: number): number | null {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (cells[indexOf(row, column)] === null) return row;
  }
  return null;
}

export function isBoardFull<TSide extends string>(cells: Cell<TSide>[]): boolean {
  return cells.every((cell) => cell !== null);
}

const DIRECTIONS: Array<{ dr: number; dc: number }> = [
  { dr: 0, dc: 1 }, // horizontal
  { dr: 1, dc: 0 }, // vertical
  { dr: 1, dc: 1 }, // diagonal, top-left to bottom-right
  { dr: 1, dc: -1 }, // diagonal, top-right to bottom-left
];

/** Checks the four directions through the just-placed cell only (not a
 * full-board scan every move) for a run of at least four same-side cells.
 * Returns the winning run's cell indices, or `null` if none connects. */
export function checkWin<TSide extends string>(cells: Cell<TSide>[], lastMoveIndex: number): number[] | null {
  const side = cells[lastMoveIndex];
  if (side === null) return null;
  const { row: lastRow, col: lastCol } = rowColOf(lastMoveIndex);

  for (const { dr, dc } of DIRECTIONS) {
    const run = [lastMoveIndex];

    for (let step = 1; ; step++) {
      const row = lastRow + dr * step;
      const col = lastCol + dc * step;
      if (!inBounds(row, col) || cells[indexOf(row, col)] !== side) break;
      run.push(indexOf(row, col));
    }

    for (let step = 1; ; step++) {
      const row = lastRow - dr * step;
      const col = lastCol - dc * step;
      if (!inBounds(row, col) || cells[indexOf(row, col)] !== side) break;
      run.push(indexOf(row, col));
    }

    if (run.length >= 4) return run;
  }

  return null;
}
