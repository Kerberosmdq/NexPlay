import { describe, expect, it, beforeEach } from "vitest";
import {
  loadFamilyRoster,
  rememberFamilyNames,
  prefillNames,
  MAX_REMEMBERED_NAMES,
} from "@/lib/family/roster";

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

describe("family roster", () => {
  beforeEach(() => {
    // The node test environment has no real localStorage.
    globalThis.localStorage = createMemoryStorage();
  });

  it("starts empty", () => {
    expect(loadFamilyRoster()).toEqual([]);
  });

  it("remembers names, most recent game first, without duplicates", () => {
    rememberFamilyNames(["Ana", "Leo", "Papá"]);
    rememberFamilyNames(["Leo", "Abuela"]);
    expect(loadFamilyRoster()).toEqual(["Leo", "Abuela", "Ana", "Papá"]);
  });

  it("trims names and treats different capitalisation as the same person", () => {
    rememberFamilyNames(["  Ana ", "", "ana", "LEO"]);
    expect(loadFamilyRoster()).toEqual(["Ana", "LEO"]);
  });

  it("caps how many names it keeps", () => {
    const many = Array.from({ length: MAX_REMEMBERED_NAMES + 5 }, (_, i) => `P${i}`);
    rememberFamilyNames(many);
    expect(loadFamilyRoster()).toHaveLength(MAX_REMEMBERED_NAMES);
    expect(loadFamilyRoster()[0]).toBe("P0");
  });

  it("ignores corrupt stored data", () => {
    localStorage.setItem("nexplay:family-roster:v1", "{not json");
    expect(loadFamilyRoster()).toEqual([]);
    localStorage.setItem("nexplay:family-roster:v1", JSON.stringify({ a: 1 }));
    expect(loadFamilyRoster()).toEqual([]);
    localStorage.setItem("nexplay:family-roster:v1", JSON.stringify(["Ana", 3, null]));
    expect(loadFamilyRoster()).toEqual(["Ana"]);
  });

  it("survives storage being unavailable", () => {
    globalThis.localStorage = {
      ...createMemoryStorage(),
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => rememberFamilyNames(["Ana"])).not.toThrow();
    expect(loadFamilyRoster()).toEqual([]);
  });
});

describe("prefillNames", () => {
  it("pads with empty slots", () => {
    expect(prefillNames(["Miga"], 3)).toEqual(["Miga", "", ""]);
  });

  it("keeps every remembered name when there is room", () => {
    expect(prefillNames(["Ana", "Leo", "Papá", "Abuela"], 3)).toEqual(["Ana", "Leo", "Papá", "Abuela"]);
  });

  it("caps at maxSlots for fixed-size games", () => {
    expect(prefillNames(["Ana", "Leo", "Papá"], 2, 2)).toEqual(["Ana", "Leo"]);
  });

  it("starts blank with no remembered names", () => {
    expect(prefillNames([], 2, 2)).toEqual(["", ""]);
  });
});
