import { describe, expect, it } from "vitest";
import {
  battleshipReducer,
  createInitialState,
  answerPendingShot,
  otherSide,
  type BattleshipState,
  type BattleshipPrivate,
} from "@/games/battleship/reducer";
import {
  shipCells,
  canPlaceShip,
  isFleetComplete,
  randomFleetPlacement,
  fleetSpecFor,
  FLEET_8,
  shipTypeAt,
  shipAt,
  orientationOf,
  anchorOf,
  type ShipPlacement,
} from "@/games/battleship/placement";
import { weaponCells, weaponForShipType, WEAPON_COST } from "@/games/battleship/weapons";

describe("placement — pure validation, no randomness", () => {
  it("returns null when a ship would run off the board", () => {
    expect(shipCells(0, 6, 4, "horizontal", 8)).toBeNull(); // cols 6,7,8,9 — 9 is out of an 8-wide board
    expect(shipCells(0, 0, 4, "horizontal", 8)).toEqual(["0-0", "0-1", "0-2", "0-3"]);
  });

  it("rejects an overlapping placement", () => {
    const existing: ShipPlacement[] = [{ type: "patrol", cells: ["2-2", "2-3"] }];
    expect(canPlaceShip(existing, ["2-3", "2-4"])).toBe(false); // overlaps at 2-3
    expect(canPlaceShip(existing, ["3-2", "3-3"])).toBe(true);
  });

  it("isFleetComplete requires every spec'd ship, correct length, no overlaps", () => {
    expect(isFleetComplete([], FLEET_8)).toBe(false);
    const partial: ShipPlacement[] = [{ type: "carrier", cells: ["0-0", "0-1", "0-2", "0-3"] }];
    expect(isFleetComplete(partial, FLEET_8)).toBe(false);

    const full = randomFleetPlacement(FLEET_8, 8);
    expect(isFleetComplete(full, FLEET_8)).toBe(true);
  });

  it("shipAt/shipTypeAt find the ship occupying a cell, or nothing", () => {
    const fleet: ShipPlacement[] = [
      { type: "patrol", cells: ["2-2", "2-3"] },
      { type: "carrier", cells: ["0-0", "0-1", "0-2", "0-3"] },
    ];
    expect(shipTypeAt(fleet, "2-3")).toBe("patrol");
    expect(shipAt(fleet, "0-2")).toEqual(fleet[1]);
    expect(shipAt(fleet, "5-5")).toBeNull();
    expect(shipTypeAt(fleet, "5-5")).toBeNull();
  });

  it("orientationOf and anchorOf read a ship's placement back out of its cells", () => {
    const horizontalShip: ShipPlacement = { type: "destroyer", cells: ["1-4", "1-5", "1-6"] };
    const verticalShip: ShipPlacement = { type: "submarine", cells: ["3-2", "4-2", "5-2"] };
    expect(orientationOf(horizontalShip)).toBe("horizontal");
    expect(orientationOf(verticalShip)).toBe("vertical");
    expect(anchorOf(horizontalShip)).toEqual({ row: 1, col: 4 });
    expect(anchorOf(verticalShip)).toEqual({ row: 3, col: 2 });
  });

  it("randomFleetPlacement always produces a valid, non-overlapping fleet", () => {
    for (let i = 0; i < 20; i++) {
      const fleet = randomFleetPlacement(fleetSpecFor(10), 10);
      expect(isFleetComplete(fleet, fleetSpecFor(10))).toBe(true);
    }
  });
});

