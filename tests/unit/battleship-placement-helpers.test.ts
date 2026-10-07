import { describe, expect, it } from "vitest";
import { placeShipAt, rotateShipInPlace, orientationOf, type ShipPlacement } from "@/games/battleship/placement";

const carrier = { type: "carrier", length: 4 };
const patrol = { type: "patrol", length: 2 };

describe("placeShipAt", () => {
  it("places a ship from the shipyard", () => {
    expect(placeShipAt([], carrier, 0, 0, "horizontal", 8)).toEqual([
      { type: "carrier", cells: ["0-0", "0-1", "0-2", "0-3"] },
    ]);
  });

  it("moves a ship that is already on the board instead of duplicating it", () => {
    const fleet = placeShipAt([], carrier, 0, 0, "horizontal", 8)!;
    const moved = placeShipAt(fleet, carrier, 5, 2, "horizontal", 8)!;
    expect(moved).toHaveLength(1);
    expect(moved[0].cells).toEqual(["5-2", "5-3", "5-4", "5-5"]);
  });

  it("refuses to run off the board or overlap another ship", () => {
    expect(placeShipAt([], carrier, 0, 6, "horizontal", 8)).toBeNull();
    const fleet = placeShipAt([], carrier, 0, 0, "horizontal", 8)!;
    expect(placeShipAt(fleet, patrol, 0, 2, "vertical", 8)).toBeNull();
  });
});

describe("rotateShipInPlace", () => {
  it("turns a ship around its anchor", () => {
    const fleet: ShipPlacement[] = [{ type: "carrier", cells: ["2-2", "2-3", "2-4", "2-5"] }];
    const turned = rotateShipInPlace(fleet, "carrier", 8)!;
    expect(orientationOf(turned[0])).toBe("vertical");
    expect(turned[0].cells).toEqual(["2-2", "3-2", "4-2", "5-2"]);
  });

  it("slides back along the new axis when the edge is in the way", () => {
    const fleet: ShipPlacement[] = [{ type: "carrier", cells: ["6-1", "6-2", "6-3", "6-4"] }];
    const turned = rotateShipInPlace(fleet, "carrier", 8)!;
    expect(turned[0].cells).toEqual(["4-1", "5-1", "6-1", "7-1"]);
  });

  it("returns null when the ship can't turn anywhere nearby", () => {
    const fleet: ShipPlacement[] = [
      { type: "patrol", cells: ["0-0", "0-1"] },
      { type: "carrier", cells: ["1-0", "1-1", "1-2", "1-3"] },
    ];
    expect(rotateShipInPlace(fleet, "patrol", 8)).toBeNull();
  });
});
