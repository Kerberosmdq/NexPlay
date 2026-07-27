import { fleetSpecFor, type ShipPlacement, type ShipSpec } from "./placement";
import { WEAPON_COST, type WeaponType } from "./weapons";

export type BattleshipSide = "A" | "B";

export type BattleshipPhase = "placing" | "firing" | "resolution";

export type CellResult = "hit" | "miss";

// M4b charge economy (`docs/ROADMAP.md` M4b, playtest-tunable): a side gains
// this many charges the instant its turn begins, and this many bonus
// "anti-snowball" charges per own ship sunk — landing on the side that just
// lost the ship, not the attacker, since the attacker already benefits from
// the sinking itself.
const TURN_INCOME_CHARGES = 1;
const SINK_COMPENSATION_CHARGES = 2;

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

  // Per-side charge pool (M4b) — shared across all of a side's weapons; only
  // *availability* of a given weapon is gated per-ship (whether that ship is
  // still afloat), never the currency itself.
  charges: Record<BattleshipSide, number>;

  turn: BattleshipSide;

  // A shot has been called but not yet resolved — the defending side's
  // device answers this via `answerPending` (ADR-0005 §3). While this is
  // set, no one may fire again. `cells` is more than one entry for a special
  // weapon shot (M4b); a plain shot is just the one cell.
  pendingShot: { shooterSide: BattleshipSide; cells: string[] } | null;

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
  // `cells` is pre-computed by the firing device from `weapon`'s shape (see
  // `games/battleship/weapons.ts`) — geometry needs no private information,
  // so there's nothing to hide by trusting it here, same as ship placement
  // trusting a private fleet's own `cells` without re-deriving them.
  // `weapon: null` is a plain, free, always-available single-cell shot.
  | { type: "FIRE"; side: BattleshipSide; cells: string[]; weapon: WeaponType | null }
  | {
      type: "RESOLVE_SHOT";
      side: BattleshipSide;
      results: { cell: string; result: CellResult }[];
      // Every ship newly confirmed sunk by this shot — usually 0 or 1, but a
      // multi-cell weapon (esp. Cross) can complete more than one ship at once.
      sunk: { type: string; cells: string[] }[];
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

  const alreadyHit = new Set(
    Object.entries(state.shots[defendingSide])
      .filter(([, r]) => r === "hit")
      .map(([c]) => c)
  );

  const results: { cell: string; result: CellResult }[] = [];
  for (const cell of state.pendingShot.cells) {
    const hitShip = privateState.fleet.find((ship) => ship.cells.includes(cell));
    results.push({ cell, result: hitShip ? "hit" : "miss" });
    if (hitShip) alreadyHit.add(cell);
  }

  // A ship already reported sunk by an earlier shot must never be reported
  // again here — every one of its cells still reads "hit" on every later
  // resolution, which would otherwise re-trigger indefinitely.
  const alreadySunkTypes = new Set(state.sunkShips[defendingSide]);
  const sunk = privateState.fleet
    .filter((ship) => !alreadySunkTypes.has(ship.type) && ship.cells.every((c) => alreadyHit.has(c)))
    .map((ship) => ({ type: ship.type, cells: ship.cells }));

  return { type: "RESOLVE_SHOT", side: defendingSide, results, sunk };
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
    charges: { A: 0, B: 0 },
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
      if (action.cells.length === 0) return state; // a shape entirely clipped off-board

      const cost = action.weapon ? WEAPON_COST[action.weapon] : 0;
      if (cost > state.charges[action.side]) return state; // can't afford this weapon

      const target = otherSide(action.side);
      const entirelyWasted = action.cells.every((c) => state.shots[target][c]);
      if (entirelyWasted) return state; // every cell already fired at

      return {
        ...state,
        charges: { ...state.charges, [action.side]: state.charges[action.side] - cost },
        pendingShot: { shooterSide: action.side, cells: action.cells },
      };
    }

    case "RESOLVE_SHOT": {
      if (state.phase !== "firing") return state;
      // Guards against a stale/duplicate resolution (e.g. a broadcast echo
      // arriving after the pending marker already cleared).
      if (!state.pendingShot) return state;
      const pendingCells = new Set(state.pendingShot.cells);
      const matchesPending =
        action.results.length === state.pendingShot.cells.length && action.results.every((r) => pendingCells.has(r.cell));
      if (!matchesPending) return state;
      if (otherSide(state.pendingShot.shooterSide) !== action.side) return state;

      const shooterSide = state.pendingShot.shooterSide;
      const defendingSide = action.side;

      const shots = {
        ...state.shots,
        [defendingSide]: {
          ...state.shots[defendingSide],
          ...Object.fromEntries(action.results.map((r) => [r.cell, r.result])),
        },
      };
      const sunkShips = action.sunk.length
        ? { ...state.sunkShips, [defendingSide]: [...state.sunkShips[defendingSide], ...action.sunk.map((s) => s.type)] }
        : state.sunkShips;
      const sunkShipCells = action.sunk.length
        ? { ...state.sunkShipCells, [defendingSide]: [...state.sunkShipCells[defendingSide], ...action.sunk] }
        : state.sunkShipCells;

      // Anti-snowball: the side that just lost one or more ships to this
      // shot gets bonus charges — landing on the loser, not the attacker.
      const charges = {
        ...state.charges,
        [defendingSide]: state.charges[defendingSide] + action.sunk.length * SINK_COMPENSATION_CHARGES,
      };

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
          charges,
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
        // The defender gets to fire back next — their turn-start income
        // lands here, in the same transition that flips `turn` to them.
        charges: { ...charges, [defendingSide]: charges[defendingSide] + TURN_INCOME_CHARGES },
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
        charges: { A: 0, B: 0 },
        turn: "A",
        pendingShot: null,
        revealedFleets: {},
        winner: null,
      };

    default:
      return state;
  }
}
