"use client";

import { useTranslations, useLocale } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { ImpostorState, ImpostorAction } from "../reducer";
import { maxImpostorsFor } from "../reducer";
import { pickWordAndImpostors } from "../pickRound";
import { PlayerRoster } from "./PlayerRoster";
import { Button, Card, RevealCard, Scoreboard, WaitingState } from "@/components/ui";

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
  const tConfig = useTranslations("games.impostor.config");
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
        <Card className="flex flex-col items-center justify-center space-y-8 w-full max-w-2xl mx-auto">
          <h2 className="font-display text-4xl text-ink text-center">{t("config.title")}</h2>

          <div className="w-full space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="text-ink-muted font-bold">{tConfig("impostorCount")}</label>
              <select
                className="bg-surface-sunken border-2 border-line text-ink p-4 rounded-xl font-semibold outline-none focus-visible:border-focus"
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

            <div className="flex flex-col space-y-2">
              <label className="text-ink-muted font-bold">{tConfig("hintDifficulty")}</label>
              <select
                className="bg-surface-sunken border-2 border-line text-ink p-4 rounded-xl font-semibold outline-none focus-visible:border-focus"
                value={state.hintDifficulty}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CONFIG",
                    impostorCount: state.impostorCount,
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

            {notEnoughPlayers ? (
              <div className="bg-danger-surface text-on-danger-surface p-4 rounded-xl text-center font-bold border border-action-danger/30">
                {t("config.notEnoughPlayersFor", { min: Math.max(3, minPlayersNeeded) })}
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  const { word, shuffledPlayerIds } = pickWordAndImpostors(players, locale, state.usedWordIds);
                  dispatch({
                    type: "START_GAME",
                    playerIds: players.map((p) => p.id),
                    shuffledPlayerIds,
                    word,
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

  if (state.phase === "role_reveal") {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-sm mx-auto mt-4">
        <h2 className="font-display text-2xl text-ink text-center">{t("roleReveal.title")}</h2>

        <RevealCard
          hidden={
            <div className="text-center space-y-4">
              <div className="text-6xl">👁️</div>
              <p className="text-ink-muted font-bold">{t("roleReveal.holdToReveal")}</p>
              <p className="text-xs text-ink-muted">{t("roleReveal.dontLetOthersLook")}</p>
            </div>
          }
          revealed={
            isImpostor ? (
              <div className="text-center space-y-6">
                <div className="text-8xl">🕵️</div>
                <h3 className="font-display text-3xl text-penumbra-danger">{t("roleReveal.youAreImpostor")}</h3>

                {state.hintDifficulty !== "none" && secretWord && (
                  <div className="border border-penumbra-danger/40 p-4 rounded-xl mt-4">
                    <p className="text-sm text-penumbra-danger uppercase tracking-widest font-bold mb-1">
                      {t("roleReveal.yourClue")}
                    </p>
                    <p className="text-xl text-on-penumbra font-bold">
                      {state.hintDifficulty === "hard" ? secretWord.category : secretWord.easyHint}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="text-8xl">🤫</div>
                <h3 className="text-xl font-bold text-on-penumbra-muted">{t("roleReveal.secretWordIs")}</h3>
                <p className="font-display text-4xl text-penumbra-success px-6 py-3 rounded-2xl border border-penumbra-success/40">
                  {secretWord?.word}
                </p>
              </div>
            )
          }
        />

        {isHost && (
          <Button variant="ghost" onClick={() => dispatch({ type: "PROCEED_TO_DISCUSSION" })} className="mt-8">
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
      <div className="flex flex-col items-center justify-center space-y-6 text-center mt-10 px-4">
        <h2 className="font-display text-3xl text-ink">{t("discussion.title")}</h2>

        <PlayerRoster players={players} aliveIds={state.aliveIds} />

        <Card className="max-w-sm w-full">
          <div className="text-4xl mb-4">{isImpostor ? "🕵️" : "💬"}</div>
          <p className="text-lg text-ink font-semibold">
            {isImpostor ? t("discussion.impostorTip") : t("discussion.innocentTip")}
          </p>
        </Card>

        {everyoneSpoke ? (
          <p className="text-ink-muted font-bold">{t("discussion.everyoneSpoke")}</p>
        ) : isMyTurn ? (
          <div className="w-full max-w-sm space-y-4">
            <p className="text-2xl font-black text-action-secondary motion-pulse">{t("discussion.yourTurn")}</p>
            <Button variant="primary" onClick={() => dispatch({ type: "NEXT_TURN" })} className="text-xl">
              {t("discussion.saidMyWord")}
            </Button>
          </div>
        ) : currentSpeaker ? (
          <p className="text-ink-muted">
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
          <Button variant="danger" onClick={() => dispatch({ type: "SKIP_TO_VOTING" })} className="mt-4 max-w-sm">
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
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
        <div className="text-4xl">🗳️</div>
        <h2 className="font-display text-2xl text-ink text-center">{t("voting.title")}</h2>

        <p className="text-lg text-ink-muted">
          {t("voting.votesCount", { cast: totalVotes, total: alivePlayers.length })}
        </p>

        <PlayerRoster players={players} aliveIds={state.aliveIds} />

        {!isAlive ? (
          <Card className="mt-4 w-full text-center">
            <p className="text-ink-muted">{t("voting.eliminatedSpectating")}</p>
          </Card>
        ) : !hasVoted ? (
          <div className="w-full space-y-3 mt-4">
            {alivePlayers
              .filter((p) => p.id !== playerId)
              .map((target) => (
                <Button
                  key={target.id}
                  variant="ghost"
                  onClick={() => dispatch({ type: "CAST_VOTE", voterId: playerId, votedId: target.id })}
                  className="text-xl"
                >
                  {target.displayName}
                </Button>
              ))}
          </div>
        ) : (
          <div className="bg-success-surface border border-action-primary/30 p-8 rounded-2xl mt-4 w-full text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-on-success-surface">{t("voting.voteRegistered")}</h3>
            <p className="text-ink-muted mt-2">{t("voting.waitingForOthers")}</p>
          </div>
        )}

        {isHost && allVoted && (
          <Button variant="primary" onClick={() => dispatch({ type: "END_VOTING" })} className="mt-8 motion-pulse">
            {t("voting.revealResultsButton")}
          </Button>
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
            <h2 className="font-display text-2xl text-ink text-center">{t("eliminationResult.tie")}</h2>
          </>
        ) : elimination.wasImpostor ? (
          <>
            <div className="text-6xl">🕵️</div>
            <h2 className="font-display text-2xl text-action-danger text-center">
              {t("eliminationResult.wasImpostor", { name: eliminatedPlayer?.displayName ?? "" })}
            </h2>
            <p className="text-ink-muted text-center">{t("eliminationResult.gameContinues")}</p>
          </>
        ) : (
          <>
            <div className="text-6xl">😬</div>
            <h2 className="font-display text-2xl text-ink text-center">
              {t("eliminationResult.wasInnocent", { name: eliminatedPlayer?.displayName ?? "" })}
            </h2>
            <p className="text-ink-muted text-center">{t("eliminationResult.gameContinues")}</p>
          </>
        )}

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
      <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-sm mx-auto mt-4 px-4">
        <h2 className="font-display text-4xl text-action-danger text-center">{t("guessWord.title")}</h2>

        <Card className="text-center w-full">
          <div className="text-6xl mb-6">{isImpostor ? "😬" : "🎉"}</div>

          <p className="text-xl text-ink font-bold mb-4">
            {isImpostor ? t("guessWord.impostorPrompt") : t("guessWord.innocentsPrompt")}
          </p>
        </Card>

        {isHost && (
          <div className="w-full space-y-4 pt-4 border-t border-line">
            <p className="text-sm text-ink-muted font-bold text-center uppercase tracking-widest">
              {t("guessWord.hostControls")}
            </p>
            <div className="flex space-x-4">
              <Button variant="primary" onClick={() => dispatch({ type: "IMPOSTOR_GUESS", correct: true })}>
                {t("guessWord.guessedCorrectly")}
              </Button>
              <Button variant="danger" onClick={() => dispatch({ type: "IMPOSTOR_GUESS", correct: false })}>
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
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        {impostorSurvived ? (
          <div className="w-full text-center space-y-3 bg-surface-sunken border-2 border-action-secondary/40 rounded-3xl py-8 px-4">
            <div className="text-6xl">👑</div>
            <h2 className="font-display text-3xl text-action-secondary leading-tight">
              {t("resolution.impostorSurvived")}
            </h2>
            <p className="text-lg text-ink-muted font-semibold">
              {t("resolution.survivedCelebration", { names: impostorNames })}
            </p>
          </div>
        ) : (
          <h2 className="font-display text-4xl text-ink text-center leading-tight motion-celebrate">
            {res?.impostorGuessedWord ? t("resolution.impostorStoleVictory") : t("resolution.innocentVictory")}
          </h2>
        )}

        <div className="text-xl text-ink-muted text-center">
          {t("resolution.secretWordWas")}
          <br />
          <span className="font-display text-3xl text-action-secondary block mt-2">{state.secretWord?.word}</span>
        </div>

        <Card className="w-full">
          <Scoreboard
            title={t("resolution.scoresTitle")}
            entries={players.map((p) => {
              const wasImpostor = state.impostorIds.includes(p.id);
              const gained = res?.pointsAwarded[p.id] || 0;
              return {
                id: p.id,
                icon: <span className="text-xl">{wasImpostor ? "🕵️" : "🧑‍🤝‍🧑"}</span>,
                label: <span className="text-lg font-bold text-ink truncate max-w-[100px]">{p.displayName}</span>,
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
        </Card>

        {isHost && (
          <Button variant="ghost" onClick={() => dispatch({ type: "PLAY_AGAIN" })} className="mt-6">
            {t("resolution.nextRoundButton")}
          </Button>
        )}
      </div>
    );
  }

  return null;
}
