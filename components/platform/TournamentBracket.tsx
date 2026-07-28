"use client";

import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { TournamentState } from "@/lib/realtime/platformReducer";
import { Button, Card } from "@/components/ui";

interface TournamentBracketProps {
  tournament: TournamentState | null;
  players: Player[];
  // Host-only, and only meaningful once `tournament.champion` is set —
  // undefined otherwise (no button rendered), same optional-callback
  // pattern the rest of the platform components already use.
  onReturnToLobby?: () => void;
}

/** M4d: shown to a player who isn't part of the currently playing match
 * (ADR-0005 §5's "absence must be visible" spirit — you're not frozen, here's
 * what's happening) and, once a champion is decided, to everyone. Platform
 * component, not inside any game's folder, since a bracket applies to any
 * two-side game. */
export function TournamentBracket({ tournament, players, onReturnToLobby }: TournamentBracketProps) {
  const t = useTranslations("Lobby");
  const nameFor = (id: string) => players.find((p) => p.id === id)?.displayName ?? id;

  if (!tournament) return null;

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
      <h2 className="font-display text-2xl text-ink text-center">{t("tournamentBracketTitle")}</h2>

      {tournament.champion ? (
        <Card className="w-full text-center space-y-2 motion-celebrate">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">{t("tournamentChampionLabel")}</p>
          <p className="font-display text-3xl text-action-primary">{nameFor(tournament.champion)}</p>
        </Card>
      ) : (
        <p className="text-sm text-ink-muted text-center">{t("tournamentWatchingHint")}</p>
      )}

      <div className="w-full space-y-4">
        {tournament.rounds.map((round, roundIndex) => (
          <Card key={roundIndex} className="w-full space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
              {t("tournamentRoundLabel", { round: roundIndex + 1 })}
            </p>
            {round.map((match) => {
              const isCurrent = match.winner === null;
              return (
                <div
                  key={`${match.round}-${match.slotInRound}`}
                  className={`flex items-center justify-between gap-2 text-sm rounded-xl px-3 py-2 ${
                    isCurrent ? "bg-surface-sunken border border-line" : ""
                  }`}
                >
                  <span className={match.winner === match.playerA ? "font-bold text-ink" : "text-ink-muted"}>
                    {nameFor(match.playerA)}
                  </span>
                  <span className="text-ink-muted text-xs shrink-0">
                    {match.playerB === null ? t("tournamentByeLabel") : isCurrent ? t("tournamentVsLabel") : "→"}
                  </span>
                  <span
                    className={
                      match.playerB && match.winner === match.playerB ? "font-bold text-ink" : "text-ink-muted"
                    }
                  >
                    {match.playerB ? nameFor(match.playerB) : "—"}
                  </span>
                </div>
              );
            })}
          </Card>
        ))}
      </div>

      {onReturnToLobby && (
        <Button variant="ghost" onClick={onReturnToLobby} className="max-w-xs">
          {t("returnToLobbyButton")}
        </Button>
      )}
    </div>
  );
}
