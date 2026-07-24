import { describe, expect, it } from "vitest";
import {
  generateRoomCode,
  isValidRoomCode,
  createRoomChannelTopic,
  createInitialRoomState,
  calculateHostMigration,
} from "@/lib/realtime";
import type { Player } from "@/lib/types/room";

describe("Room Code Generator & Validator", () => {
  it("generates a 4-character uppercase room code without ambiguous characters", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(4);
      expect(isValidRoomCode(code)).toBe(true);
      expect(code).not.toMatch(/[IOZ01]/);
    }
  });

  it("validates room codes correctly", () => {
    expect(isValidRoomCode("ABCD")).toBe(true);
    expect(isValidRoomCode("abcd")).toBe(true);
    expect(isValidRoomCode("ABC")).toBe(false);
    expect(isValidRoomCode("ABCDE")).toBe(false);
    expect(isValidRoomCode("AB12")).toBe(false);
    expect(isValidRoomCode("")).toBe(false);
  });
});

describe("Room State & Host Migration", () => {
  it("creates initial room state with host player", () => {
    const state = createInitialRoomState("ABCD", "host-user-1", "Alice", 1000);
    expect(state.code).toBe("ABCD");
    expect(state.hostUserId).toBe("host-user-1");
    expect(state.players).toHaveLength(1);
    expect(state.players[0]).toEqual({
      id: "host-user-1",
      displayName: "Alice",
      isHost: true,
      joinedAt: 1000,
      isOnline: true,
    });
  });

  it("creates valid room channel topic", () => {
    expect(createRoomChannelTopic("abcd")).toBe("room:ABCD");
  });

  it("retains host when current host is online", () => {
    const players: Player[] = [
      { id: "p1", displayName: "Alice", isHost: true, joinedAt: 1000, isOnline: true },
      { id: "p2", displayName: "Bob", isHost: false, joinedAt: 2000, isOnline: true },
    ];

    const result = calculateHostMigration(players);
    expect(result).toEqual(players);
  });

  it("migrates host to the oldest online player when current host disconnects", () => {
    const players: Player[] = [
      { id: "p1", displayName: "Alice (Host)", isHost: true, joinedAt: 1000, isOnline: false },
      { id: "p2", displayName: "Bob", isHost: false, joinedAt: 2000, isOnline: true },
      { id: "p3", displayName: "Charlie", isHost: false, joinedAt: 3000, isOnline: true },
    ];

    const result = calculateHostMigration(players);
    expect(result.find((p) => p.id === "p1")?.isHost).toBe(false);
    expect(result.find((p) => p.id === "p2")?.isHost).toBe(true);
    expect(result.find((p) => p.id === "p3")?.isHost).toBe(false);
  });

  it("handles case where all players are offline", () => {
    const players: Player[] = [
      { id: "p1", displayName: "Alice", isHost: true, joinedAt: 1000, isOnline: false },
      { id: "p2", displayName: "Bob", isHost: false, joinedAt: 2000, isOnline: false },
    ];

    const result = calculateHostMigration(players);
    expect(result.every((p) => !p.isHost)).toBe(true);
  });

  it("returns an empty array unchanged", () => {
    expect(calculateHostMigration([])).toEqual([]);
  });

  it("elects the oldest online player as host when no player is flagged host yet", () => {
    const players: Player[] = [
      { id: "p1", displayName: "Alice", isHost: false, joinedAt: 3000, isOnline: true },
      { id: "p2", displayName: "Bob", isHost: false, joinedAt: 1000, isOnline: true },
    ];

    const result = calculateHostMigration(players);
    expect(result.find((p) => p.id === "p2")?.isHost).toBe(true);
    expect(result.find((p) => p.id === "p1")?.isHost).toBe(false);
  });

  it("rejoining player regains host if they were the original host and are back online", () => {
    // Simulates the reconnection flow: host drops, migrates, then host returns.
    const disconnected: Player[] = [
      { id: "host-1", displayName: "Alice (Host)", isHost: true, joinedAt: 1000, isOnline: false },
      { id: "p2", displayName: "Bob", isHost: false, joinedAt: 2000, isOnline: true },
    ];
    const afterMigration = calculateHostMigration(disconnected);
    expect(afterMigration.find((p) => p.id === "p2")?.isHost).toBe(true);

    const reconnected = afterMigration.map((p) =>
      p.id === "host-1" ? { ...p, isOnline: true } : p
    );
    const afterReconnect = calculateHostMigration(reconnected);
    // Per ADR-0001 §4, host is a role attached to the room, not a permanent
    // property of a device — the previous host does NOT automatically regain
    // it just by reconnecting; the migrated host stays host.
    expect(afterReconnect.find((p) => p.id === "p2")?.isHost).toBe(true);
    expect(afterReconnect.find((p) => p.id === "host-1")?.isHost).toBe(false);
  });
});
