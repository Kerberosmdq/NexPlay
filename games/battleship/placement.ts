export interface ShipSpec {
  type: string;
  length: number;
}

export interface ShipPlacement {
  type: string;
  cells: string[];
}

export type Orientation = "horizontal" | "vertical";

/** 8x8: a faster fleet for a comfortable phone screen. 10x10: the classic
 * fleet. Board size is a host-facing config choice (`ROADMAP.md` M4 —
 * "que lo elija el anfitrión"), not a fixed constant. */
export const FLEET_8: ShipSpec[] = [
  { type: "carrier", length: 4 },
  { type: "destroyer", length: 3 },
  { type: "submarine", length: 3 },
  { type: "patrol", length: 2 },
];

export const FLEET_10: ShipSpec[] = [
  { type: "carrier", length: 5 },
  { type: "battleship", length: 4 },
  { type: "destroyer", length: 3 },
  { type: "submarine", length: 3 },
  { type: "patrol", length: 2 },
];

export function fleetSpecFor(boardSize: number): ShipSpec[] {
  return boardSize === 10 ? FLEET_10 : FLEET_8;
}

export function cellId(row: number, col: number): string {
  return `${row}-${col}`;
}

/** Returns the cells a ship of `length` would occupy starting at
 * (row, col) in `orientation` — or `null` if any cell falls outside the
 * board. Pure, no randomness — this is what makes it unit-testable. */
export function shipCells(
  row: number,
  col: number,
  length: number,
  orientation: Orientation,
  boardSize: number
): string[] | null {
  const cells: string[] = [];
  for (let i = 0; i < length; i++) {
    const r = orientation === "vertical" ? row + i : row;
    const c = orientation === "horizontal" ? col + i : col;
    if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) return null;
    cells.push(cellId(r, c));
  }
  return cells;
}

/** A ship placement is valid if it doesn't run off the board (`shipCells`
 * already returned non-null) and doesn't overlap any already-placed ship. */
export function canPlaceShip(existing: ShipPlacement[], cells: string[]): boolean {
  const occupied = new Set(existing.flatMap((s) => s.cells));
  return cells.every((c) => !occupied.has(c));
}

/** A full fleet is ready once every spec'd ship has been placed exactly
 * once, with no overlaps — re-validated as a whole (not just incrementally)
 * so a caller can check an arbitrary in-progress placement array. */
export function isFleetComplete(fleet: ShipPlacement[], fleetSpec: ShipSpec[]): boolean {
  if (fleet.length !== fleetSpec.length) return false;
  const placedTypes = new Set(fleet.map((s) => s.type));
  if (placedTypes.size !== fleetSpec.length) return false; // a duplicate type
  for (const spec of fleetSpec) {
    const ship = fleet.find((s) => s.type === spec.type);
    if (!ship || ship.cells.length !== spec.length) return false;
  }
  const allCells = fleet.flatMap((s) => s.cells);
  return new Set(allCells).size === allCells.length; // no overlaps
}

/** Places a full fleet at random, retrying a ship on collision/out-of-bounds
 * until it fits. Uses `Math.random()`, so — same rule as
 * `games/who-am-i/pickRound.ts` — this stays outside the reducer; the view
 * calls this and passes the *result* into private state, never randomness
 * itself into shared/reducer code. */
export function randomFleetPlacement(fleetSpec: ShipSpec[], boardSize: number): ShipPlacement[] {
  const placements: ShipPlacement[] = [];
  for (const spec of fleetSpec) {
    let cells: string[] | null = null;
    while (!cells || !canPlaceShip(placements, cells)) {
      const orientation: Orientation = Math.random() < 0.5 ? "horizontal" : "vertical";
      const row = Math.floor(Math.random() * boardSize);
      const col = Math.floor(Math.random() * boardSize);
      cells = shipCells(row, col, spec.length, orientation, boardSize);
    }
    placements.push({ type: spec.type, cells });
  }
  return placements;
}

export function shipTypeAt(fleet: ShipPlacement[], cell: string): string | null {
  return fleet.find((s) => s.cells.includes(cell))?.type ?? null;
}

export function shipAt(fleet: ShipPlacement[], cell: string): ShipPlacement | null {
  return fleet.find((s) => s.cells.includes(cell)) ?? null;
}

/** A ship's current orientation, derived from its own cells — used when
 * picking an already-placed ship back up to move it, so it resumes in the
 * orientation it was actually placed in. */
export function orientationOf(ship: ShipPlacement): Orientation {
  const rows = ship.cells.map((c) => Number(c.split("-")[0]));
  return Math.min(...rows) === Math.max(...rows) ? "horizontal" : "vertical";
}

/** The top-left cell of a ship's bounding box — its anchor for
 * `shipCells(row, col, length, orientation, boardSize)`. */
export function anchorOf(ship: ShipPlacement): { row: number; col: number } {
  const coords = ship.cells.map((c) => c.split("-").map(Number));
  return { row: Math.min(...coords.map(([r]) => r)), col: Math.min(...coords.map(([, c]) => c)) };
}
