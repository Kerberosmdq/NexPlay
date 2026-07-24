"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { WhoAmIState, WhoAmIAction } from "../reducer";
import { pickAssignmentsAndTurnOrder } from "../pickRound";

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

  const [confirmingGuess, setConfirmingGuess] = useState(false);
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
        <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-2xl mx-auto bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight text-center">
            {t("config.title")}
          </h2>

          <div className="w-full space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="text-purple-200 font-bold">{tConfig("timerSeconds")}</label>
              <select
                className="bg-[#13072b] border-2 border-[#3b177d] text-white p-4 rounded-xl font-semibold outline-none focus:border-pink-500 transition-colors"
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
              <button
                onClick={() => {
                  const { assignments, turnOrder } = pickAssignmentsAndTurnOrder(players, locale, state.usedWordIds);
                  dispatch({
                    type: "START_GAME",
                    playerIds: players.map((p) => p.id),
                    assignments,
                    turnOrder,
                    now: Date.now(),
                  });
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-2xl py-6 rounded-2xl shadow-[0_0_40px_rgba(236,72,153,0.4)] transform hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t("config.startButton")}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center mt-20">
        <div className="animate-spin text-4xl">⏳</div>
        <p className="text-xl text-purple-200">{t("config.waitingForHost")}</p>
      </div>
    );
  }

  if (state.phase === "playing") {
    const currentAsker = players.find((p) => p.id === state.turnOrder[state.turnIndex]);
    const isMyTurn = currentAsker?.id === playerId;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <div className="text-3xl font-black text-white">
          {timeLeft === null ? "∞" : formatTime(timeLeft)}
        </div>

        <div className="w-full bg-black/20 rounded-2xl border border-white/10 p-4 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">
            {t("playing.othersTitle")}
          </p>
          {players
            .filter((p) => p.id !== playerId)
            .map((p) => {
              const word = state.wordAssignments[p.id];
              return (
                <div key={p.id} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl">
                  <span className="font-bold text-white">{p.displayName}</span>
                  <span className="text-lg">
                    {word?.emoji} {word?.word}
                  </span>
                </div>
              );
            })}
        </div>

        {hasGuessed ? (
          <div className="bg-green-900/30 border border-green-500/30 p-6 rounded-2xl text-center w-full space-y-2">
            <div className="text-4xl">🎉</div>
            <p className="text-green-300 font-bold">{t("playing.youGuessed")}</p>
            <p className="text-2xl font-black text-white">
              {state.wordAssignments[playerId]?.emoji} {state.wordAssignments[playerId]?.word}
            </p>
            <p className="text-sm text-green-200/70">{t("playing.keepHelping")}</p>
          </div>
        ) : (
          <>
            <p className="text-purple-200 text-center">
              {isMyTurn ? t("playing.yourTurn") : t("playing.waitingForTurn", { name: currentAsker?.displayName ?? "" })}
            </p>

            {isMyTurn && (
              <button
                onClick={() => dispatch({ type: "NEXT_TURN" })}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl"
              >
                {t("playing.doneAskingButton")}
              </button>
            )}

            {!confirmingGuess ? (
              <button
                onClick={() => setConfirmingGuess(true)}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xl py-5 rounded-2xl"
              >
                {t("playing.guessButton")}
              </button>
            ) : (
              <div className="w-full space-y-3 bg-black/20 p-4 rounded-2xl border border-white/10">
                <p className="text-center text-white font-semibold">{t("playing.confirmPrompt")}</p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setConfirmingGuess(false);
                      dispatch({ type: "GUESS_CORRECT", playerId });
                    }}
                    className="flex-1 bg-green-500/20 border-2 border-green-500 text-green-300 font-bold py-3 rounded-xl"
                  >
                    {t("playing.correctButton")}
                  </button>
                  <button
                    onClick={() => setConfirmingGuess(false)}
                    className="flex-1 bg-red-500/20 border-2 border-red-500 text-red-300 font-bold py-3 rounded-xl"
                  >
                    {t("playing.wrongButton")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {isHost && (
          <button
            onClick={() => dispatch({ type: "END_ROUND" })}
            className="text-xs text-purple-300 underline"
          >
            {t("playing.endRoundButton")}
          </button>
        )}
      </div>
    );
  }

  if (state.phase === "resolution") {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2 className="text-3xl font-black text-white text-center">{t("resolution.title")}</h2>

        <div className="w-full bg-white/10 rounded-3xl p-6 backdrop-blur-md space-y-3">
          <h3 className="text-xl font-bold text-purple-300 mb-4 border-b border-white/10 pb-2">
            {t("resolution.scoresTitle")}
          </h3>
          {players.map((p) => {
            const word = state.wordAssignments[p.id];
            const guessedIt = state.guessedIds.includes(p.id);
            return (
              <div key={p.id} className="flex justify-between items-center bg-black/20 p-3 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{guessedIt ? "✅" : "❌"}</span>
                  <span className="text-lg font-bold text-white truncate max-w-[100px]">{p.displayName}</span>
                  <span className="text-white/60 text-sm">
                    {word?.emoji} {word?.word}
                  </span>
                </div>
                <span className="text-xl font-black text-yellow-400">{state.scores[p.id] || 0} pts</span>
              </div>
            );
          })}
        </div>

        {isHost && (
          <button
            onClick={() => dispatch({ type: "PLAY_AGAIN" })}
            className="w-full bg-white text-purple-900 font-black text-xl py-4 px-12 rounded-full hover:bg-purple-100 shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all"
          >
            {t("resolution.nextRoundButton")}
          </button>
        )}
      </div>
    );
  }

  return null;
}
