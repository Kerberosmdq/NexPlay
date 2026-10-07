"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Player, PrivateStateUpdater } from "@/lib/types/room";
import type { GuessWhoState, GuessWhoAction, GuessWhoPrivate, Side } from "../reducer";
import { otherSide } from "../reducer";
import { GUESS_WHO_CHARACTERS } from "../content/characters";
import { CharacterCard } from "./CharacterCard";
import { Button, WaitingState, ConfirmDialog } from "@/components/ui";
import { CharacterBoard, FacePicto, ResultBlock, toggleCrossedOut } from "./parts";

interface PlayerProps {
  state: GuessWhoState;
  players: Player[];
  playerId?: string;
  dispatch: (action: GuessWhoAction) => void;
  privateState?: GuessWhoPrivate;
  setPrivateState?: PrivateStateUpdater<GuessWhoPrivate>;
}

function nameFor(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.displayName ?? id;
}

function characterById(id: string) {
  return GUESS_WHO_CHARACTERS.find((c) => c.id === id);
}

export function PlayerView({ state, players, playerId, dispatch, privateState, setPrivateState }: PlayerProps) {
  const t = useTranslations("GuessWho");

  const me = players.find((p) => p.id === playerId) ?? players.find((p) => p.isHost);
  const isHost = me?.isHost || false;

  const mySide: Side | undefined = state.sides.A === playerId ? "A" : state.sides.B === playerId ? "B" : undefined;

  const [crossedOut, setCrossedOut] = useState<Set<string>>(new Set());
  const [guessing, setGuessing] = useState(false);
  const [guessCandidateId, setGuessCandidateId] = useState<string | null>(null);

  // Founder feedback (2026-07-28): the secret character used to be
  // auto-assigned at random the instant a device got a real private slice —
  // the actual game is *choosing* who you are, not being handed a random
  // identity. Picking now happens in the "selecting" render branch below,
  // driven by the player's own tap + a "Confirmar" button dispatching
  // `CONFIRM_CHARACTER`.
  //
  // This still clears the private slice on every fresh entry into
  // "selecting" (not just when it's already null), because
  // `usePrivateState`'s storage key is scoped to (room, game, player) — not
  // to the individual match. Without this, a `PLAY_AGAIN` rematch would
  // silently keep the previous match's grid selection pre-filled with a
  // character the opponent already saw revealed at the last resolution.
  const lastSelectingEntryRef = useRef<boolean>(false);
  useEffect(() => {
    if (!setPrivateState) return;
    const enteringSelecting = state.phase === "selecting" && !lastSelectingEntryRef.current;
    lastSelectingEntryRef.current = state.phase === "selecting";
    if (!enteringSelecting) return;
    setPrivateState({ myCharacterId: null });
  }, [state.phase, setPrivateState]);

  // Once resolved, this device's own character is no longer secret —
  // reveal it, same ADR-0005 §3 exception Battleship's REVEAL_FLEET uses.
  useEffect(() => {
    if (state.phase !== "resolution") return;
    if (!mySide || !privateState?.myCharacterId) return;
    if (state.revealedCharacters[mySide]) return;
    dispatch({ type: "REVEAL_CHARACTER", side: mySide, characterId: privateState.myCharacterId });
  }, [state.phase, state.revealedCharacters, mySide, privateState, dispatch]);

  if (state.phase === "config") {
    return <WaitingState label={t("waitingForOpponent")} />;
  }

  if (state.phase === "selecting") {
    const iAmReady = mySide ? state.readySides[mySide] : false;

    if (iAmReady) {
      return <WaitingState label={t("waitingForOpponentToChoose")} />;
    }

    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <FacePicto size={56} className="text-game-guess-who" />
        <h2 className="font-display text-3xl text-ink text-center">{t("selectingTitle")}</h2>
        <p className="text-base text-ink-muted text-center">{t("selectingHint")}</p>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 w-full">
          {GUESS_WHO_CHARACTERS.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              selected={privateState?.myCharacterId === character.id}
              onClick={() => setPrivateState?.({ myCharacterId: character.id })}
            />
          ))}
        </div>

        <Button
          variant="primary"
          disabled={!privateState?.myCharacterId}
          onClick={() => mySide && dispatch({ type: "CONFIRM_CHARACTER", side: mySide })}
        >
          {t("confirmCharacterButton")}
        </Button>
      </div>
    );
  }

  if (state.phase === "resolution") {
    const won = mySide !== undefined && state.winnerSide === mySide;
    const myCharacter = mySide ? state.revealedCharacters[mySide] : undefined;
    const opponentSide = mySide ? otherSide(mySide) : undefined;
    const opponentCharacter = opponentSide ? state.revealedCharacters[opponentSide] : undefined;

    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <ResultBlock title={won ? t("youWon") : t("youLost")} />

        <div className="flex gap-6 justify-center flex-wrap">
          <div className="flex flex-col items-center gap-2">
            <p className="text-base font-bold text-ink-muted">{t("yourCharacterLabel")}</p>
            {myCharacter ? <CharacterCard character={characterById(myCharacter)!} size="large" /> : <WaitingState label="..." />}
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-base font-bold text-ink-muted">{t("opponentCharacterLabel")}</p>
            {opponentCharacter ? (
              <CharacterCard character={characterById(opponentCharacter)!} size="large" />
            ) : (
              <WaitingState label="..." />
            )}
          </div>
        </div>

        {isHost && (
          <Button variant="primary" onClick={() => dispatch({ type: "PLAY_AGAIN" })}>
            {t("playAgainButton")}
          </Button>
        )}
      </div>
    );
  }

  const opponentSide: Side | undefined = mySide ? otherSide(mySide) : undefined;
  const opponentName = opponentSide && state.sides[opponentSide] ? nameFor(players, state.sides[opponentSide]) : "";
  const myCharacter = privateState?.myCharacterId ? characterById(privateState.myCharacterId) : undefined;
  const guessCandidate = guessCandidateId ? characterById(guessCandidateId) : undefined;
  const guessPending = state.pendingGuess !== null;

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="w-full flex items-center gap-4 bg-surface-sunken rounded-2xl px-4 py-3">
        {myCharacter && (
          <div className="w-16 shrink-0">
            <CharacterCard character={myCharacter} />
          </div>
        )}
        <div className="min-w-0 text-left">
          {myCharacter && <p className="text-base font-bold text-ink-muted">{t("yourCharacterLabel")}</p>}
          <p className="text-lg font-bold text-ink">{t("askAloudHint", { name: opponentName })}</p>
        </div>
      </div>

      {guessPending ? (
        <WaitingState label={t("resolvingGuess")} />
      ) : (
        <Button variant={guessing ? "ghost" : "primary"} onClick={() => setGuessing((g) => !g)}>
          {guessing ? t("cancelGuessButton") : t("startGuessButton")}
        </Button>
      )}

      <CharacterBoard
        crossedOut={crossedOut}
        guessing={guessing}
        disabled={guessPending}
        onCardClick={(characterId) => {
          if (guessing) setGuessCandidateId(characterId);
          else setCrossedOut((prev) => toggleCrossedOut(prev, characterId));
        }}
      />

      {guessCandidate && mySide && (
        <ConfirmDialog
          title={t("confirmGuessTitle")}
          message={t("confirmGuessMessage", { name: guessCandidate.name })}
          confirmLabel={t("confirmGuessConfirmButton")}
          cancelLabel={t("confirmGuessCancelButton")}
          onCancel={() => setGuessCandidateId(null)}
          onConfirm={() => {
            dispatch({ type: "GUESS", guesserSide: mySide, characterId: guessCandidate.id });
            setGuessCandidateId(null);
            setGuessing(false);
          }}
        />
      )}
    </div>
  );
}
