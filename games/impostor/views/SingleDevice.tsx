"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { ImpostorState, ImpostorAction } from "../reducer";
import { impostorContent } from "../content";

export interface ImpostorSingleDeviceProps {
  state: ImpostorState;
  players: Player[];
  dispatch: (action: ImpostorAction) => void;
  onExit?: () => void;
}

function makeLocalPlayers(names: string[]): Player[] {
  const now = Date.now();
  return names.map((displayName, i) => ({
    id: `local-${i}-${displayName}`,
    displayName,
    isHost: i === 0,
    joinedAt: now + i,
    isOnline: true,
  }));
}

function pickWordAndImpostors(players: Player[], locale: string) {
  const words = impostorContent.locale[locale as "en" | "es"] ?? impostorContent.locale.en;
  const word = words[Math.floor(Math.random() * words.length)];
  const shuffledPlayerIds = [...players].sort(() => Math.random() - 0.5).map((p) => p.id);
  return { word, shuffledPlayerIds };
}

export function SingleDeviceView({ state, dispatch, onExit }: ImpostorSingleDeviceProps) {
  const t = useTranslations("Impostor");
  const locale = useLocale();

  // Single-device has no realtime player roster, so names are entered
  // locally before the round starts (NEXPLAY_PLAN §3.3: "host enters player
  // names"). Once START_GAME fires these become the round's playerIds,
  // driven through the exact same reducer as multi-device (ADR-0002 §4).
  const [names, setNames] = useState<string[]>(["", "", ""]);
  const [revealIndex, setRevealIndex] = useState(0);
  const [showRole, setShowRole] = useState(false);
  const [voterIndex, setVoterIndex] = useState(0);

  // The reducer only stores playerIds (strings), so once a round starts we
  // reconstruct display Player objects by zipping ids with the names that
  // were entered, in the same order they were passed to START_GAME.
  const roundPlayers: Player[] =
    state.playerIds.length > 0
      ? state.playerIds.map((id, i) => ({
          id,
          displayName: names[i] ?? id,
          isHost: i === 0,
          joinedAt: i,
          isOnline: true,
        }))
      : makeLocalPlayers(names);

  if (state.phase === "config") {
    const validNames = names.map((n) => n.trim()).filter(Boolean);
    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto bg-white/5 p-8 rounded-3xl border border-white/10">
        <h2 className="text-3xl font-black text-white text-center">{t("config.title")}</h2>

        <div className="w-full space-y-3">
          {names.map((name, i) => (
            <input
              key={i}
              value={name}
              onChange={(e) => {
                const next = [...names];
                next[i] = e.target.value;
                setNames(next);
              }}
              placeholder={t("config.playerNamePlaceholder", { n: i + 1 })}
              className="w-full bg-[#13072b] border-2 border-[#3b177d] text-white p-3 rounded-xl font-semibold outline-none focus:border-pink-500"
            />
          ))}
          <button
            onClick={() => setNames([...names, ""])}
            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl"
          >
            + {t("config.addPlayerButton")}
          </button>
        </div>

        {validNames.length < 3 ? (
          <div className="bg-red-500/20 text-red-300 p-4 rounded-xl text-center font-bold border border-red-500/30 w-full">
            {t("config.notEnoughPlayers")}
          </div>
        ) : (
          <button
            onClick={() => {
              const players = makeLocalPlayers(validNames);
              const { word, shuffledPlayerIds } = pickWordAndImpostors(players, locale);
              setNames(validNames);
              setRevealIndex(0);
              setVoterIndex(0);
              dispatch({
                type: "START_GAME",
                playerIds: players.map((p) => p.id),
                shuffledPlayerIds,
                word,
              });
            }}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xl py-5 rounded-2xl"
          >
            {t("config.startButton")}
          </button>
        )}

        {onExit && (
          <button onClick={onExit} className="text-xs text-purple-300 underline">
            {t("config.exitButton")}
          </button>
        )}
      </div>
    );
  }

  if (state.phase === "role_reveal") {
    const current = roundPlayers[revealIndex];
    const isLast = revealIndex === roundPlayers.length - 1;
    const isImpostor = current ? state.impostorIds.includes(current.id) : false;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
        <p className="text-purple-300 font-bold uppercase tracking-widest text-sm">
          {current?.displayName}
        </p>
        <h2 className="text-2xl font-bold text-white text-center">{t("roleReveal.title")}</h2>

        <button
          onPointerDown={() => setShowRole(true)}
          onPointerUp={() => setShowRole(false)}
          onPointerLeave={() => setShowRole(false)}
          className="w-full bg-[#13072b] border-2 border-[#3b177d] active:border-pink-500 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[280px] touch-none select-none"
        >
          {!showRole ? (
            <div className="text-center space-y-4">
              <div className="text-6xl">👁️</div>
              <p className="text-purple-300 font-bold">{t("roleReveal.holdToReveal")}</p>
              <p className="text-xs text-purple-400/50">{t("roleReveal.dontLetOthersLook")}</p>
            </div>
          ) : isImpostor ? (
            <div className="text-center space-y-4">
              <div className="text-8xl">🕵️</div>
              <h3 className="text-2xl font-black text-red-500">{t("roleReveal.youAreImpostor")}</h3>
              {state.hintDifficulty !== "none" && state.secretWord && (
                <p className="text-lg text-white font-bold">
                  {state.hintDifficulty === "hard" ? state.secretWord.category : state.secretWord.easyHint}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-8xl">🤫</div>
              <p className="text-3xl font-black text-green-400">{state.secretWord?.word}</p>
            </div>
          )}
        </button>

        <button
          onClick={() => {
            setShowRole(false);
            if (isLast) {
              dispatch({ type: "PROCEED_TO_DISCUSSION" });
            } else {
              setRevealIndex((i) => i + 1);
            }
          }}
          className="w-full bg-white text-purple-900 font-black text-xl py-4 rounded-full"
        >
          {isLast ? t("roleReveal.continueButton") : `➔ ${roundPlayers[revealIndex + 1]?.displayName}`}
        </button>
      </div>
    );
  }

  if (state.phase === "discussion") {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 text-center mt-10 px-4">
        <h2 className="text-3xl font-bold text-purple-300">{t("discussion.title")}</h2>
        <p className="text-lg text-white/70 max-w-sm">{t("discussion.innocentTip")}</p>
        <button
          onClick={() => {
            setVoterIndex(0);
            dispatch({ type: "SKIP_TO_VOTING" });
          }}
          className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border-2 border-red-500/50 font-bold text-xl py-4 px-10 rounded-2xl w-full max-w-sm"
        >
          {t("discussion.goToVoteButton")}
        </button>
      </div>
    );
  }

  if (state.phase === "voting") {
    const voter = roundPlayers[voterIndex];
    const done = voterIndex >= roundPlayers.length;

    if (done) {
      return (
        <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
          <p className="text-green-300 font-bold">{t("voting.voteRegistered")}</p>
          <button
            onClick={() => dispatch({ type: "END_VOTING" })}
            className="bg-green-500 text-white font-black text-xl py-4 px-8 rounded-2xl w-full"
          >
            {t("voting.revealResultsButton")}
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
        <p className="text-purple-300 font-bold uppercase tracking-widest text-sm">{voter?.displayName}</p>
        <h2 className="text-2xl font-bold text-white text-center">{t("voting.title")}</h2>
        <div className="w-full space-y-3">
          {roundPlayers
            .filter((p) => p.id !== voter?.id)
            .map((target) => (
              <button
                key={target.id}
                onClick={() => {
                  if (voter) {
                    dispatch({ type: "CAST_VOTE", voterId: voter.id, votedId: target.id });
                  }
                  setVoterIndex((i) => i + 1);
                }}
                className="w-full bg-[#13072b] hover:bg-[#1a0a3a] border-2 border-[#3b177d] text-white font-bold text-xl py-4 rounded-xl"
              >
                {target.displayName}
              </button>
            ))}
        </div>
      </div>
    );
  }

  if (state.phase === "guess_word") {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
        <h2 className="text-3xl font-black text-red-400 text-center">{t("guessWord.title")}</h2>
        <p className="text-white/80 text-center">{t("guessWord.innocentsPrompt")}</p>
        <div className="flex space-x-4 w-full">
          <button
            onClick={() => dispatch({ type: "IMPOSTOR_GUESS", correct: true })}
            className="flex-1 bg-green-500/20 border-2 border-green-500 text-green-300 font-bold py-4 rounded-xl"
          >
            {t("guessWord.guessedCorrectly")}
          </button>
          <button
            onClick={() => dispatch({ type: "IMPOSTOR_GUESS", correct: false })}
            className="flex-1 bg-red-500/20 border-2 border-red-500 text-red-300 font-bold py-4 rounded-xl"
          >
            {t("guessWord.guessedWrong")}
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === "resolution") {
    const res = state.lastRoundResult;
    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto mt-4">
        <h2 className="text-3xl font-black text-white text-center">
          {res?.impostorsCaught
            ? res.impostorGuessedWord
              ? t("resolution.impostorStoleVictory")
              : t("resolution.innocentVictory")
            : t("resolution.impostorSurvived")}
        </h2>
        <p className="text-xl text-pink-400 font-black">{state.secretWord?.word}</p>
        <div className="w-full space-y-2">
          {roundPlayers.map((p) => (
            <div key={p.id} className="flex justify-between bg-black/20 p-3 rounded-xl">
              <span className="text-white font-bold">{p.displayName}</span>
              <span className="text-yellow-400 font-black">{state.scores[p.id] || 0} pts</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            setRevealIndex(0);
            setVoterIndex(0);
            dispatch({ type: "PLAY_AGAIN" });
          }}
          className="w-full bg-white text-purple-900 font-black text-xl py-4 rounded-full"
        >
          {t("resolution.nextRoundButton")}
        </button>
      </div>
    );
  }

  return null;
}
