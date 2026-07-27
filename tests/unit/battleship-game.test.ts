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
    state = battleshipReducer(state, { type: "FIRE", side: "A", cell: "0-0" });
    expect(state.pendingShot).toBeNull();

    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });
    expect(state.phase).toBe("firing");

    // Out of turn (it's A's turn, not B's).
    state = battleshipReducer(state, { type: "FIRE", side: "B", cell: "0-0" });
    expect(state.pendingShot).toBeNull();

    state = battleshipReducer(state, { type: "FIRE", side: "A", cell: "0-0" });
    expect(state.pendingShot).toEqual({ shooterSide: "A", cell: "0-0" });

    // A second FIRE while one is already pending is ignored.
    state = battleshipReducer(state, { type: "FIRE", side: "A", cell: "1-1" });
    expect(state.pendingShot).toEqual({ shooterSide: "A", cell: "0-0" });
  });

  it("full fire -> resolve -> turn-flip cycle on a miss", () => {
    let state = startedGame();
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });
    state = battleshipReducer(state, { type: "FIRE", side: "A", cell: "5-5" });

    const bPrivate: BattleshipPrivate = { fleet: [{ type: "patrol", cells: ["0-0", "0-1"] }] };
    const action = answerPendingShot(state, bPrivate, "p2"); // p2 is on side B, the defender
    expect(action).toEqual({
      type: "RESOLVE_SHOT",
      side: "B",
      cell: "5-5",
      result: "miss",
      sunkShipType: null,
      sunkShipCells: null,
    });

    state = battleshipReducer(state, action!);
    expect(state.pendingShot).toBeNull();
    expect(state.shots.B["5-5"]).toBe("miss");
    expect(state.turn).toBe("B"); // turn passes to the side just fired upon
  });

  it("a hit that finishes a ship reports sunkShipType, without yet ending the match", () => {
    let state = startedGame();
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });

    const bPrivate: BattleshipPrivate = {
      fleet: [
        { type: "patrol", cells: ["0-0", "0-1"] },
        { type: "carrier", cells: ["3-0", "3-1", "3-2", "3-3"] },
      ],
    };

    state = battleshipReducer(state, { type: "FIRE", side: "A", cell: "0-0" });
    let action = answerPendingShot(state, bPrivate, "p2")!;
    expect(action).toEqual({
      type: "RESOLVE_SHOT",
      side: "B",
      cell: "0-0",
      result: "hit",
      sunkShipType: null,
      sunkShipCells: null,
    });
    state = battleshipReducer(state, action);
    expect(state.phase).toBe("firing"); // one ship remains — match continues

    // Turn passed to B; B fires back somewhere irrelevant, then it's A's turn again.
    state = battleshipReducer(state, { type: "FIRE", side: "B", cell: "7-7" });
    action = answerPendingShot(state, { fleet: [] }, "p1")!; // p1 (side A) has no ships there — miss
    state = battleshipReducer(state, action);
    expect(state.turn).toBe("A");

    state = battleshipReducer(state, { type: "FIRE", side: "A", cell: "0-1" });
    action = answerPendingShot(state, bPrivate, "p2")!;
    expect(action).toEqual({
      type: "RESOLVE_SHOT",
      side: "B",
      cell: "0-1",
      result: "hit",
      sunkShipType: "patrol",
      sunkShipCells: ["0-0", "0-1"],
    });
    state = battleshipReducer(state, action);
    expect(state.sunkShips.B).toEqual(["patrol"]);
    expect(state.sunkShipCells.B).toEqual([{ type: "patrol", cells: ["0-0", "0-1"] }]);
    expect(state.phase).toBe("firing"); // carrier still afloat
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
      state = battleshipReducer(state, { type: "FIRE", side: "A", cell });
      const action = answerPendingShot(state, bPrivate, "p2")!;
      state = battleshipReducer(state, action);
      if (state.phase === "resolution") break;

      const dummyCell = `${Math.floor(dummyIndex / 8)}-${dummyIndex % 8}`;
      dummyIndex++;
      state = battleshipReducer(state, { type: "FIRE", side: "B", cell: dummyCell });
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
    state = battleshipReducer(state, { type: "FIRE", side: "A", cell: "0-0" });

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
    state = { ...state, phase: "resolution", winner: "A", scores: { p1: 20 }, shots: { A: {}, B: { "1-1": "hit" } } };
    state = battleshipReducer(state, { type: "PLAY_AGAIN" });
    expect(state.phase).toBe("placing");
    expect(state.winner).toBeNull();
    expect(state.shots).toEqual({ A: {}, B: {} });
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