describe("battleshipReducer", () => {
  function startedGame(): BattleshipState {
    return createInitialState(["p1", "p2"], 8);
  }

  it("START_GAME assigns one player per side and starts in placing phase", () => {
    const state = startedGame();
    expect(state.phase).toBe("placing");
    expect(state.sides).toEqual({ A: ["p1"], B: ["p2"] });
    expect(state.fleetSpec).toEqual(FLEET_8);
  });

  it("SIDE_READY moves to firing only once both sides are ready", () => {
    let state = startedGame();
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    expect(state.phase).toBe("placing");
    expect(state.readySides.A).toBe(true);

    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });
    expect(state.phase).toBe("firing");
  });

  it("ignores SIDE_READY once the match has left the placing phase", () => {
    let state = startedGame();
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });
    const afterBothReady = state;
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    expect(state).toEqual(afterBothReady); // no-op — invalid action ignored, not crashed
  });

  it("FIRE is ignored outside the firing phase, out of turn, or with a shot already pending", () => {
    let state = startedGame();
    // Still placing — FIRE does nothing.
    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["0-0"], weapon: null });
    expect(state.pendingShot).toBeNull();

    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });
    expect(state.phase).toBe("firing");

    // Out of turn (it's A's turn, not B's).
    state = battleshipReducer(state, { type: "FIRE", side: "B", cells: ["0-0"], weapon: null });
    expect(state.pendingShot).toBeNull();

    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["0-0"], weapon: null });
    expect(state.pendingShot).toEqual({ shooterSide: "A", cells: ["0-0"] });

    // A second FIRE while one is already pending is ignored.
    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["1-1"], weapon: null });
    expect(state.pendingShot).toEqual({ shooterSide: "A", cells: ["0-0"] });
  });

  it("FIRE rejects a weapon the side can't afford, or a shot entirely on already-fired cells", () => {
    let state = startedGame();
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });
    expect(state.charges.A).toBe(0);

    // Can't afford a Double (cost 2) with 0 charges.
    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["0-0", "0-1"], weapon: "doubleHorizontal" });
    expect(state.pendingShot).toBeNull();

    // Give A some charges directly (as if several turns had passed), then it works.
    state = { ...state, charges: { ...state.charges, A: 2 } };
    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["0-0", "0-1"], weapon: "doubleHorizontal" });
    expect(state.pendingShot).toEqual({ shooterSide: "A", cells: ["0-0", "0-1"] });
    expect(state.charges.A).toBe(0); // cost deducted immediately, regardless of the eventual result

    const bPrivate: BattleshipPrivate = { fleet: [] };
    const action = answerPendingShot(state, bPrivate, "p2")!;
    state = battleshipReducer(state, action);

    // Both of those cells are now fired-at — a shot entirely on top of them is rejected.
    state = { ...state, turn: "A", charges: { ...state.charges, A: 5 } };
    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["0-0", "0-1"], weapon: "doubleHorizontal" });
    expect(state.pendingShot).toBeNull();
  });

  it("full fire -> resolve -> turn-flip cycle on a miss, granting the defender's turn-start charge", () => {
    let state = startedGame();
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });
    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["5-5"], weapon: null });

    const bPrivate: BattleshipPrivate = { fleet: [{ type: "patrol", cells: ["0-0", "0-1"] }] };
    const action = answerPendingShot(state, bPrivate, "p2"); // p2 is on side B, the defender
    expect(action).toEqual({
      type: "RESOLVE_SHOT",
      side: "B",
      results: [{ cell: "5-5", result: "miss" }],
      sunk: [],
    });

    state = battleshipReducer(state, action!);
    expect(state.pendingShot).toBeNull();
    expect(state.shots.B["5-5"]).toBe("miss");
    expect(state.turn).toBe("B"); // turn passes to the side just fired upon
    expect(state.charges.B).toBe(1); // B's turn just began — turn-start income
  });

  it("a hit that finishes a ship reports it in `sunk`, without yet ending the match", () => {
    let state = startedGame();
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });

    const bPrivate: BattleshipPrivate = {
      fleet: [
        { type: "patrol", cells: ["0-0", "0-1"] },
        { type: "carrier", cells: ["3-0", "3-1", "3-2", "3-3"] },
      ],
    };

    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["0-0"], weapon: null });
    let action = answerPendingShot(state, bPrivate, "p2")!;
    expect(action).toEqual({
      type: "RESOLVE_SHOT",
      side: "B",
      results: [{ cell: "0-0", result: "hit" }],
      sunk: [],
    });
    state = battleshipReducer(state, action);
    expect(state.phase).toBe("firing"); // one ship remains — match continues

    // Turn passed to B; B fires back somewhere irrelevant, then it's A's turn again.
    state = battleshipReducer(state, { type: "FIRE", side: "B", cells: ["7-7"], weapon: null });
    action = answerPendingShot(state, { fleet: [] }, "p1")!; // p1 (side A) has no ships there — miss
    state = battleshipReducer(state, action);
    expect(state.turn).toBe("A");

    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["0-1"], weapon: null });
    action = answerPendingShot(state, bPrivate, "p2")!;
    expect(action).toEqual({
      type: "RESOLVE_SHOT",
      side: "B",
      results: [{ cell: "0-1", result: "hit" }],
      sunk: [{ type: "patrol", cells: ["0-0", "0-1"] }],
    });
    state = battleshipReducer(state, action);
    expect(state.sunkShips.B).toEqual(["patrol"]);
    expect(state.sunkShipCells.B).toEqual([{ type: "patrol", cells: ["0-0", "0-1"] }]);
    expect(state.phase).toBe("firing"); // carrier still afloat
    // B's charges: +1 turn-start income after A's first (non-sinking) shot,
    // +2 anti-snowball compensation for the sunk patrol, +1 turn-start
    // income again since B's turn begins right after this resolution too.
    expect(state.charges.B).toBe(4);
  });

  it("a single multi-cell shot can sink more than one ship at once", () => {
    let state = startedGame();
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });

    // Two 1-cell-remaining ships, adjacent, both finished by the same shot.
    const bPrivate: BattleshipPrivate = {
      fleet: [
        { type: "patrol", cells: ["0-0", "0-1"] },
        { type: "submarine", cells: ["0-2", "0-3", "0-4"] },
      ],
    };
    state = { ...state, shots: { ...state.shots, B: { "0-0": "hit", "0-3": "hit", "0-4": "hit" } } };

    state = { ...state, charges: { ...state.charges, A: 2 } };
    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["0-1", "0-2"], weapon: "doubleHorizontal" });
    const action = answerPendingShot(state, bPrivate, "p2")!;
    expect(action.type).toBe("RESOLVE_SHOT");
    if (action.type !== "RESOLVE_SHOT") throw new Error("unreachable");
    expect(action.sunk.map((s) => s.type).sort()).toEqual(["patrol", "submarine"]);

    state = battleshipReducer(state, action);
    expect(state.sunkShips.B.sort()).toEqual(["patrol", "submarine"]);
    // +2 per ship sunk this shot (no double-counting), plus B's own
    // turn-start income since it's B's turn to fire back next.
    expect(state.charges.B).toBe(5);
  });

  it("sinking every ship on a side ends the match with a winner", () => {
    let state = startedGame();
    // Give B a fleet of exactly the spec'd ships so sinking all of them is reachable.
    const bFleet: ShipPlacement[] = FLEET_8.map((spec, i) => ({
      type: spec.type,
      cells: Array.from({ length: spec.length }, (_, j) => `${i}-${j}`),
    }));
    const bPrivate: BattleshipPrivate = { fleet: bFleet };

    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });

    const allBCells = bFleet.flatMap((ship) => ship.cells);
    let dummyIndex = 0;
    for (const cell of allBCells) {
      // It must be A's turn each time we fire — after a resolved shot, turn
      // passes to B, so B fires back (at a fresh, never-reused cell — firing
      // twice at the same cell is a no-op, per the reducer's own rule) to
      // hand the turn back to A.
      state = battleshipReducer(state, { type: "FIRE", side: "A", cells: [cell], weapon: null });
      const action = answerPendingShot(state, bPrivate, "p2")!;
      state = battleshipReducer(state, action);
      if (state.phase === "resolution") break;

      const dummyCell = `${Math.floor(dummyIndex / 8)}-${dummyIndex % 8}`;
      dummyIndex++;
      state = battleshipReducer(state, { type: "FIRE", side: "B", cells: [dummyCell], weapon: null });
      const bAction = answerPendingShot(state, { fleet: [] }, "p1");
      if (bAction) state = battleshipReducer(state, bAction);
    }

    expect(state.phase).toBe("resolution");
    expect(state.winner).toBe("A");
    expect(state.scores.p1).toBe(20);
    expect(state.sunkShips.B.sort()).toEqual(FLEET_8.map((s) => s.type).sort());
    expect(state.sunkShipCells.B.map((s) => s.type).sort()).toEqual(FLEET_8.map((s) => s.type).sort());
  });

  it("answerPendingShot returns null on the device that isn't the defender", () => {
    let state = startedGame();
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });
    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["0-0"], weapon: null });

    // p1 is on side A (the shooter) — not the one who can answer this shot.
    expect(answerPendingShot(state, { fleet: [] }, "p1")).toBeNull();
    // No pending shot at all — also null.
    const noPending = { ...state, pendingShot: null };
    expect(answerPendingShot(noPending, { fleet: [] }, "p2")).toBeNull();
  });

  it("REVEAL_FLEET only applies once the match has reached resolution", () => {
    let state = startedGame();
    const fleet: ShipPlacement[] = [{ type: "patrol", cells: ["0-0", "0-1"] }];
    state = battleshipReducer(state, { type: "REVEAL_FLEET", side: "A", fleet });
    expect(state.revealedFleets).toEqual({}); // ignored — still in placing phase

    const resolved: BattleshipState = { ...state, phase: "resolution", winner: "B" };
    const revealed = battleshipReducer(resolved, { type: "REVEAL_FLEET", side: "A", fleet });
    expect(revealed.revealedFleets.A).toEqual(fleet);
  });

  it("PLAY_AGAIN resets the board for a new round without touching sides/scores", () => {
    let state = startedGame();
    state = {
      ...state,
      phase: "resolution",
      winner: "A",
      scores: { p1: 20 },
      shots: { A: {}, B: { "1-1": "hit" } },
      charges: { A: 3, B: 1 },
    };
    state = battleshipReducer(state, { type: "PLAY_AGAIN" });
    expect(state.phase).toBe("placing");
    expect(state.winner).toBeNull();
    expect(state.shots).toEqual({ A: {}, B: {} });
    expect(state.charges).toEqual({ A: 0, B: 0 });
    expect(state.scores).toEqual({ p1: 20 }); // cumulative across rounds, same as Impostor's scoring
    expect(state.sides).toEqual({ A: ["p1"], B: ["p2"] });
  });

  it("PLAY_AGAIN is ignored outside the resolution phase", () => {
    const state = startedGame();
    const after = battleshipReducer(state, { type: "PLAY_AGAIN" });
    expect(after).toBe(state);
  });
});

