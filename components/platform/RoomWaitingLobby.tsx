"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";
import { AVAILABLE_GAMES } from "@/lib/realtime/platformReducer";
import { Button, PlayerChip, ShareCode } from "@/components/ui";
import { HowToPlayButton } from "./HowToPlay";
import { GameIcon, gameBlockClasses } from "./GameIcon";

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

  // Accordion, not N stacked full cards: with a 4th game (and more queued in
  // BACKLOG.md) the old layout grew one full card per game indefinitely.
  // Collapsed by default; opening one closes whichever was open — never more
  // than one game's description/buttons on screen at a time.
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full">
      {/* ROOM CODE HEADER — the code as yellow keycaps (BDR-0002 §7), read
          out as one word by screen readers. */}
      <div className="text-center space-y-3">
        <h2 className="text-lg text-ink-muted font-bold">{t("roomCodeLabel")}</h2>
        <div className="flex justify-center gap-2.5" aria-live="polite" aria-label={roomCode} role="img">
          {roomCode.split("").map((char, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="font-display text-5xl w-16 h-[4.5rem] flex items-center justify-center rounded-2xl bg-action-secondary text-on-secondary shadow-[0_var(--edge-md)_0_var(--color-edge-secondary)]"
            >
              {char}
            </span>
          ))}
        </div>
        <p className="text-base text-ink-muted pt-3">{t("shareHint")}</p>
        <div className="pt-2">
          <ShareCode roomCode={roomCode} />
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* PLAYERS LIST */}
        <div className="w-full space-y-4">
          <h3 className="font-display text-2xl text-ink flex items-center justify-between">
            {t("playersLabel")}
            <span className="text-on-primary bg-action-primary px-3 py-0.5 rounded-xl text-lg shadow-[0_var(--edge-sm)_0_var(--color-edge-primary)]">
              {players.length}
            </span>
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {players.map((p) => (
              <PlayerChip key={p.id} player={p} variant="list" />
            ))}
          </div>
        </div>

        {/* GAME SELECTION */}
        <div className="w-full flex flex-col">
          <h3 className="font-display text-2xl text-ink mb-4">{t("gamesLabel")}</h3>

          <div className="flex-1 space-y-4">
            {Object.values(AVAILABLE_GAMES).map((game) => {
              const isExpanded = expandedGameId === game.id;
              const headerId = `game-accordion-header-${game.id}`;
              const panelId = `game-accordion-panel-${game.id}`;

              return (
                <div key={game.id} className="bg-surface-sunken rounded-2xl">
                  <button
                    id={headerId}
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    onClick={() => setExpandedGameId(isExpanded ? null : game.id)}
                    className={`w-full min-h-14 flex items-center gap-3 px-4 py-3 text-left rounded-2xl focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus ${gameBlockClasses(game.id)}`}
                  >
                    <GameIcon gameId={game.id} size={36} className="shrink-0" />
                    <h4 className="font-display text-xl flex-1">{tGame(game.meta.name)}</h4>
                    <span className="text-lg shrink-0 pl-2" aria-hidden="true">
                      {isExpanded ? "▾" : "▸"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                      className="motion-deal px-4 pt-4 pb-3 flex flex-col"
                    >
                      <p className="text-base text-ink-muted mb-3">{tGame(`games.${game.id}.description`)}</p>
                      <div className="mb-4">
                        <HowToPlayButton gameId={game.id} />
                      </div>

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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
