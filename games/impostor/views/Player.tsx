"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { ImpostorState, ImpostorAction } from "../reducer";
import { maxImpostorsFor } from "../reducer";
import { impostorContent } from "../content";

interface PlayerProps {
  state: ImpostorState;
  players: Player[];
  // Optional because this component also fills the `host` view slot, whose
  // contract doesn't guarantee a playerId — the platform passes it through
  // in practice, but we resolve a fallback below just in case.
  playerId?: string;
  roomCode: string;
  dispatch: (action: ImpostorAction) => void;
}

function pickWordAndImpostors(players: Player[], locale: string) {
  const words = impostorContent.locale[locale as "en" | "es"] ?? impostorContent.locale.en;
  const word = words[Math.floor(Math.random() * words.length)];
  const shuffledPlayerIds = [...players]
    .sort(() => Math.random() - 0.5)
    .map((p) => p.id);
  return { word, shuffledPlayerIds };
}

export function PlayerView({ state, players, playerId: rawPlayerId, dispatch }: PlayerProps) {
  const t = useTranslations("Impostor");
  const tConfig = useTranslations("games.impostor.config");
  const locale = useLocale();
  const [showRole, setShowRole] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const me = players.find((p) => p.id === rawPlayerId) ?? players.find((p) => p.isHost);
  const playerId = rawPlayerId ?? me?.id ?? "";
  const isHost = me?.isHost || false;
  const isImpostor = state.impostorIds.includes(playerId);
  const secretWord = state.secretWord;

  useEffect(() => {
    if (state.phase === "discussion" && state.discussionTimeSeconds > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(state.discussionTimeSeconds);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (isHost) dispatch({ type: "SKIP_TO_VOTING" });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [state.phase, state.discussionTimeSeconds, dispatch, isHost]);

  if (state.phase === "config") {
    if (isHost) {
      const maxImpostors = maxImpostorsFor(players.length);
      const minPlayersNeeded = 2 * state.impostorCount + 1;
      const notEnoughPlayers = players.length < Math.max(3, minPlayersNeeded);

      return (
        <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-2xl mx-auto bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight text-center">
            {t("config.title")}
          </h2>

          <div className="w-full space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="text-purple-200 font-bold">{tConfig("impostorCount")}</label>
              <select
                className="bg-[#13072b] border-2 border-[#3b177d] text-white p-4 rounded-xl font-semibold outline-none focus:border-pink-500 transition-colors"
                value={state.impostorCount}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CONFIG",
                    impostorCount: parseInt(e.target.value, 10),
                    discussionTimeSeconds: state.discussionTimeSeconds,
                    votingTimeSeconds: state.votingTimeSeconds,
                    hintDifficulty: state.hintDifficulty,
                  })
                }
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n} disabled={n > maxImpostors}>
                    {n > maxImpostors ? tConfig("needsPlayers", { n, min: 2 * n + 1 }) : n}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-purple-200 font-bold">{tConfig("hintDifficulty")}</label>
              <select
                className="bg-[#13072b] border-2 border-[#3b177d] text-white p-4 rounded-xl font-semibold outline-none focus:border-pink-500 transition-colors"
                value={state.hintDifficulty}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CONFIG",
                    impostorCount: state.impostorCount,
                    discussionTimeSeconds: state.discussionTimeSeconds,
                    votingTimeSeconds: state.votingTimeSeconds,
                    hintDifficulty: e.target.value as ImpostorState["hintDifficulty"],
                  })
                }
              >
                <option value="none">{tConfig("hintNone")}</option>
                <option value="hard">{tConfig("hintHard")}</option>
                <option value="easy">{tConfig("hintEasy")}</option>
              </select>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-purple-200 font-bold">{tConfig("discussionTimeSeconds")}</label>
              <select
                className="bg-[#13072b] border-2 border-[#3b177d] text-white p-4 rounded-xl font-semibold outline-none focus:border-pink-500 transition-colors"
                value={state.discussionTimeSeconds}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CONFIG",
                    impostorCount: state.impostorCount,
                    discussionTimeSeconds: parseInt(e.target.value, 10),
                    votingTimeSeconds: state.votingTimeSeconds,
                    hintDifficulty: state.hintDifficulty,
                  })
                }
              >
                <option value={60}>{tConfig("time1min")}</option>
                <option value={120}>{tConfig("time2min")}</option>
                <option value={180}>{tConfig("time3min")}</option>
                <option value={0}>{tConfig("timeUnlimited")}</option>
              </select>
            </div>

            {notEnoughPlayers ? (
              <div className="bg-red-500/20 text-red-300 p-4 rounded-xl text-center font-bold border border-red-500/30">
                {t("config.notEnoughPlayersFor", { min: Math.max(3, minPlayersNeeded) })}
              </div>
            ) : (
              <button
                onClick={() => {
                  const { word, shuffledPlayerIds } = pickWordAndImpostors(players, locale);
                  dispatch({
                    type: "START_GAME",
                    playerIds: players.map((p) => p.id),
                    shuffledPlayerIds,
                    word,
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

  if (state.phase === "role_reveal") {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-sm mx-auto mt-4">
        <h2 className="text-2xl font-bold text-white text-center">{t("roleReveal.title")}</h2>

        <button
          onPointerDown={() => setShowRole(true)}
          onPointerUp={() => setShowRole(false)}
          onPointerLeave={() => setShowRole(false)}
          className="w-full bg-[#13072b] border-2 border-[#3b177d] active:border-pink-500 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[300px] transition-all touch-none select-none"
        >
          {!showRole ? (
            <div className="text-center space-y-4">
              <div className="text-6xl">👁️</div>
              <p className="text-purple-300 font-bold">{t("roleReveal.holdToReveal")}</p>
              <p className="text-xs text-purple-400/50">{t("roleReveal.dontLetOthersLook")}</p>
            </div>
          ) : (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-200">
              {isImpostor ? (
                <>
                  <div className="text-8xl">🕵️</div>
                  <h3 className="text-3xl font-black text-red-500">{t("roleReveal.youAreImpostor")}</h3>

                  {state.hintDifficulty !== "none" && secretWord && (
                    <div className="bg-red-900/30 border border-red-500/30 p-4 rounded-xl mt-4">
                      <p className="text-sm text-red-300 uppercase tracking-widest font-bold mb-1">
                        {t("roleReveal.yourClue")}
                      </p>
                      <p className="text-xl text-white font-bold">
                        {state.hintDifficulty === "hard" ? secretWord.category : secretWord.easyHint}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-8xl">🤫</div>
                  <h3 className="text-xl font-bold text-purple-200">{t("roleReveal.secretWordIs")}</h3>
                  <p className="text-4xl font-black text-green-400 bg-green-900/30 px-6 py-3 rounded-2xl border border-green-500/30">
                    {secretWord?.word}
                  </p>
                </>
              )}
            </div>
          )}
        </button>

        {isHost && (
          <button
            onClick={() => dispatch({ type: "PROCEED_TO_DISCUSSION" })}
            className="mt-8 bg-white text-purple-900 font-black text-xl py-4 px-12 rounded-full hover:bg-purple-100 transform hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] w-full"
          >
            {t("roleReveal.continueButton")}
          </button>
        )}
      </div>
    );
  }

  if (state.phase === "discussion") {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 text-center mt-10 px-4">
        <h2 className="text-3xl font-bold text-purple-300">{t("discussion.title")}</h2>

        {state.discussionTimeSeconds > 0 ? (
          <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-pink-200 drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </div>
        ) : (
          <div className="text-6xl font-black text-white/50 py-10">∞</div>
        )}

        <div className="bg-black/30 p-6 rounded-2xl border border-white/10 max-w-sm w-full">
          <div className="text-4xl mb-4">{isImpostor ? "🕵️" : "💬"}</div>
          <p className="text-lg text-white font-semibold">
            {isImpostor ? t("discussion.impostorTip") : t("discussion.innocentTip")}
          </p>
        </div>

        {isHost && (
          <button
            onClick={() => dispatch({ type: "SKIP_TO_VOTING" })}
            className="mt-4 bg-red-500/20 hover:bg-red-500/40 text-red-300 border-2 border-red-500/50 font-bold text-xl py-4 px-10 rounded-2xl transition-all w-full max-w-sm"
          >
            {t("discussion.goToVoteButton")}
          </button>
        )}
      </div>
    );
  }

  if (state.phase === "voting") {
    const alivePlayers = players.filter((p) => state.aliveIds.includes(p.id));
    const isAlive = state.aliveIds.includes(playerId);
    const hasVoted = !!state.votes[playerId];
    const totalVotes = Object.keys(state.votes).length;
    const allVoted = totalVotes === alivePlayers.length;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
        <div className="text-4xl animate-bounce">🗳️</div>
        <h2 className="text-2xl font-bold text-white text-center">{t("voting.title")}</h2>

        <p className="text-lg text-purple-200">
          {t("voting.votesCount", { cast: totalVotes, total: alivePlayers.length })}
        </p>

        {!isAlive ? (
          <div className="bg-black/20 border border-white/10 p-8 rounded-2xl mt-4 w-full text-center">
            <p className="text-purple-200/70">{t("voting.eliminatedSpectating")}</p>
          </div>
        ) : !hasVoted ? (
          <div className="w-full space-y-3 mt-4">
            {alivePlayers
              .filter((p) => p.id !== playerId)
              .map((target) => (
                <button
                  key={target.id}
                  onClick={() => dispatch({ type: "CAST_VOTE", voterId: playerId, votedId: target.id })}
                  className="w-full bg-[#13072b] hover:bg-[#1a0a3a] border-2 border-[#3b177d] text-white font-bold text-xl py-4 rounded-xl transition-all"
                >
                  {target.displayName}
                </button>
              ))}
          </div>
        ) : (
          <div className="bg-green-900/30 border border-green-500/30 p-8 rounded-2xl mt-4 w-full text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-400">{t("voting.voteRegistered")}</h3>
            <p className="text-green-200/50 mt-2">{t("voting.waitingForOthers")}</p>
          </div>
        )}

        {isHost && allVoted && (
          <button
            onClick={() => dispatch({ type: "END_VOTING" })}
            className="mt-8 bg-green-500 text-white font-black text-xl py-4 px-8 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.4)] animate-pulse w-full"
          >
            {t("voting.revealResultsButton")}
          </button>
        )}
      </div>
    );
  }

  if (state.phase === "elimination_result") {
    const elimination = state.lastElimination;
    const eliminatedPlayer = elimination?.eliminatedId
      ? players.find((p) => p.id === elimination.eliminatedId)
      : null;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4 px-4">
        {!elimination?.eliminatedId ? (
          <>
            <div className="text-5xl">🤝</div>
            <h2 className="text-2xl font-bold text-white text-center">{t("eliminationResult.tie")}</h2>
          </>
        ) : elimination.wasImpostor ? (
          <>
            <div className="text-6xl">🕵️</div>
            <h2 className="text-2xl font-black text-red-400 text-center">
              {t("eliminationResult.wasImpostor", { name: eliminatedPlayer?.displayName ?? "" })}
            </h2>
            <p className="text-purple-200 text-center">{t("eliminationResult.gameContinues")}</p>
          </>
        ) : (
          <>
            <div className="text-6xl">😬</div>
            <h2 className="text-2xl font-black text-white text-center">
              {t("eliminationResult.wasInnocent", { name: eliminatedPlayer?.displayName ?? "" })}
            </h2>
            <p className="text-purple-200 text-center">{t("eliminationResult.gameContinues")}</p>
          </>
        )}

        {isHost && (
          <button
            onClick={() => dispatch({ type: "PROCEED_TO_DISCUSSION" })}
            className="bg-white text-purple-900 font-black text-xl py-4 px-12 rounded-full hover:bg-purple-100 transform hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] w-full"
          >
            {t("eliminationResult.continueButton")}
          </button>
        )}
      </div>
    );
  }

  if (state.phase === "guess_word") {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-sm mx-auto mt-4 px-4">
        <h2 className="text-4xl font-black text-red-400 text-center">{t("guessWord.title")}</h2>

        <div className="bg-red-900/30 p-8 rounded-3xl border border-red-500/30 text-center w-full">
          <div className="text-6xl mb-6">{isImpostor ? "😬" : "🎉"}</div>

          <p className="text-xl text-white font-bold mb-4">
            {isImpostor ? t("guessWord.impostorPrompt") : t("guessWord.innocentsPrompt")}
          </p>
        </div>

        {isHost && (
          <div className="w-full space-y-4 pt-4 border-t border-white/10">
            <p className="text-sm text-purple-300 font-bold text-center uppercase tracking-widest">
              {t("guessWord.hostControls")}
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => dispatch({ type: "IMPOSTOR_GUESS", correct: true })}
                className="flex-1 bg-green-500/20 hover:bg-green-500/40 border-2 border-green-500 text-green-300 font-bold text-lg py-4 rounded-xl"
              >
                {t("guessWord.guessedCorrectly")}
              </button>
              <button
                onClick={() => dispatch({ type: "IMPOSTOR_GUESS", correct: false })}
                className="flex-1 bg-red-500/20 hover:bg-red-500/40 border-2 border-red-500 text-red-300 font-bold text-lg py-4 rounded-xl"
              >
                {t("guessWord.guessedWrong")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (state.phase === "resolution") {
    const res = state.lastRoundResult;
    const impostorSurvived = res != null && !res.impostorsCaught;
    const impostorNames = state.impostorIds
      .map((id) => players.find((p) => p.id === id)?.displayName)
      .filter(Boolean)
      .join(", ");

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        {impostorSurvived ? (
          <div className="w-full text-center space-y-3 bg-gradient-to-b from-yellow-500/20 to-transparent border-2 border-yellow-500/40 rounded-3xl py-8 px-4 shadow-[0_0_50px_rgba(234,179,8,0.25)]">
            <div className="text-6xl">👑</div>
            <h2 className="text-3xl font-black text-yellow-400 leading-tight">
              {t("resolution.impostorSurvived")}
            </h2>
            <p className="text-lg text-yellow-100/90 font-semibold">
              {t("resolution.survivedCelebration", { names: impostorNames })}
            </p>
          </div>
        ) : (
          <h2 className="text-4xl font-black text-white text-center leading-tight">
            {res?.impostorGuessedWord ? t("resolution.impostorStoleVictory") : t("resolution.innocentVictory")}
          </h2>
        )}

        <div className="text-xl text-purple-200 text-center">
          {t("resolution.secretWordWas")}
          <br />
          <span className="text-3xl font-black text-pink-400 block mt-2">{state.secretWord?.word}</span>
        </div>

        <div className="w-full bg-white/10 rounded-3xl p-6 backdrop-blur-md space-y-3 mt-4">
          <h3 className="text-xl font-bold text-purple-300 mb-4 border-b border-white/10 pb-2">
            {t("resolution.scoresTitle")}
          </h3>
          {players.map((p) => {
            const wasImpostor = state.impostorIds.includes(p.id);
            const gained = res?.pointsAwarded[p.id] || 0;
            return (
              <div key={p.id} className="flex justify-between items-center bg-black/20 p-3 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{wasImpostor ? "🕵️" : "🧑‍🤝‍🧑"}</span>
                  <span className="text-lg font-bold text-white truncate max-w-[100px]">{p.displayName}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-400 font-bold text-sm">+{gained}</span>
                  <span className="text-xl font-black text-yellow-400 w-16 text-right">
                    {state.scores[p.id] || 0} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {isHost && (
          <button
            onClick={() => dispatch({ type: "PLAY_AGAIN" })}
            className="mt-6 bg-white text-purple-900 font-black text-xl py-4 px-12 rounded-full hover:bg-purple-100 shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all w-full"
          >
            {t("resolution.nextRoundButton")}
          </button>
        )}
      </div>
    );
  }

  return null;
}
