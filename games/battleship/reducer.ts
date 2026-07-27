import { fleetSpecFor, type ShipPlacement, type ShipSpec } from "./placement";

export type BattleshipSide = "A" | "B";

export type BattleshipPhase = "placing" | "firing" | "resolution";

export type CellResult = "hit" | "miss";

export interface BattleshipState {
  phase: BattleshipPhase;
  boardSize: number;
  fleetSpec: ShipSpec[];

  // Fixed for the whole match, set at setup — one player per side in M4a
  // (ADR-0002's "sides, not modes" decision means this shape already
  // supports more than one id per side; M4c is adding to this array, not
  // reshaping it).
  sides: Record<BattleshipSide, string[]>;

  readySides: Record<BattleshipSide, boolean>;

  // Shots *received* by each side, keyed by cell id. This is the only
  // record of where the opponent has fired — never where ships actually
  // are (that's each device's private slice, ADR-0005).
  shots: Record<BattleshipSide, Record<string, CellResult>>;
  sunkShips: Record<BattleshipSide, string[]>;
  // The cells of each sunk ship, in the same order as `sunkShips` — lets the
  // shooter's device render the actual ship shape over its hit dots once
  // it's confirmed sunk, without ever knowing the rest of the opponent's
  // fleet layout (only a fully-hit ship's own cells are revealed here, by
  // the defending device itself in `answerPendingShot`).
  sunkShipCells: Record<BattleshipSide, ShipPlacement[]>;

  turn: BattleshipSide;

  // A shot has been called but not yet resolved — the defending side's
  // device answers this via `answerPending` (ADR-0005 §3). While this is
  // set, no one may fire again.
  pendingShot: { shooterSide: BattleshipSide; cell: string } | null;

  // Filled in only once the match reaches "resolution" — the losing side's
  // own device reveals its board at that point, since it's no longer
  // secret. Never populated before then.
  revealedFleets: Partial<Record<BattleshipSide, ShipPlacement[]>>;

  winner: BattleshipSide | null;
  scores: Record<string, number>;
}

export type BattleshipAction =
  | { type: "START_GAME"; playerIds: string[]; boardSize: number }
  // No fleet data here — placement is a purely private change (ADR-0005 §2);
  // the room only ever learns that a side finished placing.
  | { type: "SIDE_READY"; side: BattleshipSide }
  | { type: "FIRE"; side: BattleshipSide; cell: string }
  | {
      type: "RESOLVE_SHOT";
      side: BattleshipSide;
      cell: string;
      result: CellResult;
      sunkShipType: string | null;
      sunkShipCells: string[] | null;
    }
  | { type: "REVEAL_FLEET"; side: BattleshipSide; fleet: ShipPlacement[] }
  | { type: "PLAY_AGAIN" };

export function otherSide(side: BattleshipSide): BattleshipSide {
  return side === "A" ? "B" : "A";
}

/** ADR-0005: this device's private slice — just its own fleet layout.
 * Nothing here ever gets folded into `BattleshipState`. */
export interface BattleshipPrivate {
  fleet: ShipPlacement[];
}

/** ADR-0005 §2/§3: answers a pending shot when this device is the one that
 * knows whether it was a hit — i.e. this player is on the defending side.
 * Pure: `privateState` arrives as an argument, never read ambiently, so
 * this is unit-testable with no I/O (same rule as the reducer itself). */
export function answerPendingShot(
  state: BattleshipState,
  privateState: BattleshipPrivate,
  playerId: string
): BattleshipAction | null {
  if (!state.pendingShot) return null;

  const defendingSide = otherSide(state.pendingShot.shooterSide);
  if (!state.sides[defendingSide].includes(playerId)) return null; // not this device's board to answer for

  const cell = state.pendingShot.cell;
  const hitShip = privateState.fleet.find((ship) => ship.cells.includes(cell));
  const result: CellResult = hitShip ? "hit" : "miss";

  let sunkShipType: string | null = null;
  let sunkShipCells: string[] | null = null;
  if (hitShip) {
    const alreadyHit = new Set(
      Object.entries(state.shots[defendingSide])
        .filter(([, r]) => r === "hit")
        .map(([c]) => c)
    );
    alreadyHit.add(cell);
    if (hitShip.cells.every((c) => alreadyHit.has(c))) {
      sunkShipType = hitShip.type;
      sunkShipCells = hitShip.cells;
    }
  }

  return { type: "RESOLVE_SHOT", side: defendingSide, cell, result, sunkShipType, sunkShipCells };
}

