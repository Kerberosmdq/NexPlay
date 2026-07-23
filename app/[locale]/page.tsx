"use client";

import { useState } from "react";
import { RoomLobby } from "@/components/platform/RoomLobby";
import { placeholderGameModule } from "@/games/placeholder/module";
import type { PlaceholderAction, PlaceholderState } from "@/games/placeholder/reducer";
import { HostView } from "@/games/placeholder/views/Host";
import { PlayerView } from "@/games/placeholder/views/Player";
import { SingleDeviceView } from "@/games/placeholder/views/SingleDevice";
import type { Player } from "@/lib/types/room";

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

  const [players, setPlayers] = useState<Player[]>([]);

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
    const hostUser: Player = {
      id: "user-host-1",
      displayName,
      isHost: true,
      joinedAt: Date.now(),
      isOnline: true,
    };

    setSession({
      mode: "multi-device",
      role: "host",
      roomCode: code,
      userId: hostUser.id,
      displayName,
    });

    setPlayers([hostUser]);
    setGameState(placeholderGameModule.setup([hostUser], { initialCount: 0 }));
  };

  const handleJoinRoom = (displayName: string, code: string) => {
    const playerUser: Player = {
      id: "user-player-2",
      displayName,
      isHost: false,
      joinedAt: Date.now(),
      isOnline: true,
    };

    const hostUser: Player = {
      id: "user-host-1",
      displayName: "Anfitrión Demo",
      isHost: true,
      joinedAt: Date.now() - 5000,
      isOnline: true,
    };

    setSession({
      mode: "multi-device",
      role: "player",
      roomCode: code,
      userId: playerUser.id,
      displayName,
    });

    setPlayers([hostUser, playerUser]);
    setGameState(placeholderGameModule.setup([hostUser, playerUser], { initialCount: 0 }));
  };

  const dispatchAction = (action: PlaceholderAction) => {
    setGameState((prevState) => placeholderGameModule.reducer(prevState, action));
  };

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

      {session.mode === "multi-device" && session.role === "host" && (
        <HostView
          state={gameState}
          players={players}
          roomCode={session.roomCode}
          dispatch={dispatchAction}
        />
      )}

      {session.mode === "multi-device" && session.role === "player" && (
        <PlayerView
          state={gameState}
          playerId={session.userId}
          roomCode={session.roomCode}
          dispatch={dispatchAction}
        />
      )}
    </main>
  );
}
