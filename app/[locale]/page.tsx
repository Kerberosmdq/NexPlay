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
import {
  saveRoomSession,
  loadRoomSession,
  clearRoomSession,
  rememberIdentity,
  getRememberedUserId,
  type RoomSession,
} from "@/lib/realtime/session";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { Button, Screen } from "@/components/ui";

// Mirrors MultiDeviceRoom's TERMINAL_PHASE_BY_GAME — see the comment there
// for why this per-game lookup exists instead of a generic contract field.
const TERMINAL_PHASE_BY_GAME: Record<string, string> = {
  impostor: "resolution",
  "who-am-i": "resolution",
};

export default function HomePage() {
  const t = useTranslations("Lobby");
  const [session, setSession] = useState<RoomSession | null>(null);

  // A family passes one phone around for a whole match — the screen
  // shouldn't lock mid-round. Only held while a session (lobby wait or
  // active game) is open, not on the entry screen.
  useWakeLock(session !== null);

  // On first load, silently rejoin whatever multi-device room this device
  // was last in — the fix for "the connection dropped and nobody wrote
  // down the room code." Single-device sessions aren't remembered; there's
  // no server-side room to rejoin and the local game state isn't persisted.
  useEffect(() => {
    // Deliberately deferred to an effect (not a lazy useState initializer)
    // so the server-rendered/first-hydration pass always renders the
    // lobby, then the client swaps in the remembered session right after —
    // reading localStorage during the initial render would produce a
    // client/server markup mismatch.
    const remembered = loadRoomSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (remembered) setSession(remembered);
  }, []);

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
    // Temporary anonymous ID logic — reuse this device's last identity for
    // this exact room code (if any) so an accidental exit-and-rejoin doesn't
    // orphan the player from the match's playerIds/aliveIds.
    const userId = getRememberedUserId(code) ?? `host-${Math.random().toString(36).substr(2, 9)}`;
    rememberIdentity(code, userId);
    const newSession: RoomSession = {
      mode: "multi-device",
      role: "host",
      roomCode: code,
      userId,
      displayName,
    };
    setSession(newSession);
    saveRoomSession(newSession);
    recordEvent({ event_name: "room_created", mode: "multi-device" });
  };

  const handleJoinRoom = (displayName: string, code: string) => {
    const userId = getRememberedUserId(code) ?? `player-${Math.random().toString(36).substr(2, 9)}`; // Temporary anonymous ID logic
    rememberIdentity(code, userId);
    const newSession: RoomSession = {
      mode: "multi-device",
      role: "player",
      roomCode: code,
      userId,
      displayName,
    };
    setSession(newSession);
    saveRoomSession(newSession);
  };

  const handleExit = () => {
    setSession(null);
    clearRoomSession();
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
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-transparent text-ink">
        <RoomLobby
          onStartSingleDevice={handleStartSingleDevice}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-transparent text-ink space-y-4">
      <Screen displayName={session.displayName} onExit={handleExit} exitLabel={t("exitLabel")}>
        {session.mode === "single-device" && (
          <SingleDeviceGamePicker
            platformState={platformState}
            dispatch={dispatchAction}
            onExit={handleExit}
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
      </Screen>
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
    // Not every game supports single-device pass-and-play (Battleship can't —
    // there's no way to hide a board between turns on one phone), so this
    // list must filter by meta.supportedModes rather than listing every
    // registered game unconditionally.
    const singleDeviceGames = Object.values(AVAILABLE_GAMES).filter((game) =>
      game.meta.supportedModes.includes("single-device")
    );
    return (
      <div className="w-full max-w-md space-y-4">
        <h3 className="font-display text-2xl text-ink text-center">{t("gamesLabel")}</h3>
        {singleDeviceGames.map((game) => (
          <Button
            key={game.id}
            variant="primary"
            onClick={() => dispatch({ type: "PLATFORM_START_GAME", gameId: game.id, players: [] })}
            className="text-xl"
          >
            {tGame(game.meta.name)}
          </Button>
        ))}
      </div>
    );
  }

  const activeGame = platformState.activeGameId ? AVAILABLE_GAMES[platformState.activeGameId] : null;
  if (!activeGame || !activeGame.views.singleDevice) return null;

  const gameDispatch = (action: unknown) => dispatch({ type: "GAME_ACTION", action });

  const View = activeGame.views.singleDevice;
  return <View state={platformState.gameState} players={[]} dispatch={gameDispatch} onExit={onExit} />;
}
