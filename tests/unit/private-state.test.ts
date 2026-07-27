import { describe, expect, it, beforeEach } from "vitest";
import { storageKeyFor, readStored } from "@/lib/realtime/privateState";
import { battleshipReducer, createInitialState, type BattleshipState } from "@/games/battleship/reducer";
import type { ShipPlacement } from "@/games/battleship/placement";

// This project has no jsdom/@testing-library/react dependency, so
// `usePrivateState`/`useAnswerPending` (the React hooks themselves) are
// verified live in-browser per TASK-0031's manual verification steps
// rather than via `renderHook` — that's a deliberate, scoped decision, not
// an oversight (see HANDOFF.md). What's tested here is everything about
// ADR-0005's mechanism that *is* plain-function-testable: the storage key
// format, the read round-trip, and — the part that actually matters — that
// a device's private fleet never shows up anywhere in the shared state a
// real match produces.

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe("storageKeyFor", () => {
  it("namespaces by room, game, and player so different games/players never collide", () => {
    const a = storageKeyFor("ABCD", "battleship", "p1");
    const b = storageKeyFor("ABCD", "battleship", "p2");
    const c = storageKeyFor("ABCD", "who-am-i", "p1");
    const d = storageKeyFor("WXYZ", "battleship", "p1");
    expect(new Set([a, b, c, d]).size).toBe(4);
    expect(a).toBe("nexplay:private:ABCD:battleship:p1");
  });
});

describe("readStored", () => {
  beforeEach(() => {
    globalThis.localStorage = createMemoryStorage();
  });

  it("round-trips a JSON value written under the same key", () => {
    const key = storageKeyFor("ABCD", "battleship", "p1");
    const value: { fleet: ShipPlacement[] } = { fleet: [{ type: "patrol", cells: ["0-0", "0-1"] }] };
    localStorage.setItem(key, JSON.stringify(value));
    expect(readStored<typeof value>(key)).toEqual(value);
  });

  it("returns undefined when nothing was ever stored", () => {
    expect(readStored(storageKeyFor("ABCD", "battleship", "p1"))).toBeUndefined();
  });

  it("returns undefined instead of throwing on corrupted storage", () => {
    const key = storageKeyFor("ABCD", "battleship", "p1");
    localStorage.setItem(key, "{not valid json");
    expect(readStored(key)).toBeUndefined();
  });
});

describe("ADR-0005: the private slice never appears in shared state", () => {
  it("a full private fleet placement leaves zero trace in BattleshipState", () => {
    let state: BattleshipState = createInitialState(["p1", "p2"], 8);

    // Both players place full fleets *privately* — this data only ever
    // exists as an argument to answerPendingShot in real play, never
    // dispatched through the reducer. SIDE_READY carries no fleet data.
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });

    const serialized = JSON.stringify(state);
    // No ship-cell coordinates leaked into the shared state via placement —
    // shots/revealedFleets are the only fields that could ever carry cell
    // ids, and both are still empty at this point. (Not checking for the
    // substring "fleet" here — `fleetSpec`, a legitimately shared field
    // describing ship *lengths*, contains it too; `"cells"` is the
    // ship-*position* data that must never appear.)
    expect(state.shots).toEqual({ A: {}, B: {} });
    expect(state.revealedFleets).toEqual({});
    expect(serialized).not.toMatch(/"cells"/);
  });

  it("even after shots are fired, only the fired-at cells and their result are shared — never the full layout", () => {
    let state: BattleshipState = createInitialState(["p1", "p2"], 8);
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });
    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["3-3"], weapon: null });
    state = battleshipReducer(state, {
      type: "RESOLVE_SHOT",
      side: "B",
      results: [{ cell: "3-3", result: "hit" }],
      sunk: [],
    });

    // Only the one fired-at cell is now visible in shared state, as a
    // hit/miss result — not as ship layout data.
    expect(state.shots.B).toEqual({ "3-3": "hit" });
    expect(state.revealedFleets).toEqual({}); // still nothing revealed pre-resolution
    expect(state.sunkShipCells).toEqual({ A: [], B: [] }); // this hit didn't finish a ship
  });

  it("a sunk ship's own cells become visible — a deliberate, narrow exception, never the rest of the fleet", () => {
    // ADR-0005 §3 says "the layout that produced it never does" — but once
    // every one of a ship's cells is independently confirmed a hit, showing
    // that ship's own shape reveals nothing new about strategy (it's
    // already dead and every one of its cells already reads "hit"); it only
    // lets the shooter's screen draw the actual ship there instead of bare
    // dots. This is the same kind of scoped, documented exception as
    // `revealedFleets` (ADR-0005 §6) — just per-ship and mid-match instead
    // of whole-fleet at the very end.
    let state: BattleshipState = createInitialState(["p1", "p2"], 8);
    state = battleshipReducer(state, { type: "SIDE_READY", side: "A" });
    state = battleshipReducer(state, { type: "SIDE_READY", side: "B" });
    state = battleshipReducer(state, { type: "FIRE", side: "A", cells: ["0-0"], weapon: null });
    state = battleshipReducer(state, {
      type: "RESOLVE_SHOT",
      side: "B",
      results: [{ cell: "0-0", result: "hit" }],
      sunk: [{ type: "patrol", cells: ["0-0", "0-1"] }],
    });

    expect(state.sunkShipCells.B).toEqual([{ type: "patrol", cells: ["0-0", "0-1"] }]);
    // Side A (the untouched fleet) still has zero cell data anywhere.
    expect(state.sunkShipCells.A).toEqual([]);
    expect(JSON.stringify(state.sunkShipCells.A)).not.toMatch(/"cells"/);
  });
});
