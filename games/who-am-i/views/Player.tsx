"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { WhoAmIState, WhoAmIAction } from "../reducer";
import { pickAssignments } from "../pickRound";
import { Button, Card, Scoreboard, WaitingState } from "@/components/ui";

interface PlayerProps {
  state: WhoAmIState;
  players: Player[];
  // Optional because this component also fills the `host` view slot, whose
  // contract doesn't guarantee a playerId — the platform passes it through
  // in practice, but we resolve a fallback below just in case.
  playerId?: string;
  roomCode: string;
  dispatch: (action: WhoAmIAction) => void;
}

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function PlayerView({ state, players, playerId: rawPlayerId, dispatch }: PlayerProps) {
  const t = useTranslations("WhoAmI");
  const tConfig = useTranslations("games.who-am-i.config");
  const locale = useLocale();

  const me = players.find((p) => p.id === rawPlayerId) ?? players.find((p) => p.isHost);
  const playerId = rawPlayerId ?? me?.id ?? "";
  const isHost = me?.isHost || false;
  const hasGuessed = state.guessedIds.includes(playerId);
  const hasLost = state.lostIds.includes(playerId);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (state.phase !== "playing" || state.roundEndsAt === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(null);
      return;
    }
    const tick = () => {
      const remaining = Math.round((state.roundEndsAt! - Date.now()) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0 && isHost) {
        dispatch({ type: "END_ROUND" });
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [state.phase, state.roundEndsAt, isHost, dispatch]);

  if (state.phase === "config") {
    if (isHost) {
      const notEnoughPlayers = players.length < 3;
      return (
        <Card className="flex flex-col items-center justify-center space-y-8 w-full max-w-2xl mx-auto">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight text-center">
            {t("config.title")}
          </h2>

          <div className="w-full space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="text-ink-muted font-bold">{tConfig("timerSeconds")}</label>
              <select
                className="bg-surface-sunken border-2 border-line text-ink p-4 rounded-xl font-semibold outline-none focus-visible:border-focus transition-colors"
                value={state.timerSeconds}
                onChange={(e) => dispatch({ type: "SET_CONFIG", timerSeconds: parseInt(e.target.value, 10) })}
              >
                <option value={180}>{tConfig("time3min")}</option>
                <option value={300}>{tConfig("time5min")}</option>
                <option value={420}>{tConfig("time7min")}</option>
                <option value={600}>{tConfig("time10min")}</option>
                <option value={0}>{tConfig("timeUnlimited")}</option>
              </select>
            </div>

            {notEnoughPlayers ? (
              <div className="bg-red-500/20 text-red-300 p-4 rounded-xl text-center font-bold border border-red-500/30">
                {t("config.notEnoughPlayers")}
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  const { assignments } = pickAssignments(players, locale, state.usedWordIds);
                  dispatch({
                    type: "START_GAME",
                    playerIds: players.map((p) => p.id),
                    assignments,
                    now: Date.now(),
                  });
                }}
                className="text-2xl py-6"
              >
                {t("config.startButton")}
              </Button>
            )}
          </div>
        </Card>
      );
    }

    return <WaitingState label={t("config.waitingForHost")} />;
  }

  if (state.phase === "playing") {
    const myWord = state.wordAssignments[playerId];

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto mt-4 px-4 text-center">
        <div className="text-3xl font-black text-ink">{timeLeft === null ? "∞" : formatTime(timeLeft)}</div>

        {hasGuessed ? (
          <div className="bg-green-900/30 border border-green-500/30 p-8 rounded-3xl text-center w-full space-y-3">
            <div className="text-5xl">🎉</div>
            <p className="text-green-300 font-bold text-lg">{t("playing.youGuessed")}</p>
            <p className="text-3xl font-black text-ink">
              {myWord?.emoji} {myWord?.word}
            </p>
            <p className="text-sm text-green-200/70">{t("playing.keepHelping")}</p>
          </div>
        ) : hasLost ? (
          <div className="bg-red-900/30 border border-red-500/30 p-8 rounded-3xl text-center w-full space-y-3">
            <div className="text-5xl">😬</div>
            <p className="text-red-300 font-bold text-lg">{t("playing.youLost")}</p>
            <p className="text-3xl font-black text-ink">
              {myWord?.emoji} {myWord?.word}
            </p>
            <p className="text-sm text-red-200/70">{t("playing.keepHelping")}</p>
          </div>
        ) : (
          <>
            <p className="text-ink-muted text-xs font-black uppercase tracking-widest">
              {t("playing.showEveryoneElse")}
            </p>

            <div className="w-full bg-surface-raised border-4 border-line rounded-3xl p-10 space-y-4">
              <div className="text-8xl">{myWord?.emoji}</div>
              <p className="text-4xl font-black text-ink">{myWord?.word}</p>
            </div>

            <div className="flex space-x-3 w-full">
              <button
                onClick={() => dispatch({ type: "GUESS_CORRECT", playerId })}
                className="flex-1 bg-green-500/20 border-2 border-green-500 text-green-300 font-black text-xl py-5 rounded-2xl"
              >
                {t("playing.correctButton")}
              </button>
              <button
                onClick={() => dispatch({ type: "GUESS_WRONG", playerId })}
                className="flex-1 bg-red-500/20 border-2 border-red-500 text-red-300 font-black text-xl py-5 rounded-2xl"
              >
                {t("playing.wrongButton")}
              </button>
            </div>
          </>
        )}

        {isHost && (
          <button onClick={() => dispatch({ type: "END_ROUND" })} className="text-xs text-ink-muted underline">
            {t("playing.endRoundButton")}
          </button>
        )}
      </div>
    );
  }

  if (state.phase === "resolution") {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2 className="text-3xl font-black text-ink text-center">{t("resolution.title")}</h2>

        <Card className="w-full space-y-3">
          <Scoreboard
            title={t("resolution.scoresTitle")}
            entries={players.map((p) => {
              const word = state.wordAssignments[p.id];
              const guessedIt = state.guessedIds.includes(p.id);
              return {
                id: p.id,
                icon: <span className="text-xl">{guessedIt ? "✅" : "❌"}</span>,
                label: (
                  <>
                    <span className="text-lg font-bold text-ink truncate max-w-[100px]">{p.displayName}</span>
                    <span className="text-ink-muted text-sm ml-2">
                      {word?.emoji} {word?.word}
                    </span>
                  </>
                ),
                value: <span className="text-xl font-black text-yellow-400">{state.scores[p.id] || 0} pts</span>,
              };
            })}
          />
        </Card>

        {isHost && (
          <Button variant="ghost" onClick={() => dispatch({ type: "PLAY_AGAIN" })} className="px-12">
            {t("resolution.nextRoundButton")}
          </Button>
        )}
      </div>
    );
  }

  return null;
}
