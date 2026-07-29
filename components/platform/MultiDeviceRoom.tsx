"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRoomConnection } from "@/lib/realtime/hooks/useRoomConnection";
import { usePrivateState, useAnswerPending } from "@/lib/realtime/privateState";
import { RoomWaitingLobby } from "./RoomWaitingLobby";
import { TournamentBracket } from "./TournamentBracket";
import { MatchResolvedModal } from "./MatchResolvedModal";
import {
  platformReducer,
  createInitialPlatformState,
  getActiveMatchWinners,
  AVAILABLE_GAMES,
  type PlatformAction,
} from "@/lib/realtime/platformReducer";
import { recordEvent, recordGameResult } from "@/lib/analytics";
import { Button, WaitingState } from "@/components/ui";

/** Fisher-Yates — `Math.random()` stays out of the reducer, same rule as
 * `games/battleship/placement.ts`'s `randomFleetPlacement`; the shuffled
 * roster is what gets passed into `PLATFORM_START_TOURNAMENT`. */
function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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
  impostor: "resolution",
  "who-am-i": "resolution",
  battleship: "resolution",
};

export function MultiDeviceRoom({ roomCode, userId, displayName, role }: MultiDeviceRoomProps) {
  const t = useTranslations("Lobby");
  const { players, gameState, dispatchAction, isConnected, connectionError } = useRoomConnection({
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

  const activeGame = gameState.activeGameId ? AVAILABLE_GAMES[gameState.activeGameId] : null;

  // ADR-0005: this device's private slice, and the driver that answers a
  // pending request when this device (not necessarily the acting player)
  // holds the relevant secret. Both must run on every render regardless of
  // connection/lobby/game phase — calling hooks after the early returns
  // below would violate the Rules of Hooks. `activeGame?.id ?? "none"` keys
  // the slice to "no game yet" while still in the lobby; usePrivateState
  // re-initializes automatically once that key changes to a real game id.
  const [privateState, setPrivateState] = usePrivateState(
    roomCode,
    activeGame?.id ?? "none",
    userId,
    () => (activeGame?.setupPrivate ? activeGame.setupPrivate(userId, gameState.gameState) : undefined)
  );

  useAnswerPending(gameState.gameState, privateState, userId, activeGame?.answerPending, (action: unknown) =>
    dispatchAction({ type: "GAME_ACTION", action } as PlatformAction)
  );

  // Founder feedback (2026-07-28): a match used to advance the tournament
  // (or return to lobby) the instant it resolved, with no pause — nobody
  // got to see the final board or how the match was won. `MatchResolvedModal`
  // below now gates that same action behind an explicit host confirmation,
  // for both tournament and standalone matches.
  const activeMatchWinners = getActiveMatchWinners(gameState);

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

  if (connectionError) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm px-4">
        <div className="text-4xl">⚠️</div>
        <p className="text-xl font-bold text-action-danger">{t("connectionError")}</p>
        <p className="text-sm text-ink-muted">{connectionError}</p>
        <Button variant="ghost" fullWidth={false} onClick={() => window.location.reload()} className="px-6">
          {t("retryButton")}
        </Button>
      </div>
    );
  }

  if (!isConnected) {
    return <WaitingState label={t("connecting")} />;
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
        onStartTournament={(gameId) => {
          dispatchAction({
            type: "PLATFORM_START_TOURNAMENT",
            gameId,
            shuffledPlayers: shuffled(players),
          });
        }}
      />
    );
  }

  if (gameState.status === "TOURNAMENT_COMPLETE") {
    return (
      <TournamentBracket
        tournament={gameState.tournament}
        players={players}
        onReturnToLobby={isHost ? () => dispatchAction({ type: "PLATFORM_RETURN_LOBBY" }) : undefined}
      />
    );
  }

  if (!activeGame) {
    return <div className="text-action-danger font-bold">Error: Juego no encontrado.</div>;
  }

  // M4d: while a tournament is running, a player not in the currently
  // playing match sees the bracket status instead of a frozen/blank game
  // view (ADR-0005 §5's "absence must be visible" spirit, applied here to
  // "you're not in this match either").
  const currentMatch = gameState.tournament
    ? gameState.tournament.rounds[gameState.tournament.rounds.length - 1].find((m) => m.winner === null)
    : null;
  const isMatchParticipant = !currentMatch || currentMatch.playerA === userId || currentMatch.playerB === userId;

  const handleContinueAfterMatch = () => {
    if (gameState.tournament) {
      dispatchAction({ type: "PLATFORM_ADVANCE_TOURNAMENT", winnerId: activeMatchWinners![0], players });
    } else {
      dispatchAction({ type: "PLATFORM_RETURN_LOBBY" });
    }
  };

  if (!isMatchParticipant) {
    // The host might have a bye and never be a participant in the
    // currently-playing match — they're still the only device allowed to
    // advance the tournament, so they need the modal here too, not just on
    // the match-participant view below (found live: without this, a
    // bye'd host had no way to ever click through, and the bracket sat
    // stuck on the just-resolved match forever).
    return (
      <>
        <MatchResolvedModal
          gameState={gameState.gameState}
          winners={activeMatchWinners}
          canContinue={isHost}
          onContinue={handleContinueAfterMatch}
        />
        <TournamentBracket tournament={gameState.tournament} players={players} />
      </>
    );
  }

  const gameDispatch = (action: unknown) => {
    dispatchAction({ type: "GAME_ACTION", action } as PlatformAction);
  };

  const View = isHost ? activeGame.views.host : activeGame.views.player;

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {isHost && (
        <div className="w-full max-w-md flex justify-end px-2">
          <Button
            variant="ghost"
            fullWidth={false}
            className="px-4"
            onClick={() => dispatchAction({ type: "PLATFORM_RETURN_LOBBY" })}
          >
            {t("returnToLobbyButton")}
          </Button>
        </div>
      )}
      <MatchResolvedModal
        gameState={gameState.gameState}
        winners={activeMatchWinners}
        canContinue={isHost}
        onContinue={handleContinueAfterMatch}
      />
      <View
        state={gameState.gameState}
        players={players}
        playerId={userId}
        roomCode={roomCode}
        dispatch={gameDispatch}
        privateState={privateState}
        setPrivateState={setPrivateState}
      />
    </div>
  );
}
