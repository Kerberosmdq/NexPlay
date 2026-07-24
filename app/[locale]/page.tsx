"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { RoomLobby } from "@/components/platform/RoomLobby";
import { MultiDeviceRoom } from "@/components/platform/MultiDeviceRoom";
import {
  platformReducer,
  createInitialPlatformState,
  AVAILABLE_GAMES,
  type PlatformAction,
} from "@/lib/realtime/platformReducer";
import { recordEvent, recordGameResult } from "@/lib/analytics";

// Mirrors MultiDeviceRoom's TERMINAL_PHASE_BY_GAME — see the comment there
// for why this per-game lookup exists instead of a generic contract field.
const TERMINAL_PHASE_BY_GAME: Record<string, string> = {
  placeholder: "results",
  impostor: "resolution",
};

export default function HomePage() {
  const [session, setSession] = useState<{
    mode: "single-device" | "multi-device";
    role: "host" | "player";
    roomCode: string;
    userId: string;
    displayName: string;
  } | null>(null);

  const [platformState, setPlatformState] = useState(createInitialPlatformState());

  const handleStartSingleDevice = (displayName: string) => {
    setSession({
      mode: "single-device",
      role: "host",
      roomCode: "LOCAL",
      userId: "user-local",
      displayName,
    });
    setPlatformState(createInitialPlatformState());
  };

  const handleCreateRoom = (displayName: string, code: string) => {
    const userId = `host-${Math.random().toString(36).substr(2, 9)}`; // Temporary anonymous ID logic
    setSession({
      mode: "multi-device",
      role: "host",
      roomCode: code,
      userId,
      displayName,
    });
    recordEvent({ event_name: "room_created", mode: "multi-device" });
  };

  const handleJoinRoom = (displayName: string, code: string) => {
    setSession({
      mode: "multi-device",
      role: "player",
      roomCode: code,
      userId: `player-${Math.random().toString(36).substr(2, 9)}`, // Temporary anonymous ID logic
      displayName,
    });
  };

  const dispatchAction = (action: PlatformAction) => {
    setPlatformState((prev) => platformReducer(prev, action));
  };

  const singleDeviceRoundStartedAt = useRef<number | null>(null);
  const hasRecordedSingleDeviceStart = useRef(false);
  const hasRecordedSingleDeviceFinish = useRef(false);

  useEffect(() => {
    if (session?.mode !== "single-device") return;

    if (platformState.status === "LOBBY") {
      hasRecordedSingleDeviceStart.current = false;
      hasRecordedSingleDeviceFinish.current = false;
      return;
    }

    const activeGameId = platformState.activeGameId;
    if (!activeGameId) return;

    if (!hasRecordedSingleDeviceStart.current) {
      hasRecordedSingleDeviceStart.current = true;
      singleDeviceRoundStartedAt.current = Date.now();
      recordEvent({
        event_name: "game_started",
        game_id: activeGameId,
        mode: "single-device",
      });
    }

    const terminalPhase = TERMINAL_PHASE_BY_GAME[activeGameId];
    const currentPhase = (platformState.gameState as { phase?: string } | null)?.phase;

    if (terminalPhase && currentPhase === terminalPhase && !hasRecordedSingleDeviceFinish.current) {
      hasRecordedSingleDeviceFinish.current = true;
      const durationSeconds = singleDeviceRoundStartedAt.current
        ? Math.round((Date.now() - singleDeviceRoundStartedAt.current) / 1000)
        : 0;
      recordGameResult({
        game_id: activeGameId,
        mode: "single-device",
        player_count: 1,
        duration_seconds: durationSeconds,
      });
      recordEvent({
        event_name: "game_finished",
        game_id: activeGameId,
        mode: "single-device",
      });
    }
  }, [platformState, session]);

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-transparent text-white">
        <RoomLobby
          onStartSingleDevice={handleStartSingleDevice}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-transparent text-white space-y-4">
      <div className="w-full max-w-md flex justify-between items-center px-2">
        <span className="text-xs text-slate-400">
          {session.displayName}
        </span>
        <button
          onClick={() => setSession(null)}
          className="text-xs text-red-400 hover:text-red-300 font-semibold"
        >
          ✕
        </button>
      </div>

      {session.mode === "single-device" && (
        <SingleDeviceGamePicker
          platformState={platformState}
          dispatch={dispatchAction}
          onExit={() => setSession(null)}
        />
      )}

      {session.mode === "multi-device" && (
        <MultiDeviceRoom
          roomCode={session.roomCode}
          userId={session.userId}
          displayName={session.displayName}
          role={session.role}
        />
      )}
    </main>
  );
}

function SingleDeviceGamePicker({
  platformState,
  dispatch,
  onExit,
}: {
  platformState: ReturnType<typeof createInitialPlatformState>;
  dispatch: (action: PlatformAction) => void;
  onExit: () => void;
}) {
  const t = useTranslations("Lobby");
  const tGame = useTranslations();

  if (platformState.status === "LOBBY") {
    return (
      <div className="w-full max-w-md space-y-4">
        <h3 className="text-2xl font-bold text-white text-center">{t("gamesLabel")}</h3>
        {Object.values(AVAILABLE_GAMES).map((game) => (
          <button
            key={game.id}
            onClick={() => dispatch({ type: "PLATFORM_START_GAME", gameId: game.id, players: [] })}
            className="w-full bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-pink-500/30 p-4 rounded-2xl text-white font-bold text-xl"
          >
            {tGame(game.meta.name)}
          </button>
        ))}
      </div>
    );
  }

  const activeGame = platformState.activeGameId ? AVAILABLE_GAMES[platformState.activeGameId] : null;
  if (!activeGame) return null;

  const gameDispatch = (action: unknown) => dispatch({ type: "GAME_ACTION", action });

  const View = activeGame.views.singleDevice;
  return <View state={platformState.gameState} players={[]} dispatch={gameDispatch} onExit={onExit} />;
}
