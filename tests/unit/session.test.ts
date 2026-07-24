import { describe, expect, it, beforeEach } from "vitest";
import { saveRoomSession, loadRoomSession, clearRoomSession, type RoomSession } from "@/lib/realtime/session";

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

const MULTI_DEVICE_SESSION: RoomSession = {
  mode: "multi-device",
  role: "host",
  roomCode: "ABCD",
  userId: "host-xyz123",
  displayName: "Mateo",
};

describe("room session persistence", () => {
  beforeEach(() => {
    // The node test environment has no real localStorage.
    globalThis.localStorage = createMemoryStorage();
  });

  it("round-trips a saved multi-device session", () => {
    saveRoomSession(MULTI_DEVICE_SESSION);
    expect(loadRoomSession()).toEqual(MULTI_DEVICE_SESSION);
  });

  it("never persists a single-device session — nothing to rejoin", () => {
    saveRoomSession({ ...MULTI_DEVICE_SESSION, mode: "single-device", roomCode: "LOCAL" });
    expect(loadRoomSession()).toBeNull();
  });

  it("returns null when nothing was ever saved", () => {
    expect(loadRoomSession()).toBeNull();
  });

  it("clearRoomSession removes a saved session", () => {
    saveRoomSession(MULTI_DEVICE_SESSION);
    clearRoomSession();
    expect(loadRoomSession()).toBeNull();
  });

  it("ignores corrupted storage instead of throwing", () => {
    localStorage.setItem("nexplay:room-session:v1", "{not valid json");
    expect(loadRoomSession()).toBeNull();
  });

  it("ignores a saved value missing required fields", () => {
    localStorage.setItem("nexplay:room-session:v1", JSON.stringify({ mode: "multi-device" }));
    expect(loadRoomSession()).toBeNull();
  });
});
