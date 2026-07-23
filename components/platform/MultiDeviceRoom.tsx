"use client";

import { useRoomConnection } from "@/lib/realtime/hooks/useRoomConnection";
import { placeholderGameModule } from "@/games/placeholder/module";
import { HostView } from "@/games/placeholder/views/Host";
import { PlayerView } from "@/games/placeholder/views/Player";

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
