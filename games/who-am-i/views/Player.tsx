"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { WhoAmIState, WhoAmIAction } from "../reducer";
import { pickAssignments, pickReplacementWord } from "../pickRound";
import { Button, Scoreboard, WaitingState } from "@/components/ui";
import { GuessIcon, OwnResult, RoundClock, TimerPicker, WordCard, formatTime } from "./parts";
import { WhoPicto } from "./Pictos";

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

export function PlayerView({ state, players, playerId: rawPlayerId, dispatch }: PlayerProps) {
  const t = useTranslations("WhoAmI");
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
        <div className="flex flex-col items-center gap-6 w-full">
          <WhoPicto size={64} className="text-edge-game-who-am-i" />
          <h2 className="font-display text-3xl text-ink text-center">{t("config.title")}</h2>

          <TimerPicker
            value={state.timerSeconds}
            onChange={(timerSeconds) => dispatch({ type: "SET_CONFIG", timerSeconds })}
          />

          <div className="w-full space-y-2">
            {notEnoughPlayers && (
              <p className="text-base text-ink-muted text-center">{t("config.notEnoughPlayers")}</p>
            )}
            <Button
              variant="primary"
              disabled={notEnoughPlayers}
              onClick={() => {
                const { assignments } = pickAssignments(players, locale, state.usedWordIds);
                dispatch({
                  type: "START_GAME",
                  playerIds: players.map((p) => p.id),
                  assignments,
                  now: Date.now(),
                });
              }}
              className="text-2xl py-5"
            >
              {t("config.startButton")}
            </Button>
          </div>
        </div>
      );
    }

    return <WaitingState label={t("config.waitingForHost")} />;
  }

  if (state.phase === "playing") {
    const myWord = state.wordAssignments[playerId];

    return (
      <div className="flex flex-col items-center gap-5 w-full text-center">
        <RoundClock label={timeLeft === null ? "∞" : formatTime(timeLeft)} />

        {hasGuessed || hasLost ? (
          <OwnResult guessed={hasGuessed} word={myWord} />
        ) : (
          <>
            <p className="text-lg font-bold text-ink-muted">{t("playing.showEveryoneElse")}</p>

            <WordCard word={myWord} />

            <div className="flex gap-3 w-full">
              <Button variant="success" onClick={() => dispatch({ type: "GUESS_CORRECT", playerId })}>
                {t("playing.correctButton")}
              </Button>
              <Button variant="ghost" onClick={() => dispatch({ type: "GUESS_WRONG", playerId })}>
                {t("playing.wrongButton")}
              </Button>
            </div>

            <Button
              variant="ghost"
              fullWidth={false}
              className="px-4 text-base"
              onClick={() => {
                const newWord = pickReplacementWord(locale, state.usedWordIds);
                dispatch({ type: "REROLL_WORD", playerId, newWord });
              }}
            >
              {t("playing.rerollButton")}
            </Button>
          </>
        )}

        {isHost && (
          <Button variant="ghost" onClick={() => dispatch({ type: "END_ROUND" })}>
            {t("playing.endRoundButton")}
          </Button>
        )}
      </div>
    );
  }

  if (state.phase === "resolution") {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <div className="motion-celebrate w-full rounded-[1.75rem] bg-game-who-am-i text-on-game-who-am-i px-5 py-6 flex flex-col items-center gap-2 shadow-[0_var(--edge-lg)_0_var(--color-edge-game-who-am-i)]">
          <WhoPicto size={64} />
          <h2 className="font-display text-3xl text-center">{t("resolution.title")}</h2>
        </div>

        <Scoreboard
          title={t("resolution.scoresTitle")}
          entries={players.map((p) => {
            const word = state.wordAssignments[p.id];
            return {
              id: p.id,
              icon: <GuessIcon guessed={state.guessedIds.includes(p.id)} />,
              label: (
                <span className="min-w-0">
                  <span className="block text-lg font-bold text-ink truncate">{p.displayName}</span>
                  <span className="block text-base text-ink-muted">
                    <span aria-hidden="true">{word?.emoji}</span> {word?.word}
                  </span>
                </span>
              ),
              value: <span className="font-mono text-lg font-bold text-gold tabular-nums">{state.scores[p.id] || 0} pts</span>,
            };
          })}
        />

        {isHost && (
          <Button variant="primary" onClick={() => dispatch({ type: "PLAY_AGAIN" })}>
            {t("resolution.nextRoundButton")}
          </Button>
        )}
      </div>
    );
  }

  return null;
}
