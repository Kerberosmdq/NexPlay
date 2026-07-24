"use client";

import { useEffect, useRef, useState } from "react";
import { RoomLobby } from "@/components/platform/RoomLobby";
import { MultiDeviceRoom } from "@/components/platform/MultiDeviceRoom";
import { placeholderGameModule } from "@/games/placeholder/module";
import type { PlaceholderAction, PlaceholderState } from "@/games/placeholder/reducer";
import { SingleDeviceView } from "@/games/placeholder/views/SingleDevice";
import { recordEvent, recordGameResult } from "@/lib/analytics";

export default function HomePage() {
  const [session, setSession] = useState<{
    mode: "single-device" | "multi-device";
    role: "host" | "player";
    roomCode: string;
    userId: string;
    displayName: string;
  } | null>(null);

  const [gameState, setGameState] = useState<PlaceholderState>(
    placeholderGameModule.setup([], { initialCount: 0 })
  );

  const handleStartSingleDevice = (displayName: string) => {
    setSession({
      mode: "single-device",
      role: "host",
      roomCode: "LOCAL",
      userId: "user-local",
      displayName,
    });
    setGameState(placeholderGameModule.setup([], { initialCount: 0 }));
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
    recordEvent({ event_name: "room_created", mode: "multi-device", user_id: userId });
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

  const dispatchAction = (action: PlaceholderAction) => {
    setGameState((prevState) => placeholderGameModule.reducer(prevState, action));
  };

  const singleDeviceRoundStartedAt = useRef<number | null>(null);
  const hasRecordedSingleDeviceStart = useRef(false);
  const hasRecordedSingleDeviceFinish = useRef(false);

  useEffect(() => {
    if (session?.mode !== "single-device") return;

    if (gameState.phase === "in-round" && !hasRecordedSingleDeviceStart.current) {
      hasRecordedSingleDeviceStart.current = true;
      singleDeviceRoundStartedAt.current = Date.now();
      recordEvent({
        event_name: "game_started",
        game_id: placeholderGameModule.id,
        mode: "single-device",
        user_id: session.userId,
      });
    }

    if (gameState.phase === "results" && !hasRecordedSingleDeviceFinish.current) {
      hasRecordedSingleDeviceFinish.current = true;
      const durationSeconds = singleDeviceRoundStartedAt.current
        ? Math.round((Date.now() - singleDeviceRoundStartedAt.current) / 1000)
        : 0;
      recordGameResult({
        game_id: placeholderGameModule.id,
        mode: "single-device",
        player_count: 1,
        duration_seconds: durationSeconds,
      });
      recordEvent({
        event_name: "game_finished",
        game_id: placeholderGameModule.id,
        mode: "single-device",
        user_id: session.userId,
      });
    }

    if (gameState.phase === "lobby") {
      hasRecordedSingleDeviceStart.current = false;
      hasRecordedSingleDeviceFinish.current = false;
    }
  }, [gameState.phase, session]);

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
          Hola, <strong className="text-white">{session.displayName}</strong>
        </span>
        <button
          onClick={() => setSession(null)}
          className="text-xs text-red-400 hover:text-red-300 font-semibold"
        >
          ✕ Salir de Sala
        </button>
      </div>

      {session.mode === "single-device" && (
        <SingleDeviceView
          state={gameState}
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
