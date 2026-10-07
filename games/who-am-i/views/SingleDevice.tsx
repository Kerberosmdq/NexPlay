"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { WhoAmIState, WhoAmIAction } from "../reducer";
import { pickAssignments, pickReplacementWord } from "../pickRound";
import { Button, Scoreboard } from "@/components/ui";
import { loadFamilyRoster, prefillNames, rememberFamilyNames } from "@/lib/family/roster";
import { GuessIcon, RoundClock, TimerPicker, WordCard, formatTime } from "./parts";
import { ForeheadPicto, WhoPicto } from "./Pictos";

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

export function SingleDeviceView({ state, dispatch }: WhoAmISingleDeviceProps) {
  const t = useTranslations("WhoAmI");
  const locale = useLocale();

  // Single-device has no realtime player roster, so names are entered
  // locally before the round starts, same pattern as Impostor's
  // single-device view.
  const [names, setNames] = useState<string[]>(() => prefillNames(loadFamilyRoster(), 3));
  const [activeIndex, setActiveIndex] = useState(0);
  // Each turn opens on a handoff screen (TASK-0039): the word and the turn
  // timer only appear once the player says they're holding the phone on
  // their forehead — before, the countdown ran (and the word showed) while
  // the phone was still being passed.
  const [turnReady, setTurnReady] = useState(false);

  const nextTurn = () => {
    setActiveIndex((i) => i + 1);
    setTurnReady(false);
  };

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
    if (state.phase !== "playing" || state.timerSeconds <= 0 || !turnReady) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTurnSecondsLeft(state.timerSeconds);
    const interval = setInterval(() => {
      setTurnSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.phase, state.timerSeconds, activeIndex, turnReady]);

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
      <div className="flex flex-col items-center gap-6 w-full">
        <WhoPicto size={64} className="text-edge-game-who-am-i" />
        <h2 className="font-display text-3xl text-ink text-center">{t("config.title")}</h2>

        <div className="w-full space-y-3">
          {names.map((name, i) => (
            <input
              key={i}
              value={name}
              aria-label={t("config.playerNamePlaceholder", { n: i + 1 })}
              onChange={(e) => {
                const next = [...names];
                next[i] = e.target.value;
                setNames(next);
              }}
              placeholder={t("config.playerNamePlaceholder", { n: i + 1 })}
              className="w-full bg-surface-sunken border-2 border-transparent text-ink text-xl px-5 py-3 rounded-2xl font-bold placeholder:text-ink-muted placeholder:font-semibold outline-none shadow-[inset_0_3px_0_var(--color-edge-sunken)] focus-visible:border-focus"
            />
          ))}
          <Button variant="ghost" onClick={() => setNames([...names, ""])}>
            + {t("config.addPlayerButton")}
          </Button>
        </div>

        <TimerPicker
          value={state.timerSeconds}
          onChange={(timerSeconds) => dispatch({ type: "SET_CONFIG", timerSeconds })}
        />

        <div className="w-full space-y-2">
          {notEnoughPlayers && <p className="text-base text-ink-muted text-center">{t("config.minPlayersHint")}</p>}
          <Button
            variant="primary"
            disabled={notEnoughPlayers}
            onClick={() => {
              const players = makeLocalPlayers(validNames);
              const { assignments } = pickAssignments(players, locale, state.usedWordIds);
              rememberFamilyNames(validNames);
              setNames(validNames);
              setActiveIndex(0);
              setTurnReady(false);
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

  if (state.phase === "playing") {
    if (roundExhausted) return null;

    const current = roundPlayers[activeIndex];
    const word = current ? state.wordAssignments[current.id] : undefined;
    const name = current?.displayName ?? "";

    if (!turnReady) {
      return (
        <div className="flex flex-col items-center gap-5 w-full text-center py-6">
          <ForeheadPicto size={80} className="text-edge-game-who-am-i" />
          <h2 className="font-display text-3xl text-ink leading-tight">{t("singleDevice.handoffTitle", { name })}</h2>
          <p className="text-lg text-ink-muted">{t("singleDevice.handoffHint")}</p>
          <Button variant="primary" onClick={() => setTurnReady(true)} className="text-2xl py-5">
            {t("singleDevice.readyButton")}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-5 w-full text-center">
        <RoundClock label={state.timerSeconds <= 0 ? "∞" : formatTime(turnSecondsLeft)} />

        <p className="text-lg font-bold text-ink-muted">{t("singleDevice.holdFor", { name })}</p>

        <WordCard word={word} />

        <div className="flex gap-3 w-full">
          <Button
            variant="success"
            onClick={() => {
              if (current) dispatch({ type: "GUESS_CORRECT", playerId: current.id });
              nextTurn();
            }}
          >
            {t("singleDevice.guessedButton")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (current) dispatch({ type: "GUESS_WRONG", playerId: current.id });
              nextTurn();
            }}
          >
            {t("singleDevice.failedButton")}
          </Button>
        </div>

        <Button
          variant="ghost"
          fullWidth={false}
          className="px-4 text-base"
          onClick={() => {
            if (!current) return;
            const newWord = pickReplacementWord(locale, state.usedWordIds);
            dispatch({ type: "REROLL_WORD", playerId: current.id, newWord });
          }}
        >
          {t("playing.rerollButton")}
        </Button>
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
          entries={roundPlayers.map((p) => {
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
        <Button
          variant="primary"
          onClick={() => {
            setActiveIndex(0);
            setTurnReady(false);
            dispatch({ type: "PLAY_AGAIN" });
          }}
        >
          {t("resolution.nextRoundButton")}
        </Button>
      </div>
    );
  }

  return null;
}
