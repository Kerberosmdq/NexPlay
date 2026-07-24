import { useEffect, useState, useRef, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
import { createRoomChannelTopic, calculateHostMigration } from "../room";
import type { Player, PresencePayload } from "@/lib/types/room";

const GRACE_PERIOD_MS = 60 * 1000;
const SUBSCRIBE_TIMEOUT_MS = 12 * 1000;

export function useRoomConnection<TState, TAction>({
  roomCode,
  userId,
  displayName,
  initialState,
  reducer,
}: {
  roomCode: string;
  userId: string;
  displayName: string;
  initialState: TState;
  reducer: (state: TState, action: TAction) => TState;
}) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<TState>(initialState);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const disconnectTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const playersRef = useRef(players);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Dispatch action locally and broadcast
  const dispatchAction = useCallback((action: TAction) => {
    // 1. Apply locally
    setGameState((prev) => reducer(prev, action));

    // 2. Broadcast to room
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "game_action",
        payload: { action },
      });
    }
  }, [reducer]);

  useEffect(() => {
    console.log("[useRoomConnection] effect starting for room", roomCode);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      console.error("[useRoomConnection] getSupabaseBrowserClient() returned null — missing env vars?");
      // Deferred so this doesn't count as a synchronous setState-in-effect.
      setTimeout(() => setConnectionError("missing_supabase_client"), 0);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        console.error("[useRoomConnection] timed out waiting for SUBSCRIBED status after", SUBSCRIBE_TIMEOUT_MS, "ms");
        setConnectionError("timeout");
      }
    }, SUBSCRIBE_TIMEOUT_MS);

    let channel: RealtimeChannel;
    try {
      const topic = createRoomChannelTopic(roomCode);
      console.log("[useRoomConnection] creating channel for topic", topic);
      channel = supabase.channel(topic, {
        config: { presence: { key: userId } },
      });
      channelRef.current = channel;
    } catch (err) {
      console.error("[useRoomConnection] supabase.channel() threw:", err);
      setTimeout(() => setConnectionError("channel_create_failed"), 0);
      clearTimeout(timeoutId);
      return;
    }

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();

        // Convert presence state to player list
        const presentUserIds = new Set<string>();
        let updatedPlayers = [...playersRef.current];

        for (const [key, presences] of Object.entries(state)) {
          presentUserIds.add(key);
          const p = presences[0] as unknown as PresencePayload;

          const existingIdx = updatedPlayers.findIndex((u) => u.id === key);
          if (existingIdx >= 0) {
            updatedPlayers[existingIdx].isOnline = true;
          } else {
            updatedPlayers.push({
              id: key,
              displayName: p.displayName,
              joinedAt: p.joinedAt,
              isHost: false, // will be calculated
              isOnline: true,
            });
          }

          // Clear any disconnect timer if they came back
          if (disconnectTimers.current[key]) {
            clearTimeout(disconnectTimers.current[key]);
            delete disconnectTimers.current[key];
          }
        }

        // Mark missing players as offline
        updatedPlayers = updatedPlayers.map((p) => {
          if (!presentUserIds.has(p.id) && p.isOnline) {
            // They just went offline
            if (!disconnectTimers.current[p.id]) {
              disconnectTimers.current[p.id] = setTimeout(() => {
                // Grace period expired, remove them completely
                setPlayers((current) => {
                  const filtered = current.filter((cp) => cp.id !== p.id);
                  return calculateHostMigration(filtered);
                });
                delete disconnectTimers.current[p.id];
              }, GRACE_PERIOD_MS);
            }
            return { ...p, isOnline: false };
          }
          return p;
        });

        // Recalculate Host (ADR-0001 §4)
        updatedPlayers = calculateHostMigration(updatedPlayers);

        setPlayers(updatedPlayers);

        // If we are the newly elected host, broadcast full state to ensure late joiners sync
        const me = updatedPlayers.find((p) => p.id === userId);
        if (me?.isHost) {
          channel.send({
            type: "broadcast",
            event: "full_state_sync",
            payload: { state: gameStateRef.current },
          });
        }
      })
      .on("broadcast", { event: "game_action" }, ({ payload }) => {
        if (payload?.action) {
          setGameState((prev) => reducer(prev, payload.action as TAction));
        }
      })
      .on("broadcast", { event: "full_state_sync" }, ({ payload }) => {
        if (payload?.state) {
          setGameState(payload.state as TState);
        }
      })
      .subscribe(async (status, err) => {
        console.log("[useRoomConnection] subscribe status:", status, err ?? "");
        if (status === "SUBSCRIBED") {
          clearTimeout(timeoutId);
          setConnectionError(null);
          setIsConnected(true);
          const presencePayload: PresencePayload = {
            userId,
            displayName,
            joinedAt: Date.now(),
          };
          await channel.track(presencePayload);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(timeoutId);
          setIsConnected(false);
          setConnectionError(status.toLowerCase());
        }
      });

    const activeTimers = disconnectTimers.current;

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      channel.unsubscribe();
      Object.values(activeTimers).forEach(clearTimeout);
    };
  }, [roomCode, userId, displayName, reducer]);

  return {
    players,
    gameState,
    isConnected,
    connectionError,
    dispatchAction,
  };
}
