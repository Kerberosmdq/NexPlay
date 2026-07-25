"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { ImpostorState, ImpostorAction } from "../reducer";
import { maxImpostorsFor } from "../reducer";
import { pickWordAndImpostors } from "../pickRound";
import { PlayerRoster } from "./PlayerRoster";
import { Button, Card, RevealCard, Scoreboard } from "@/components/ui";

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

export function SingleDeviceView({ state, dispatch, onExit }: ImpostorSingleDeviceProps) {
  const t = useTranslations("Impostor");
  const tConfig = useTranslations("games.impostor.config");
  const locale = useLocale();

  // Single-device has no realtime player roster, so names are entered
  // locally before the round starts (NEXPLAY_PLAN §3.3: "host enters player
  // names"). Once START_GAME fires these become the round's playerIds,
  // driven through the exact same reducer as multi-device (ADR-0002 §4).
  const [names, setNames] = useState<string[]>(["", "", ""]);
  const [revealIndex, setRevealIndex] = useState(0);
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
    const maxImpostors = maxImpostorsFor(validNames.length);
    const minPlayersNeeded = 2 * state.impostorCount + 1;
    const notEnoughPlayers = validNames.length < Math.max(3, minPlayersNeeded);

    return (
      <Card className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto">
        <h2 className="text-3xl font-black text-ink text-center">{t("config.title")}</h2>

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
              className="w-full bg-surface-sunken border-2 border-line text-ink p-3 rounded-xl font-semibold outline-none focus-visible:border-focus"
            />
          ))}
          <Button variant="ghost" onClick={() => setNames([...names, ""])}>
            + {t("config.addPlayerButton")}
          </Button>
        </div>

        <div className="w-full space-y-2">
          <label className="text-ink-muted font-bold text-sm">{tConfig("impostorCount")}</label>
          <select
            className="w-full bg-surface-sunken border-2 border-line text-ink p-3 rounded-xl font-semibold outline-none focus-visible:border-focus"
            value={state.impostorCount}
            onChange={(e) =>
              dispatch({
                type: "SET_CONFIG",
                impostorCount: parseInt(e.target.value, 10),
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

        {notEnoughPlayers ? (
          <div className="bg-red-500/20 text-red-300 p-4 rounded-xl text-center font-bold border border-red-500/30 w-full">
            {t("config.notEnoughPlayersFor", { min: Math.max(3, minPlayersNeeded) })}
          </div>
        ) : (
          <Button
            variant="primary"
            onClick={() => {
              const players = makeLocalPlayers(validNames);
              const { word, shuffledPlayerIds } = pickWordAndImpostors(players, locale, state.usedWordIds);
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
            className="text-xl py-5"
          >
            {t("config.startButton")}
          </Button>
        )}

        {onExit && (
          <button onClick={onExit} className="text-xs text-ink-muted underline">
            {t("config.exitButton")}
          </button>
        )}
      </Card>
    );
  }

  if (state.phase === "role_reveal") {
    const current = roundPlayers[revealIndex];
    const isLast = revealIndex === roundPlayers.length - 1;
    const isImpostor = current ? state.impostorIds.includes(current.id) : false;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
        <p className="text-ink-muted font-bold uppercase tracking-widest text-sm">
          {current?.displayName}
        </p>
        <h2 className="text-2xl font-bold text-ink text-center">{t("roleReveal.title")}</h2>

        <RevealCard
          hidden={
            <div className="text-center space-y-4">
              <div className="text-6xl">👁️</div>
              <p className="text-ink-muted font-bold">{t("roleReveal.holdToReveal")}</p>
              <p className="text-xs text-ink-muted/50">{t("roleReveal.dontLetOthersLook")}</p>
            </div>
          }
          revealed={
            isImpostor ? (
              <div className="text-center space-y-4">
                <div className="text-8xl">🕵️</div>
                <h3 className="text-2xl font-black text-red-500">{t("roleReveal.youAreImpostor")}</h3>
                {state.hintDifficulty !== "none" && state.secretWord && (
                  <p className="text-lg text-ink font-bold">
                    {state.hintDifficulty === "hard" ? state.secretWord.category : state.secretWord.easyHint}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-8xl">🤫</div>
                <p className="text-3xl font-black text-green-400">{state.secretWord?.word}</p>
              </div>
            )
          }
        />

        <Button
          variant="ghost"
          onClick={() => {
            if (isLast) {
              dispatch({ type: "PROCEED_TO_DISCUSSION" });
            } else {
              setRevealIndex((i) => i + 1);
            }
          }}
        >
          {isLast ? t("roleReveal.continueButton") : `➔ ${roundPlayers[revealIndex + 1]?.displayName}`}
        </Button>
      </div>
    );
  }

  if (state.phase === "discussion") {
    const everyoneSpoke = state.turnIndex >= state.turnOrder.length;
    const currentSpeakerId = everyoneSpoke ? null : state.turnOrder[state.turnIndex];
    const currentSpeaker = roundPlayers.find((p) => p.id === currentSpeakerId);
    const isImpostorSpeaking = currentSpeakerId ? state.impostorIds.includes(currentSpeakerId) : false;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 text-center mt-10 px-4">
        <h2 className="text-3xl font-bold text-ink-muted">{t("discussion.title")}</h2>

        <PlayerRoster players={roundPlayers} aliveIds={state.aliveIds} />

        {everyoneSpoke ? (
          <p className="text-lg text-ink-muted max-w-sm">{t("discussion.everyoneSpoke")}</p>
        ) : (
          <>
            <p className="text-ink-muted font-bold uppercase tracking-widest text-sm">
              {currentSpeaker?.displayName}
            </p>
            <p className="text-lg text-ink-muted max-w-sm">
              {isImpostorSpeaking ? t("discussion.impostorTip") : t("discussion.innocentTip")}
            </p>
            <Button variant="ghost" onClick={() => dispatch({ type: "NEXT_TURN" })} className="max-w-sm text-xl">
              {t("discussion.saidMyWord")}
            </Button>
          </>
        )}

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
    const aliveRoundPlayers = roundPlayers.filter((p) => state.aliveIds.includes(p.id));
    const voter = aliveRoundPlayers[voterIndex];
    const done = voterIndex >= aliveRoundPlayers.length;

    if (done) {
      return (
        <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
          <p className="text-green-300 font-bold">{t("voting.voteRegistered")}</p>
          <Button variant="primary" onClick={() => dispatch({ type: "END_VOTING" })} className="bg-green-500! text-xl">
            {t("voting.revealResultsButton")}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
        <p className="text-ink-muted font-bold uppercase tracking-widest text-sm">{voter?.displayName}</p>
        <h2 className="text-2xl font-bold text-ink text-center">{t("voting.title")}</h2>
        <PlayerRoster players={roundPlayers} aliveIds={state.aliveIds} />
        <div className="w-full space-y-3">
          {aliveRoundPlayers
            .filter((p) => p.id !== voter?.id)
            .map((target) => (
              <Button
                key={target.id}
                variant="ghost"
                onClick={() => {
                  if (voter) {
                    dispatch({ type: "CAST_VOTE", voterId: voter.id, votedId: target.id });
                  }
                  setVoterIndex((i) => i + 1);
                }}
                className="text-xl"
              >
                {target.displayName}
              </Button>
            ))}
        </div>
      </div>
    );
  }

  if (state.phase === "elimination_result") {
    const elimination = state.lastElimination;
    const eliminatedPlayer = elimination?.eliminatedId
      ? roundPlayers.find((p) => p.id === elimination.eliminatedId)
      : null;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
        {!elimination?.eliminatedId ? (
          <>
            <div className="text-5xl">🤝</div>
            <h2 className="text-2xl font-bold text-ink text-center">{t("eliminationResult.tie")}</h2>
          </>
        ) : elimination.wasImpostor ? (
          <>
            <div className="text-6xl">🕵️</div>
            <h2 className="text-2xl font-black text-red-400 text-center">
              {t("eliminationResult.wasImpostor", { name: eliminatedPlayer?.displayName ?? "" })}
            </h2>
            <p className="text-ink-muted text-center">{t("eliminationResult.gameContinues")}</p>
          </>
        ) : (
          <>
            <div className="text-6xl">😬</div>
            <h2 className="text-2xl font-black text-ink text-center">
              {t("eliminationResult.wasInnocent", { name: eliminatedPlayer?.displayName ?? "" })}
            </h2>
            <p className="text-ink-muted text-center">{t("eliminationResult.gameContinues")}</p>
          </>
        )}

        <Button
          variant="ghost"
          onClick={() => {
            setVoterIndex(0);
            dispatch({ type: "PROCEED_TO_DISCUSSION" });
          }}
        >
          {t("eliminationResult.continueButton")}
        </Button>
      </div>
    );
  }

  if (state.phase === "guess_word") {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
        <h2 className="text-3xl font-black text-red-400 text-center">{t("guessWord.title")}</h2>
        <p className="text-ink/80 text-center">{t("guessWord.innocentsPrompt")}</p>
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
    const impostorSurvived = res != null && !res.impostorsCaught;
    const impostorNames = state.impostorIds
      .map((id) => roundPlayers.find((p) => p.id === id)?.displayName)
      .filter(Boolean)
      .join(", ");

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto mt-4">
        {impostorSurvived ? (
          <div className="w-full text-center space-y-2 bg-gradient-to-b from-yellow-500/20 to-transparent border-2 border-yellow-500/40 rounded-3xl py-6 px-4">
            <div className="text-5xl">👑</div>
            <h2 className="text-2xl font-black text-yellow-400">{t("resolution.impostorSurvived")}</h2>
            <p className="text-base text-yellow-100/90 font-semibold">
              {t("resolution.survivedCelebration", { names: impostorNames })}
            </p>
          </div>
        ) : (
          <h2 className="text-3xl font-black text-ink text-center motion-celebrate">
            {res?.impostorGuessedWord ? t("resolution.impostorStoleVictory") : t("resolution.innocentVictory")}
          </h2>
        )}
        <p className="text-xl text-pink-400 font-black">{state.secretWord?.word}</p>
        <Scoreboard
          entries={roundPlayers.map((p) => ({
            id: p.id,
            label: <span className="text-ink font-bold">{p.displayName}</span>,
            value: <span className="text-yellow-400 font-black">{state.scores[p.id] || 0} pts</span>,
          }))}
        />
        <Button
          variant="ghost"
          onClick={() => {
            setRevealIndex(0);
            setVoterIndex(0);
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
