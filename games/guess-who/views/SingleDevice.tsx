"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { GuessWhoState, GuessWhoAction, Side } from "../reducer";
import { otherSide } from "../reducer";
import { GUESS_WHO_CHARACTERS } from "../content/characters";
import { CharacterCard } from "./CharacterCard";
import { Button, Card, WaitingState, ConfirmDialog } from "@/components/ui";

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

function characterById(id: string) {
  return GUESS_WHO_CHARACTERS.find((c) => c.id === id);
}

export function SingleDeviceView({ state, dispatch, onExit }: GuessWhoSingleDeviceProps) {
  const t = useTranslations("GuessWho");

  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  // Unlike multi-device, single-device has no per-device private slice at
  // all (the platform's singleDevice view contract never passes one) — one
  // shared screen sees everything, so both sides' picks simply live here as
  // plain local state. The privacy-gate + pick-then-pass step below is what
  // keeps them actually secret from each other, not data separation.
  const [assignments, setAssignments] = useState<Record<Side, string> | null>(null);
  // "selecting" phase only: whether the *current* picker has confirmed
  // "yes, it's my turn" and can see the grid — reset every time the active
  // side changes, so the next player gets their own privacy gate too.
  const [unlockedForPick, setUnlockedForPick] = useState(false);
  const [pendingPick, setPendingPick] = useState<string | null>(null);
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
            setLocalPlayers(players);
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

  // Founder feedback (2026-07-28): each player now actively chooses their
  // own character instead of being handed a random one. Since single-device
  // has no per-device private slice, the same privacy this game needs comes
  // from a pass-the-phone gate (matching the reveal-and-pass precedent
  // elsewhere in the app) rather than data separation: whoever hasn't
  // confirmed yet must first say "it's me" before the grid appears, so the
  // other player isn't watching them pick.
  if (state.phase === "selecting") {
    const side: Side | null = !state.readySides.A ? "A" : !state.readySides.B ? "B" : null;
    if (!side) return <WaitingState label="..." />; // both confirmed; reducer is about to flip to "playing"

    if (!unlockedForPick) {
      return (
        <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto mt-4">
          <p className="text-ink-muted font-bold uppercase tracking-widest text-sm">{nameOf(side)}</p>
          <h2 className="font-display text-2xl text-ink text-center">{t("singleDevice.selectingGateTitle")}</h2>
          <p className="text-xs text-ink-muted text-center">{t("singleDevice.dontLetOthersLook")}</p>
          <Button variant="primary" onClick={() => setUnlockedForPick(true)} className="max-w-xs">
            {t("singleDevice.selectingGateButton")}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center space-y-6 w-full max-w-2xl mx-auto mt-4 px-4">
        <p className="text-ink-muted font-bold uppercase tracking-widest text-sm">{nameOf(side)}</p>
        <h2 className="font-display text-2xl text-ink text-center">{t("selectingTitle")}</h2>
        <p className="text-sm text-ink-muted text-center">{t("selectingHint")}</p>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 w-full">
          {GUESS_WHO_CHARACTERS.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              selected={pendingPick === character.id}
              onClick={() => setPendingPick(character.id)}
            />
          ))}
        </div>

        <Button
          variant="primary"
          disabled={!pendingPick}
          onClick={() => {
            setAssignments((prev) => ({ ...(prev ?? { A: "", B: "" }), [side]: pendingPick! }));
            dispatch({ type: "CONFIRM_CHARACTER", side });
            setPendingPick(null);
            setUnlockedForPick(false);
          }}
          className="max-w-xs"
        >
          {t("confirmCharacterButton")}
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
            setAssignments(null);
            setUnlockedForPick(false);
            setPendingPick(null);
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
