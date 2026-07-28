"use client";

import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";
import { AVAILABLE_GAMES } from "@/lib/realtime/platformReducer";
import { Button, Card, PlayerChip, ShareCode } from "@/components/ui";

interface RoomWaitingLobbyProps {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  onStartGame: (gameId: string) => void;
  // M4d: only offered for a game whose module implements `getWinner` (a
  // 1-vs-1 bracket needs a way to know who won each match) and only once
  // there are enough players for a real bracket, not just a normal match.
  onStartTournament: (gameId: string) => void;
}

const MIN_TOURNAMENT_PLAYERS = 3;

export function RoomWaitingLobby({ roomCode, players, isHost, onStartGame, onStartTournament }: RoomWaitingLobbyProps) {
  const t = useTranslations("Lobby");
  // meta.name is an i18n key (ADR-0002 §3); a game's description follows the
  // sibling convention `games.<id>.description` in the same catalog.
  const tGame = useTranslations();

  return (
    <div className="flex flex-col items-center justify-center space-y-12 w-full max-w-4xl px-4">
      {/* ROOM CODE HEADER */}
      <div className="text-center space-y-2">
        <h2 className="text-xl text-ink-muted font-bold tracking-widest uppercase">{t("roomCodeLabel")}</h2>
        <div
          className="font-mono text-7xl font-bold text-ink tracking-widest bg-surface-raised px-12 py-4 rounded-3xl border-2 border-line"
          aria-live="polite"
        >
          {roomCode}
        </div>
        <p className="text-sm text-ink-muted pt-2">{t("shareHint")}</p>
        <div className="pt-2">
          <ShareCode roomCode={roomCode} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* PLAYERS LIST */}
        <Card className="space-y-4">
          <h3 className="font-display text-2xl text-ink flex items-center justify-between">
            {t("playersLabel")}
            <span className="font-sans text-on-primary bg-action-primary px-3 py-1 rounded-full text-sm">
              {players.length}
            </span>
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {players.map((p) => (
              <PlayerChip key={p.id} player={p} variant="list" />
            ))}
          </div>
        </Card>

        {/* GAME SELECTION */}
        <Card className="flex flex-col">
          <h3 className="font-display text-2xl text-ink mb-4">{t("gamesLabel")}</h3>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {Object.values(AVAILABLE_GAMES).map((game) => (
              <div
                key={game.id}
                className="bg-surface-sunken border border-line p-4 rounded-2xl flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-display text-xl text-ink">{tGame(game.meta.name)}</h4>
                </div>
                <p className="text-sm text-ink-muted mb-4 flex-1">
                  {tGame(`games.${game.id}.description`)}
                </p>

                {isHost ? (
                  <div className="flex flex-col gap-2">
                    <Button variant="primary" onClick={() => onStartGame(game.id)}>
                      {t("playThisButton")}
                    </Button>
                    {game.getWinner && players.length >= MIN_TOURNAMENT_PLAYERS && (
                      <Button variant="ghost" onClick={() => onStartTournament(game.id)}>
                        {t("startTournamentButton")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="w-full bg-surface-well text-ink-muted text-center font-bold py-3 rounded-xl">
                    {t("hostOnlyHint")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
