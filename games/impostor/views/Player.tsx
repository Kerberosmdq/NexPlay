"use client";

import { useTranslations, useLocale } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { ImpostorState, ImpostorAction } from "../reducer";
import { maxImpostorsFor } from "../reducer";
import { pickWordAndImpostors } from "../pickRound";
import { PlayerRoster } from "./PlayerRoster";
import { Button, RevealCard, Scoreboard, WaitingState } from "@/components/ui";
import {
  EliminationOutcome,
  HintDifficultyPicker,
  ImpostorCountPicker,
  OutcomeBlock,
  RoleRevealContent,
  RoleRevealHidden,
} from "./parts";
import { BallotPicto, BubblePicto, CheckPicto, CrownPicto, MaskPicto, StarPicto } from "./Pictos";

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

export function PlayerView({ state, players, playerId: rawPlayerId, dispatch }: PlayerProps) {
  const t = useTranslations("Impostor");
  const locale = useLocale();

  const me = players.find((p) => p.id === rawPlayerId) ?? players.find((p) => p.isHost);
  const playerId = rawPlayerId ?? me?.id ?? "";
  const isHost = me?.isHost || false;
  const isImpostor = state.impostorIds.includes(playerId);
  const secretWord = state.secretWord;

  if (state.phase === "config") {
    if (isHost) {
      const maxImpostors = maxImpostorsFor(players.length);
      const minPlayersNeeded = 2 * state.impostorCount + 1;
      const notEnoughPlayers = players.length < Math.max(3, minPlayersNeeded);

      return (
        <div className="flex flex-col items-center gap-6 w-full">
          <MaskPicto size={64} className="text-game-impostor" />
          <h2 className="font-display text-3xl text-ink text-center">{t("config.title")}</h2>

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

          <HintDifficultyPicker
            value={state.hintDifficulty}
            onChange={(hintDifficulty) =>
              dispatch({
                type: "SET_CONFIG",
                impostorCount: state.impostorCount,
                votingTimeSeconds: state.votingTimeSeconds,
                hintDifficulty,
              })
            }
          />

          <div className="w-full space-y-2">
            {notEnoughPlayers && (
              <p className="text-base text-ink-muted text-center">
                {t("config.notEnoughPlayersFor", { min: Math.max(3, minPlayersNeeded) })}
              </p>
            )}
            <Button
              variant="primary"
              disabled={notEnoughPlayers}
              onClick={() => {
                const { word, shuffledPlayerIds } = pickWordAndImpostors(players, locale, state.usedWordIds);
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

    return <WaitingState label={t("config.waitingForHost")} />;
  }

  if (state.phase === "role_reveal") {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <h2 className="font-display text-3xl text-ink text-center">{t("roleReveal.title")}</h2>

        <RevealCard
          hidden={<RoleRevealHidden />}
          revealed={
            <RoleRevealContent
              isImpostor={isImpostor}
              hint={
                isImpostor && state.hintDifficulty !== "none" && secretWord
                  ? state.hintDifficulty === "hard"
                    ? secretWord.category
                    : secretWord.easyHint
                  : undefined
              }
              word={secretWord?.word}
            />
          }
        />

        {isHost && (
          <Button variant="ghost" onClick={() => dispatch({ type: "PROCEED_TO_DISCUSSION" })}>
            {t("roleReveal.continueButton")}
          </Button>
        )}
      </div>
    );
  }

  if (state.phase === "discussion") {
    const everyoneSpoke = state.turnIndex >= state.turnOrder.length;
    const currentSpeakerId = everyoneSpoke ? null : state.turnOrder[state.turnIndex];
    const currentSpeaker = players.find((p) => p.id === currentSpeakerId);
    const isMyTurn = currentSpeakerId === playerId;

    return (
      <div className="flex flex-col items-center gap-5 text-center w-full">
        <h2 className="font-display text-3xl text-ink">{t("discussion.title")}</h2>

        <PlayerRoster players={players} aliveIds={state.aliveIds} />

        <div className="w-full flex items-center gap-4 text-left bg-surface-sunken rounded-2xl px-4 py-4">
          {isImpostor ? (
            <MaskPicto size={48} className="shrink-0 text-action-primary" />
          ) : (
            <BubblePicto size={48} className="shrink-0 text-success" />
          )}
          <p className="text-lg text-ink font-semibold">
            {isImpostor ? t("discussion.impostorTip") : t("discussion.innocentTip")}
          </p>
        </div>

        {everyoneSpoke ? (
          <p className="text-lg text-ink-muted font-bold">{t("discussion.everyoneSpoke")}</p>
        ) : isMyTurn ? (
          <div className="w-full space-y-4">
            <p className="font-display text-2xl text-accent motion-pulse">{t("discussion.yourTurn")}</p>
            <Button variant="primary" onClick={() => dispatch({ type: "NEXT_TURN" })} className="text-xl">
              {t("discussion.saidMyWord")}
            </Button>
          </div>
        ) : currentSpeaker ? (
          <p className="text-lg text-ink-muted">
            {t("discussion.waitingForTurn", { name: currentSpeaker.displayName })}
          </p>
        ) : (
          // currentSpeakerId points at a real entry in turnOrder, but it
          // isn't resolvable in the live `players` list right now (e.g. a
          // presence-sync gap with many devices joining at once). Don't
          // show a broken "turn of ..." with a blank name and leave the
          // round stuck on a turn nobody can take — let the host recover.
          <div className="space-y-3">
            <p className="text-ink-muted">{t("discussion.turnUnavailable")}</p>
            {isHost && (
              <Button variant="ghost" onClick={() => dispatch({ type: "NEXT_TURN" })}>
                {t("discussion.skipTurnButton")}
              </Button>
            )}
          </div>
        )}

        {isHost && (
          <Button variant="ghost" onClick={() => dispatch({ type: "SKIP_TO_VOTING" })}>
            {t("discussion.goToVoteButton")}
          </Button>
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
      <div className="flex flex-col items-center gap-4 w-full">
        <BallotPicto size={56} className="text-game-impostor" />
        <h2 className="font-display text-3xl text-ink text-center">{t("voting.title")}</h2>

        <p className="text-lg text-ink-muted font-semibold">
          {t("voting.votesCount", { cast: totalVotes, total: alivePlayers.length })}
        </p>

        <PlayerRoster players={players} aliveIds={state.aliveIds} />

        {!isAlive ? (
          <p className="w-full text-center text-lg text-ink-muted bg-surface-sunken rounded-2xl px-4 py-4">
            {t("voting.eliminatedSpectating")}
          </p>
        ) : !hasVoted ? (
          <div className="w-full grid grid-cols-2 gap-3 mt-2">
            {alivePlayers
              .filter((p) => p.id !== playerId)
              .map((target) => (
                <Button
                  key={target.id}
                  variant="ghost"
                  onClick={() => dispatch({ type: "CAST_VOTE", voterId: playerId, votedId: target.id })}
                  className="text-xl px-3 break-words"
                >
                  {target.displayName}
                </Button>
              ))}
          </div>
        ) : (
          <div className="bg-success-surface px-6 py-6 rounded-2xl w-full flex flex-col items-center gap-2 text-center">
            <CheckPicto size={56} className="text-on-success-surface" />
            <h3 className="font-display text-xl text-on-success-surface">{t("voting.voteRegistered")}</h3>
            <p className="text-base text-ink-muted">{t("voting.waitingForOthers")}</p>
          </div>
        )}

        {isHost && (
          <div className="mt-2 space-y-2 w-full">
            <Button
              variant="primary"
              onClick={() => dispatch({ type: "END_VOTING" })}
              className={allVoted ? "motion-pulse" : ""}
            >
              {t("voting.revealResultsButton")}
            </Button>
            {/* Not everyone has to actually vote for the round to be able to
                continue — a disconnected/reconnected player (or one whose
                vote never registers for any other reason) shouldn't leave
                the host stuck waiting on a vote that may never arrive
                (ADR-0001 §4: the round shouldn't hard-fail on one dropped
                phone). Same host-only escape-hatch pattern as discussion's
                "skip to voting" / "skip this turn". */}
            {!allVoted && <p className="text-sm text-ink-muted text-center">{t("voting.revealAnywayHint")}</p>}
          </div>
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
      <div className="flex flex-col items-center gap-6 w-full">
        <EliminationOutcome elimination={elimination} name={eliminatedPlayer?.displayName ?? ""} />

        {isHost && (
          <Button variant="ghost" onClick={() => dispatch({ type: "PROCEED_TO_DISCUSSION" })}>
            {t("eliminationResult.continueButton")}
          </Button>
        )}
      </div>
    );
  }

  if (state.phase === "guess_word") {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <OutcomeBlock tone="impostor" cue="pop" picto={<MaskPicto size={72} />} title={t("guessWord.title")}>
          <p className="text-lg font-semibold">
            {isImpostor ? t("guessWord.impostorPrompt") : t("guessWord.innocentsPrompt")}
          </p>
        </OutcomeBlock>

        {isHost && (
          <div className="w-full space-y-3">
            <p className="text-base text-ink-muted font-bold text-center">{t("guessWord.hostControls")}</p>
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => dispatch({ type: "IMPOSTOR_GUESS", correct: true })}>
                {t("guessWord.guessedCorrectly")}
              </Button>
              <Button variant="ghost" onClick={() => dispatch({ type: "IMPOSTOR_GUESS", correct: false })}>
                {t("guessWord.guessedWrong")}
              </Button>
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
      <div className="flex flex-col items-center gap-5 w-full">
        {impostorSurvived ? (
          <OutcomeBlock tone="impostor" confetti picto={<CrownPicto size={64} />} title={t("resolution.impostorSurvived")}>
            <p className="text-lg font-semibold">{t("resolution.survivedCelebration", { names: impostorNames })}</p>
          </OutcomeBlock>
        ) : res?.impostorGuessedWord ? (
          <OutcomeBlock tone="impostor" confetti picto={<MaskPicto size={72} />} title={t("resolution.impostorStoleVictory")} />
        ) : (
          <OutcomeBlock tone="innocent" confetti picto={<StarPicto size={64} />} title={t("resolution.innocentVictory")} />
        )}

        <p className="text-lg text-ink-muted text-center">
          {t("resolution.secretWordWas")}
          <span className="font-display text-3xl text-accent block mt-1">{state.secretWord?.word}</span>
        </p>

        <div className="w-full">
          <Scoreboard
            title={t("resolution.scoresTitle")}
            entries={players.map((p) => {
              const wasImpostor = state.impostorIds.includes(p.id);
              const gained = res?.pointsAwarded[p.id] || 0;
              return {
                id: p.id,
                icon: wasImpostor ? (
                  <MaskPicto size={28} className="text-action-primary shrink-0" />
                ) : (
                  <BubblePicto size={28} className="text-success shrink-0" />
                ),
                label: <span className="text-lg font-bold text-ink truncate max-w-[9rem]">{p.displayName}</span>,
                value: (
                  <div className="flex items-center space-x-3 font-mono">
                    <span className="text-on-success-surface font-bold text-sm">+{gained}</span>
                    <span className="text-xl font-bold text-gold w-16 text-right">
                      {state.scores[p.id] || 0} pts
                    </span>
                  </div>
                ),
              };
            })}
          />
        </div>

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
