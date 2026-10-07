"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { ImpostorState, ImpostorAction } from "../reducer";
import { maxImpostorsFor } from "../reducer";
import { pickWordAndImpostors } from "../pickRound";
import { PlayerRoster } from "./PlayerRoster";
import { Button, RevealCard, Scoreboard } from "@/components/ui";
import { loadFamilyRoster, prefillNames, rememberFamilyNames } from "@/lib/family/roster";
import {
  EliminationOutcome,
  ImpostorCountPicker,
  OutcomeBlock,
  RoleRevealContent,
  RoleRevealHidden,
} from "./parts";
import { BallotPicto, BubblePicto, CrownPicto, MaskPicto, PassPhonePicto, StarPicto } from "./Pictos";

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

export function SingleDeviceView({ state, dispatch }: ImpostorSingleDeviceProps) {
  const t = useTranslations("Impostor");
  const locale = useLocale();

  // Single-device has no realtime player roster, so names are entered
  // locally before the round starts (NEXPLAY_PLAN §3.3: "host enters player
  // names"). Once START_GAME fires these become the round's playerIds,
  // driven through the exact same reducer as multi-device (ADR-0002 §4).
  const [names, setNames] = useState<string[]>(() => prefillNames(loadFamilyRoster(), 3));
  const [revealIndex, setRevealIndex] = useState(0);
  // Pass-and-play gating (TASK-0039): each player first sees a handoff
  // screen with their own name ("I'm Leo"), and the step to the next player
  // stays locked until this one has actually held the card open — so a
  // stray tap can't skip someone, and the next name never sits on screen
  // over the previous player's secret.
  const [handoffConfirmed, setHandoffConfirmed] = useState(false);
  const [hasSeenRole, setHasSeenRole] = useState(false);

  const resetReveal = () => {
    setRevealIndex(0);
    setHandoffConfirmed(false);
    setHasSeenRole(false);
  };
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
      <div className="flex flex-col items-center gap-6 w-full">
        <MaskPicto size={64} className="text-game-impostor" />
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

        <ImpostorCountPicker
          value={state.impostorCount}
          maxImpostors={maxImpostors}
          onChange={(n) =>
            dispatch({
              type: "SET_CONFIG",
              impostorCount: n,
              votingTimeSeconds: state.votingTimeSeconds,
              hintDifficulty: state.hintDifficulty,
            })
          }
        />

        <div className="w-full space-y-2">
          {/* A neutral hint, not a red error: an empty setup is the normal
              starting point, not something the user did wrong. */}
          {notEnoughPlayers && (
            <p className="text-base text-ink-muted text-center">
              {t("config.minPlayersHint", { min: Math.max(3, minPlayersNeeded) })}
            </p>
          )}
          <Button
            variant="primary"
            disabled={notEnoughPlayers}
            onClick={() => {
              const players = makeLocalPlayers(validNames);
              const { word, shuffledPlayerIds } = pickWordAndImpostors(players, locale, state.usedWordIds);
              rememberFamilyNames(validNames);
              setNames(validNames);
              resetReveal();
              setVoterIndex(0);
              dispatch({
                type: "START_GAME",
                playerIds: players.map((p) => p.id),
                shuffledPlayerIds,
                word,
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

  if (state.phase === "role_reveal") {
    const current = roundPlayers[revealIndex];
    const isLast = revealIndex === roundPlayers.length - 1;
    const isImpostor = current ? state.impostorIds.includes(current.id) : false;
    const name = current?.displayName ?? "";

    if (!handoffConfirmed) {
      return (
        <div className="flex flex-col items-center gap-5 w-full text-center py-6">
          <PassPhonePicto size={80} className="text-game-impostor" />
          <h2 className="font-display text-3xl text-ink leading-tight">{t("roleReveal.passTo", { name })}</h2>
          <p className="text-lg text-ink-muted">{t("roleReveal.passToHint")}</p>
          <Button variant="primary" onClick={() => setHandoffConfirmed(true)} className="text-2xl py-5">
            {t("roleReveal.imReadyButton", { name })}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <p className="font-display text-xl text-ink-muted">{name}</p>
        <h2 className="font-display text-3xl text-ink text-center">{t("roleReveal.title")}</h2>

        <RevealCard
          onReveal={() => setHasSeenRole(true)}
          hidden={<RoleRevealHidden />}
          revealed={
            <RoleRevealContent
              isImpostor={isImpostor}
              hint={
                isImpostor && state.hintDifficulty !== "none" && state.secretWord
                  ? state.hintDifficulty === "hard"
                    ? state.secretWord.category
                    : state.secretWord.easyHint
                  : undefined
              }
              word={state.secretWord?.word}
            />
          }
        />

        <div className="w-full space-y-2">
          {!hasSeenRole && <p className="text-base text-ink-muted text-center">{t("roleReveal.revealFirstHint")}</p>}
          <Button
            variant="primary"
            disabled={!hasSeenRole}
            onClick={() => {
              if (isLast) {
                dispatch({ type: "PROCEED_TO_DISCUSSION" });
              } else {
                setRevealIndex((i) => i + 1);
                setHandoffConfirmed(false);
                setHasSeenRole(false);
              }
            }}
          >
            {isLast
              ? t("roleReveal.continueButton")
              : t("roleReveal.seenNextButton", { name: roundPlayers[revealIndex + 1]?.displayName ?? "" })}
          </Button>
        </div>
      </div>
    );
  }

  if (state.phase === "discussion") {
    const everyoneSpoke = state.turnIndex >= state.turnOrder.length;
    const currentSpeakerId = everyoneSpoke ? null : state.turnOrder[state.turnIndex];
    const currentSpeaker = roundPlayers.find((p) => p.id === currentSpeakerId);

    return (
      <div className="flex flex-col items-center gap-5 text-center w-full">
        <h2 className="font-display text-3xl text-ink">{t("discussion.title")}</h2>

        <PlayerRoster players={roundPlayers} aliveIds={state.aliveIds} />

        {everyoneSpoke ? (
          <p className="text-lg text-ink-muted font-bold">{t("discussion.everyoneSpoke")}</p>
        ) : (
          <>
            <div className="w-full flex flex-col items-center gap-2 bg-surface-sunken rounded-2xl px-4 py-5">
              <BubblePicto size={48} className="text-game-impostor" />
              <p className="font-display text-3xl text-ink">{currentSpeaker?.displayName}</p>
              {/* One shared screen: the tip must be the same for everyone.
                  Showing the impostor's tip when the impostor speaks would
                  out them to the whole table. */}
              <p className="text-lg text-ink-muted">{t("discussion.speakerTip")}</p>
            </div>
            <Button variant="primary" onClick={() => dispatch({ type: "NEXT_TURN" })} className="text-xl">
              {t("discussion.saidMyWord")}
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          onClick={() => {
            setVoterIndex(0);
            dispatch({ type: "SKIP_TO_VOTING" });
          }}
        >
          {t("discussion.goToVoteButton")}
        </Button>
      </div>
    );
  }

  if (state.phase === "voting") {
    const aliveRoundPlayers = roundPlayers.filter((p) => state.aliveIds.includes(p.id));
    const voter = aliveRoundPlayers[voterIndex];
    const done = voterIndex >= aliveRoundPlayers.length;

    if (done) {
      return (
        <div className="flex flex-col items-center gap-5 w-full text-center py-4">
          <BallotPicto size={72} className="text-game-impostor" />
          <p className="font-display text-2xl text-on-success-surface">{t("voting.voteRegistered")}</p>
          <Button variant="primary" onClick={() => dispatch({ type: "END_VOTING" })} className="text-xl">
            {t("voting.revealResultsButton")}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <BallotPicto size={56} className="text-game-impostor" />
        <p className="font-display text-2xl text-ink-muted">{t("voting.voterTurn", { name: voter?.displayName ?? "" })}</p>
        <h2 className="font-display text-3xl text-ink text-center">{t("voting.title")}</h2>
        <PlayerRoster players={roundPlayers} aliveIds={state.aliveIds} />
        <div className="w-full grid grid-cols-2 gap-3 mt-2">
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
                className="text-xl px-3 break-words"
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
      <div className="flex flex-col items-center gap-6 w-full">
        <EliminationOutcome elimination={elimination} name={eliminatedPlayer?.displayName ?? ""} />
        <Button
          variant="primary"
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
      <div className="flex flex-col items-center gap-6 w-full">
        <OutcomeBlock tone="impostor" picto={<MaskPicto size={72} />} title={t("guessWord.title")}>
          <p className="text-lg font-semibold">{t("guessWord.innocentsPrompt")}</p>
        </OutcomeBlock>
        <div className="flex gap-3 w-full">
          <Button variant="primary" onClick={() => dispatch({ type: "IMPOSTOR_GUESS", correct: true })}>
            {t("guessWord.guessedCorrectly")}
          </Button>
          <Button variant="ghost" onClick={() => dispatch({ type: "IMPOSTOR_GUESS", correct: false })}>
            {t("guessWord.guessedWrong")}
          </Button>
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
      <div className="flex flex-col items-center gap-5 w-full">
        {impostorSurvived ? (
          <OutcomeBlock tone="impostor" picto={<CrownPicto size={64} />} title={t("resolution.impostorSurvived")}>
            <p className="text-lg font-semibold">{t("resolution.survivedCelebration", { names: impostorNames })}</p>
          </OutcomeBlock>
        ) : res?.impostorGuessedWord ? (
          <OutcomeBlock tone="impostor" picto={<MaskPicto size={72} />} title={t("resolution.impostorStoleVictory")} />
        ) : (
          <OutcomeBlock tone="innocent" picto={<StarPicto size={64} />} title={t("resolution.innocentVictory")} />
        )}

        <p className="text-lg text-ink-muted text-center">
          {t("resolution.secretWordWas")}
          <span className="font-display text-3xl text-accent block mt-1">{state.secretWord?.word}</span>
        </p>

        <Scoreboard
          title={t("resolution.scoresTitle")}
          entries={roundPlayers.map((p) => ({
            id: p.id,
            icon: state.impostorIds.includes(p.id) ? (
              <MaskPicto size={28} className="text-action-primary shrink-0" />
            ) : (
              <BubblePicto size={28} className="text-success shrink-0" />
            ),
            label: <span className="text-lg text-ink font-bold">{p.displayName}</span>,
            value: <span className="font-mono text-gold font-bold text-lg">{state.scores[p.id] || 0} pts</span>,
          }))}
        />
        <Button
          variant="primary"
          onClick={() => {
            resetReveal();
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
