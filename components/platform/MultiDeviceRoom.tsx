"use client";

import { useEffect, useRef } from "react";
import { useRoomConnection } from "@/lib/realtime/hooks/useRoomConnection";
import { placeholderGameModule } from "@/games/placeholder/module";
import { HostView } from "@/games/placeholder/views/Host";
import { PlayerView } from "@/games/placeholder/views/Player";
import { recordEvent, recordGameResult } from "@/lib/analytics";

interface MultiDeviceRoomProps {
  roomCode: string;
  userId: string;
  displayName: string;
  role: "host" | "player";
}

export function MultiDeviceRoom({ roomCode, userId, displayName, role }: MultiDeviceRoomProps) {
  const { players, gameState, dispatchAction, isConnected } = useRoomConnection({
    roomCode,
    userId,
    displayName,
    initialState: placeholderGameModule.setup([], { initialCount: 0 }),
    reducer: placeholderGameModule.reducer,
  });

  // Calculate actual role based on the sync'd players state, not just initial session role,
  // to handle Host Migration if the host reconnects or drops.
  const me = players.find((p) => p.id === userId);
  const isHost = me?.isHost ?? (role === "host");

  // Only the host records durable analytics, so a multi-device room emits
  // one row per lifecycle event rather than one per connected phone.
  const roundStartedAt = useRef<number | null>(null);
  const hasRecordedStart = useRef(false);
  const hasRecordedFinish = useRef(false);

  useEffect(() => {
    if (!isHost) return;

    if (gameState.phase === "in-round" && !hasRecordedStart.current) {
      hasRecordedStart.current = true;
      roundStartedAt.current = Date.now();
      recordEvent({
        event_name: "game_started",
        game_id: placeholderGameModule.id,
        mode: "multi-device",
        player_count: players.length,
        user_id: userId,
      });
    }

    if (gameState.phase === "results" && !hasRecordedFinish.current) {
      hasRecordedFinish.current = true;
      const durationSeconds = roundStartedAt.current
        ? Math.round((Date.now() - roundStartedAt.current) / 1000)
        : 0;
      recordGameResult({
        game_id: placeholderGameModule.id,
        mode: "multi-device",
        player_count: players.length,
        duration_seconds: durationSeconds,
      });
      recordEvent({
        event_name: "game_finished",
        game_id: placeholderGameModule.id,
        mode: "multi-device",
        player_count: players.length,
        user_id: userId,
      });
    }
  }, [gameState.phase, isHost, players.length, userId]);

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center h-64 text-purple-300">
        <p className="animate-pulse font-bold tracking-widest text-sm">CONECTANDO A LA SALA...</p>
      </div>
    );
  }

  if (isHost) {
    return (
      <HostView
        state={gameState}
        players={players}
        roomCode={roomCode}
        dispatch={dispatchAction}
      />
    );
  }

  return (
    <PlayerView
      state={gameState}
      playerId={userId}
      roomCode={roomCode}
      dispatch={dispatchAction}
    />
  );
}
