"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRoomConnection } from "@/lib/realtime/hooks/useRoomConnection";
import { RoomWaitingLobby } from "./RoomWaitingLobby";
import {
  platformReducer,
  createInitialPlatformState,
  AVAILABLE_GAMES,
  type PlatformAction,
} from "@/lib/realtime/platformReducer";
import { recordEvent, recordGameResult } from "@/lib/analytics";

interface MultiDeviceRoomProps {
  roomCode: string;
  userId: string;
  displayName: string;
  role: "host" | "player";
}

// Each game defines its own internal phase names (ADR-0002 §2 only mandates
// the shared lifecycle conceptually, not a literal shared field). Until the
// contract grows a formal "is this the results phase" signal, the platform
// tracks the terminal phase per game id here for analytics purposes only —
// this does not affect gameplay, just when a game_results/game_finished
// event fires. Follow-up: consider adding this to GameModule (ADR-0002) if a
// third game needs it too.
const TERMINAL_PHASE_BY_GAME: Record<string, string> = {
  placeholder: "results",
  impostor: "resolution",
};

export function MultiDeviceRoom({ roomCode, userId, displayName, role }: MultiDeviceRoomProps) {
  const t = useTranslations("Lobby");
  const { players, gameState, dispatchAction, isConnected } = useRoomConnection({
    roomCode,
    userId,
    displayName,
    initialState: createInitialPlatformState(),
    reducer: platformReducer,
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

    if (gameState.status === "LOBBY") {
      hasRecordedStart.current = false;
      hasRecordedFinish.current = false;
      return;
    }

    const activeGameId = gameState.activeGameId;
    if (!activeGameId) return;

    if (!hasRecordedStart.current) {
      hasRecordedStart.current = true;
      roundStartedAt.current = Date.now();
      recordEvent({
        event_name: "game_started",
        game_id: activeGameId,
        mode: "multi-device",
        player_count: players.length,
      });
    }

    const terminalPhase = TERMINAL_PHASE_BY_GAME[activeGameId];
    const currentPhase = (gameState.gameState as { phase?: string } | null)?.phase;

    if (terminalPhase && currentPhase === terminalPhase && !hasRecordedFinish.current) {
      hasRecordedFinish.current = true;
      const durationSeconds = roundStartedAt.current
        ? Math.round((Date.now() - roundStartedAt.current) / 1000)
        : 0;
      recordGameResult({
        game_id: activeGameId,
        mode: "multi-device",
        player_count: players.length,
        duration_seconds: durationSeconds,
      });
      recordEvent({
        event_name: "game_finished",
        game_id: activeGameId,
        mode: "multi-device",
        player_count: players.length,
      });
    }
  }, [gameState, isHost, players.length]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin text-4xl">⏳</div>
        <p className="text-xl">{t("connecting")}</p>
      </div>
    );
  }

  if (gameState.status === "LOBBY") {
    return (
      <RoomWaitingLobby
        roomCode={roomCode}
        players={players}
        isHost={isHost}
        onStartGame={(gameId) => {
          dispatchAction({
            type: "PLATFORM_START_GAME",
            gameId,
            players, // Pass current players to setup the game
          });
        }}
      />
    );
  }

  const activeGame = gameState.activeGameId ? AVAILABLE_GAMES[gameState.activeGameId] : null;

  if (!activeGame) {
    return <div className="text-red-500 font-bold">Error: Juego no encontrado.</div>;
  }

  const gameDispatch = (action: unknown) => {
    dispatchAction({ type: "GAME_ACTION", action } as PlatformAction);
  };

  const View = isHost ? activeGame.views.host : activeGame.views.player;

  return (
    <View
      state={gameState.gameState}
      players={players}
      playerId={userId}
      roomCode={roomCode}
      dispatch={gameDispatch}
    />
  );
}
