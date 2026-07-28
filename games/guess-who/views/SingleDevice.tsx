"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { GuessWhoState, GuessWhoAction, Side } from "../reducer";
import { otherSide } from "../reducer";
import { GUESS_WHO_CHARACTERS } from "../content/characters";
import { CharacterCard } from "./CharacterCard";
import { Button, Card, RevealCard, WaitingState, ConfirmDialog } from "@/components/ui";

export interface GuessWhoSingleDeviceProps {
  state: GuessWhoState;
  dispatch: (action: GuessWhoAction) => void;
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

function pickTwoDistinctCharacterIds(): [string, string] {
  const shuffled = [...GUESS_WHO_CHARACTERS].sort(() => Math.random() - 0.5);
  return [shuffled[0].id, shuffled[1].id];
}

function characterById(id: string) {
  return GUESS_WHO_CHARACTERS.find((c) => c.id === id);
}

export function SingleDeviceView({ state, dispatch, onExit }: GuessWhoSingleDeviceProps) {
  const t = useTranslations("GuessWho");

  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  // Unlike multi-device, single-device has no per-device private slice at
  // all (the platform's singleDevice view contract never passes one) — one
  // shared screen sees everything, so both sides' assignments simply live
  // here as plain local state. The reveal-and-pass step below is what
  // keeps them actually secret from each other, not data separation.
  const [assignments, setAssignments] = useState<Record<Side, string> | null>(null);
  const [revealStep, setRevealStep] = useState<"A" | "B" | "done">("A");
  const [crossedOut, setCrossedOut] = useState<Set<string>>(new Set());
  const [guessing, setGuessing] = useState(false);
  const [guesserSide, setGuesserSide] = useState<Side | null>(null);
  const [guessCandidateId, setGuessCandidateId] = useState<string | null>(null);

  // This device plays both roles at once (there is no second device to
  // answer a pending guess), so it resolves its own GUESS immediately —
  // the reducer's GUESS/RESOLVE_GUESS shape stays identical to
  // multi-device's, just both halves dispatched from the same place.
  useEffect(() => {
    if (!state.pendingGuess || !assignments) return;
    const targetSide = otherSide(state.pendingGuess.guesserSide);
    const correct = assignments[targetSide] === state.pendingGuess.characterId;
    dispatch({ type: "RESOLVE_GUESS", correct });
  }, [state.pendingGuess, assignments, dispatch]);

  // Both identities are already known locally the instant the match
  // starts, so both reveal immediately once resolved — no round trip
  // needed the way multi-device's separate devices require one.
  useEffect(() => {
    if (state.phase !== "resolution" || !assignments) return;
    (Object.keys(assignments) as Side[]).forEach((side) => {
      if (!state.revealedCharacters[side]) {
        dispatch({ type: "REVEAL_CHARACTER", side, characterId: assignments[side] });
      }
    });
  }, [state.phase, state.revealedCharacters, assignments, dispatch]);

  if (state.phase === "config") {
    const validNames = names.map((n) => n.trim());
    const canStart = validNames[0].length > 0 && validNames[1].length > 0;

    return (
      <Card className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto">
        <h2 className="font-display text-3xl text-ink text-center">{t("title")}</h2>

        <div className="w-full space-y-3">
          {names.map((name, i) => (
            <input
              key={i}
              value={name}
              onChange={(e) => {
                const next: [string, string] = [...names];
                next[i] = e.target.value;
                setNames(next);
              }}
              placeholder={t("singleDevice.playerNamePlaceholder", { n: i + 1 })}
              className="w-full bg-surface-sunken border-2 border-line text-ink p-3 rounded-xl font-semibold outline-none focus-visible:border-focus"
            />
          ))}
        </div>

        <Button
          variant="primary"
          disabled={!canStart}
          onClick={() => {
            const players = makeLocalPlayers(validNames);
            const [charA, charB] = pickTwoDistinctCharacterIds();
            setLocalPlayers(players);
            setAssignments({ A: charA, B: charB });
            dispatch({ type: "START_MATCH", playerIds: [players[0].id, players[1].id] });
          }}
          className="text-xl py-5"
        >
          {t("singleDevice.startButton")}
        </Button>

        {onExit && (
          <button onClick={onExit} className="text-xs text-ink-muted underline">
            {t("singleDevice.exitButton")}
          </button>
        )}
      </Card>
    );
  }

  const nameOf = (side: Side): string => localPlayers.find((p) => p.id === state.sides[side])?.displayName ?? "";

  if (revealStep !== "done" && assignments) {
    const side = revealStep;
    const character = characterById(assignments[side])!;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
        <p className="text-ink-muted font-bold uppercase tracking-widest text-sm">{nameOf(side)}</p>
        <h2 className="font-display text-2xl text-ink text-center">{t("singleDevice.revealTitle")}</h2>

        <RevealCard
          hidden={
            <div className="text-center space-y-4">
              <div className="text-6xl">👁️</div>
              <p className="text-ink-muted font-bold">{t("singleDevice.holdToReveal")}</p>
              <p className="text-xs text-ink-muted">{t("singleDevice.dontLetOthersLook")}</p>
            </div>
          }
          revealed={<CharacterCard character={character} size="large" />}
        />

        <Button variant="ghost" onClick={() => setRevealStep(side === "A" ? "B" : "done")}>
          {side === "A" ? `➔ ${nameOf("B")}` : t("singleDevice.continueButton")}
        </Button>
      </div>
    );
  }

