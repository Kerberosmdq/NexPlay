import type { Player, RoomState } from "@/lib/types/room";

/**
 * Returns the Supabase Realtime channel topic for a given room code.
 */
export function createRoomChannelTopic(code: string): string {
  return `room:${code.trim().toUpperCase()}`;
}

/**
 * Creates the initial room state when a room is first created by a host.
 */
export function createInitialRoomState(
  code: string,
  hostUserId: string,
  hostDisplayName: string,
  now: number = Date.now()
): RoomState {
  const hostPlayer: Player = {
    id: hostUserId,
    displayName: hostDisplayName.trim() || "Host",
    isHost: true,
    joinedAt: now,
    isOnline: true,
  };

  return {
    code: code.trim().toUpperCase(),
    hostUserId,
    players: [hostPlayer],
    createdAt: now,
  };
}

/**
 * Recalculates host assignment among players per ADR-0001 §4.
 *
 * If the current host is online, host status remains unchanged.
 * If the current host is offline, host status automatically migrates to the
 * online player who joined earliest (oldest `joinedAt` timestamp).
 */
export function calculateHostMigration(players: Player[]): Player[] {
  if (!players || players.length === 0) {
    return [];
  }

  const currentHost = players.find((p) => p.isHost);
  if (currentHost && currentHost.isOnline) {
    return players;
  }

  const onlinePlayers = players.filter((p) => p.isOnline);
  if (onlinePlayers.length === 0) {
    return players.map((p) => ({ ...p, isHost: false }));
  }

  // Sort online players by joinedAt ascending (oldest first)
  const sortedOnline = [...onlinePlayers].sort((a, b) => a.joinedAt - b.joinedAt);
  const newHostId = sortedOnline[0].id;

  return players.map((player) => ({
    ...player,
    isHost: player.id === newHostId,
  }));
}