function applyPoints(scores: BattleshipState["scores"], pointsAwarded: Record<string, number>) {
  const next = { ...scores };
  for (const [id, pts] of Object.entries(pointsAwarded)) {
    next[id] = (next[id] || 0) + pts;
  }
  return next;
}

/** The one place a fresh `BattleshipState` is built — shared by the
 * reducer's own `START_GAME` case and `GameModule.setup()`, so there's no
 * second copy of this shape to keep in sync. */
export function createInitialState(playerIds: string[], boardSize: number): BattleshipState {
  const [p1, p2] = playerIds;
  return {
    phase: "placing",
    boardSize,
    fleetSpec: fleetSpecFor(boardSize),
    sides: { A: p1 ? [p1] : [], B: p2 ? [p2] : [] },
    readySides: { A: false, B: false },
    shots: { A: {}, B: {} },
    sunkShips: { A: [], B: [] },
    sunkShipCells: { A: [], B: [] },
    turn: "A",
    pendingShot: null,
    revealedFleets: {},
    winner: null,
    scores: {},
  };
}

export function battleshipReducer(state: BattleshipState, action: BattleshipAction): BattleshipState {
  switch (action.type) {
    case "START_GAME":
      return createInitialState(action.playerIds, action.boardSize);

    case "SIDE_READY": {
      if (state.phase !== "placing") return state;
      const readySides = { ...state.readySides, [action.side]: true };
      const bothReady = readySides.A && readySides.B;
      return { ...state, readySides, phase: bothReady ? "firing" : "placing" };
    }

    case "FIRE": {
      if (state.phase !== "firing") return state;
      if (state.turn !== action.side) return state;
      if (state.pendingShot) return state; // a shot is already awaiting resolution
      const target = otherSide(action.side);
      if (state.shots[target][action.cell]) return state; // already fired at this cell
      return { ...state, pendingShot: { shooterSide: action.side, cell: action.cell } };
    }

    case "RESOLVE_SHOT": {
      if (state.phase !== "firing") return state;
      // Guards against a stale/duplicate resolution (e.g. a broadcast echo
      // arriving after the pending marker already cleared).
      if (!state.pendingShot || state.pendingShot.cell !== action.cell) return state;
      if (otherSide(state.pendingShot.shooterSide) !== action.side) return state;

      const shooterSide = state.pendingShot.shooterSide;
      const defendingSide = action.side;

      const shots = {
        ...state.shots,
        [defendingSide]: { ...state.shots[defendingSide], [action.cell]: action.result },
      };
      const sunkShips = action.sunkShipType
        ? { ...state.sunkShips, [defendingSide]: [...state.sunkShips[defendingSide], action.sunkShipType] }
        : state.sunkShips;
      const sunkShipCells =
        action.sunkShipType && action.sunkShipCells
          ? {
              ...state.sunkShipCells,
              [defendingSide]: [
                ...state.sunkShipCells[defendingSide],
                { type: action.sunkShipType, cells: action.sunkShipCells },
              ],
            }
          : state.sunkShipCells;

      const fleetFullySunk = sunkShips[defendingSide].length === state.fleetSpec.length;

      if (fleetFullySunk) {
        const pointsAwarded: Record<string, number> = {};
        for (const id of state.sides[shooterSide]) pointsAwarded[id] = 20;
        return {
          ...state,
          phase: "resolution",
          shots,
          sunkShips,
          sunkShipCells,
          pendingShot: null,
          winner: shooterSide,
          scores: applyPoints(state.scores, pointsAwarded),
        };
      }

      return {
        ...state,
        shots,
        sunkShipCells,
        sunkShips,
        pendingShot: null,
        turn: defendingSide, // the side just fired upon gets to fire back
      };
    }

    case "REVEAL_FLEET": {
      if (state.phase !== "resolution") return state;
      return { ...state, revealedFleets: { ...state.revealedFleets, [action.side]: action.fleet } };
    }

    case "PLAY_AGAIN":
      if (state.phase !== "resolution") return state;
      return {
        ...state,
        phase: "placing",
        readySides: { A: false, B: false },
        shots: { A: {}, B: {} },
        sunkShips: { A: [], B: [] },
        sunkShipCells: { A: [], B: [] },
        turn: "A",
        pendingShot: null,
        revealedFleets: {},
        winner: null,
      };

    default:
      return state;
  }
}