  if (state.phase === "resolution") {
    const winnerName = state.winnerSide ? nameOf(state.winnerSide) : "";

    return (
      <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2 className="font-display text-4xl text-ink text-center leading-tight motion-celebrate">
          {t("singleDevice.wins", { name: winnerName })}
        </h2>

        <div className="flex gap-6 justify-center flex-wrap">
          {(["A", "B"] as Side[]).map((side) => {
            const charId = state.revealedCharacters[side];
            return (
              <div key={side} className="flex flex-col items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">{nameOf(side)}</p>
                {charId ? <CharacterCard character={characterById(charId)!} size="large" /> : <WaitingState label="..." />}
              </div>
            );
          })}
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            setAssignments((prev) => {
              if (!prev) return prev;
              const [charA, charB] = pickTwoDistinctCharacterIds();
              return { A: charA, B: charB };
            });
            setRevealStep("A");
            setCrossedOut(new Set());
            setGuesserSide(null);
            dispatch({ type: "PLAY_AGAIN" });
          }}
        >
          {t("playAgainButton")}
        </Button>
      </div>
    );
  }

  const guessCandidate = guessCandidateId ? characterById(guessCandidateId) : undefined;
  const guessPending = state.pendingGuess !== null;

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-2xl mx-auto mt-4 px-4">
      <h2 className="font-display text-2xl text-ink text-center">{t("title")}</h2>

      {guessPending ? (
        <WaitingState label={t("resolvingGuess")} />
      ) : guessing && guesserSide === null ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-ink-muted text-center">{t("singleDevice.whoIsGuessing")}</p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth={false} onClick={() => setGuesserSide("A")}>
              {nameOf("A")}
            </Button>
            <Button variant="secondary" fullWidth={false} onClick={() => setGuesserSide("B")}>
              {nameOf("B")}
            </Button>
          </div>
          <button onClick={() => setGuessing(false)} className="text-xs text-ink-muted underline">
            {t("cancelGuessButton")}
          </button>
        </div>
      ) : (
        <Button
          variant={guessing ? "danger" : "secondary"}
          fullWidth={false}
          onClick={() => {
            setGuessing((g) => !g);
            setGuesserSide(null);
          }}
          className="px-8"
        >
          {guessing ? t("cancelGuessButton") : t("startGuessButton")}
        </Button>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 w-full">
        {GUESS_WHO_CHARACTERS.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            crossedOut={crossedOut.has(character.id)}
            onClick={
              guessPending
                ? undefined
                : () => {
                    if (guessing && guesserSide) {
                      setGuessCandidateId(character.id);
                    } else if (!guessing) {
                      setCrossedOut((prev) => {
                        const next = new Set(prev);
                        if (next.has(character.id)) next.delete(character.id);
                        else next.add(character.id);
                        return next;
                      });
                    }
                  }
            }
          />
        ))}
      </div>

      {guessCandidate && guesserSide && (
        <ConfirmDialog
          title={t("confirmGuessTitle")}
          message={t("confirmGuessMessage", { name: guessCandidate.name })}
          confirmLabel={t("confirmGuessConfirmButton")}
          cancelLabel={t("confirmGuessCancelButton")}
          onCancel={() => setGuessCandidateId(null)}
          onConfirm={() => {
            dispatch({ type: "GUESS", guesserSide, characterId: guessCandidate.id });
            setGuessCandidateId(null);
            setGuessing(false);
          }}
        />
      )}
    </div>
  );
}
