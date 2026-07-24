"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { WhoAmIState, WhoAmIAction } from "../reducer";
import { pickAssignments } from "../pickRound";

export interface WhoAmISingleDeviceProps {
  state: WhoAmIState;
  players: Player[];
  dispatch: (action: WhoAmIAction) => void;
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

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function SingleDeviceView({ state, dispatch, onExit }: WhoAmISingleDeviceProps) {
  const t = useTranslations("WhoAmI");
  const tConfig = useTranslations("games.who-am-i.config");
  const locale = useLocale();

  // Single-device has no realtime player roster, so names are entered
  // locally before the round starts, same pattern as Impostor's
  // single-device view.
  const [names, setNames] = useState<string[]>(["", "", ""]);
  const [activeIndex, setActiveIndex] = useState(0);

  // A single shared device can't run everyone's turn "at once" like
  // multi-device does — it's inherently sequential, Heads-Up style. Each
  // player gets their own full countdown (state.timerSeconds is reused as
  // a *per-turn* duration here, not a whole-round deadline).
  const [turnSecondsLeft, setTurnSecondsLeft] = useState(state.timerSeconds);

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

  useEffect(() => {
    if (state.phase !== "playing" || state.timerSeconds <= 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTurnSecondsLeft(state.timerSeconds);
    const interval = setInterval(() => {
      setTurnSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.phase, state.timerSeconds, activeIndex]);

  // Safety net — GUESS_CORRECT already auto-resolves once everyone has
  // guessed, but if the last player(s) were skipped (passed) this ends the
  // round once we've cycled past the last one.
  const roundExhausted = state.phase === "playing" && activeIndex >= roundPlayers.length;
  useEffect(() => {
    if (roundExhausted) dispatch({ type: "END_ROUND" });
  }, [roundExhausted, dispatch]);

  if (state.phase === "config") {
    const validNames = names.map((n) => n.trim()).filter(Boolean);
    const notEnoughPlayers = validNames.length < 3;

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

        <div className="w-full space-y-2">
          <label className="text-purple-200 font-bold text-sm">{tConfig("timerSeconds")}</label>
          <select
            className="w-full bg-[#13072b] border-2 border-[#3b177d] text-white p-3 rounded-xl font-semibold outline-none focus:border-pink-500"
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
          <div className="bg-red-500/20 text-red-300 p-4 rounded-xl text-center font-bold border border-red-500/30 w-full">
            {t("config.notEnoughPlayers")}
          </div>
        ) : (
          <button
            onClick={() => {
              const players = makeLocalPlayers(validNames);
              const { assignments } = pickAssignments(players, locale, state.usedWordIds);
              setNames(validNames);
              setActiveIndex(0);
              dispatch({
                type: "START_GAME",
                playerIds: players.map((p) => p.id),
                assignments,
                now: Date.now(),
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

  if (state.phase === "playing") {
    if (roundExhausted) return null;

    const current = roundPlayers[activeIndex];
    const word = current ? state.wordAssignments[current.id] : undefined;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto mt-4 px-4 text-center">
        <p className="text-purple-300 font-bold uppercase tracking-widest text-sm">
          {t("singleDevice.holdFor", { name: current?.displayName ?? "" })}
        </p>

        <div className="w-full bg-[#13072b] border-4 border-[#3b177d] rounded-3xl p-10 space-y-4">
          <div className="text-8xl">{word?.emoji}</div>
          <p className="text-4xl font-black text-white">{word?.word}</p>
        </div>

        <div className="text-2xl font-black text-white">
          {state.timerSeconds <= 0 ? "∞" : formatTime(turnSecondsLeft)}
        </div>

        <div className="flex space-x-4 w-full">
          <button
            onClick={() => {
              if (current) dispatch({ type: "GUESS_CORRECT", playerId: current.id });
              setActiveIndex((i) => i + 1);
            }}
            className="flex-1 bg-green-500/20 border-2 border-green-500 text-green-300 font-black text-xl py-5 rounded-2xl"
          >
            {t("singleDevice.guessedButton")}
          </button>
          <button
            onClick={() => setActiveIndex((i) => i + 1)}
            className="flex-1 bg-white/10 border-2 border-white/20 text-white font-bold text-xl py-5 rounded-2xl"
          >
            {t("singleDevice.passButton")}
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === "resolution") {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2 className="text-3xl font-black text-white text-center">{t("resolution.title")}</h2>
        <div className="w-full space-y-2">
          {roundPlayers.map((p) => {
            const word = state.wordAssignments[p.id];
            const guessedIt = state.guessedIds.includes(p.id);
            return (
              <div key={p.id} className="flex justify-between items-center bg-black/20 p-3 rounded-xl">
                <div className="flex items-center space-x-2">
                  <span>{guessedIt ? "✅" : "❌"}</span>
                  <span className="text-white font-bold">{p.displayName}</span>
                  <span className="text-white/60 text-sm">
                    {word?.emoji} {word?.word}
                  </span>
                </div>
                <span className="text-yellow-400 font-black">{state.scores[p.id] || 0} pts</span>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => {
            setActiveIndex(0);
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