describe("otherSide", () => {
  it("flips A/B", () => {
    expect(otherSide("A")).toBe("B");
    expect(otherSide("B")).toBe("A");
  });
});

describe("weapons — shot shapes and the ship-bound weapon table", () => {
  it("doubleHorizontal/doubleVertical are each a fixed 2-cell shape, not rotatable", () => {
    expect(weaponCells("doubleHorizontal", 3, 3, "horizontal", 8)).toEqual(["3-3", "3-4"]);
    expect(weaponCells("doubleHorizontal", 3, 3, "vertical", 8)).toEqual(["3-3", "3-4"]); // orientation ignored
    expect(weaponCells("doubleVertical", 3, 3, "horizontal", 8)).toEqual(["3-3", "4-3"]); // orientation ignored
  });

  it("triple is a 3-cell line whose orientation the firing side chooses", () => {
    expect(weaponCells("triple", 2, 2, "horizontal", 8)).toEqual(["2-2", "2-3", "2-4"]);
    expect(weaponCells("triple", 2, 2, "vertical", 8)).toEqual(["2-2", "3-2", "4-2"]);
  });

  it("cross is a fixed 5-cell plus shape centered on the anchor", () => {
    expect(weaponCells("cross", 3, 3, "horizontal", 8).sort()).toEqual(
      ["2-3", "3-2", "3-3", "3-4", "4-3"].sort()
    );
  });

  it("clips off-board cells rather than rejecting the whole shot", () => {
    // Cross anchored at the top-left corner: two of its five arms fall off-board.
    expect(weaponCells("cross", 0, 0, "horizontal", 8).sort()).toEqual(["0-0", "0-1", "1-0"].sort());
    // Triple anchored one cell from the right edge, firing further right.
    expect(weaponCells("triple", 0, 6, "horizontal", 8)).toEqual(["0-6", "0-7"]); // "0-8" clipped
  });

  it("only carrier/battleship/destroyer/submarine carry a weapon — patrol never does", () => {
    expect(weaponForShipType("carrier")).toBe("cross");
    expect(weaponForShipType("battleship")).toBe("triple");
    expect(weaponForShipType("destroyer")).toBe("doubleVertical");
    expect(weaponForShipType("submarine")).toBe("doubleHorizontal");
    expect(weaponForShipType("patrol")).toBeNull();
  });

  it("costs scale with how many cells each shape covers", () => {
    expect(WEAPON_COST.doubleHorizontal).toBe(2);
    expect(WEAPON_COST.doubleVertical).toBe(2);
    expect(WEAPON_COST.triple).toBe(3);
    expect(WEAPON_COST.cross).toBe(4);
  });
});
