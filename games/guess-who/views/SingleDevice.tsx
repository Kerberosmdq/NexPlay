"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { GuessWhoState, GuessWhoAction, Side } from "../reducer";
import { otherSide } from "../reducer";
import { GUESS_WHO_CHARACTERS } from "../content/characters";
import { CharacterCard } from "./CharacterCard";
import { Button, KeyRow, WaitingState, ConfirmDialog } from "@/components/ui";
import { loadFamilyRoster, prefillNames, rememberFamilyNames } from "@/lib/family/roster";
import { CharacterBoard, FacePicto, ResultBlock, toggleCrossedOut } from "./parts";

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

const EMPTY_BOARDS: Record<Side, Set<string>> = { A: new Set(), B: new Set() };

export function SingleDeviceView({ state, dispatch }: GuessWhoSingleDeviceProps) {
  const t = useTranslations("GuessWho");

  const [names, setNames] = useState<[string, string]>(() => {
    const [first, second] = prefillNames(loadFamilyRoster(), 2, 2);
    return [first, second];
  });
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
  // Each player keeps their own board of flipped-down cards, like the
  // physical game's two boards. One shared set (what this used to be)
  // mixed both players' eliminations together on a single grid.
  const [crossedOut, setCrossedOut] = useState<Record<Side, Set<string>>>(EMPTY_BOARDS);
  // Whose board is on screen. A guess is made from your own board, so it is
  // also who is guessing — no separate "who is guessing?" step.
  const [boardSide, setBoardSide] = useState<Side>("A");
  const [guessing, setGuessing] = useState(false);
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
      <div className="flex flex-col items-center gap-6 w-full">
        <FacePicto size={64} className="text-game-guess-who" />
        <h2 className="font-display text-3xl text-ink text-center">{t("title")}</h2>

        <div className="w-full space-y-3">
          {names.map((name, i) => (
            <input
              key={i}
              value={name}
              aria-label={t("singleDevice.playerNamePlaceholder", { n: i + 1 })}
              onChange={(e) => {
                const next: [string, string] = [...names];
                next[i] = e.target.value;
                setNames(next);
              }}
              placeholder={t("singleDevice.playerNamePlaceholder", { n: i + 1 })}
              className="w-full bg-surface-sunken border-2 border-transparent text-ink text-xl px-5 py-3 rounded-2xl font-bold placeholder:text-ink-muted placeholder:font-semibold outline-none shadow-[inset_0_3px_0_var(--color-edge-sunken)] focus-visible:border-focus"
            />
          ))}
        </div>

        <div className="w-full space-y-2">
          {!canStart && <p className="text-base text-ink-muted text-center">{t("singleDevice.bothNamesHint")}</p>}
          <Button
            variant="primary"
            disabled={!canStart}
            onClick={() => {
              const players = makeLocalPlayers(validNames);
              rememberFamilyNames(validNames);
              setLocalPlayers(players);
              dispatch({ type: "START_MATCH", playerIds: [players[0].id, players[1].id] });
            }}
            className="text-2xl py-5"
          >
            {t("singleDevice.startButton")}
          </Button>
        </div>
      </div>
    );
  }

  // `localPlayers` is set when the match starts; if this view remounts mid-
  // match it comes back empty. The ids are derived from the names, so
  // rebuild them rather than losing every name on screen.
  const knownPlayers = localPlayers.length > 0 ? localPlayers : makeLocalPlayers(names.map((n) => n.trim()));
  const nameOf = (side: Side): string => knownPlayers.find((p) => p.id === state.sides[side])?.displayName ?? "";

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
        <div className="flex flex-col items-center gap-5 w-full text-center py-6">
          <FacePicto size={72} className="text-game-guess-who" />
          <p className="font-display text-2xl text-ink-muted">{nameOf(side)}</p>
          <h2 className="font-display text-3xl text-ink leading-tight">{t("singleDevice.selectingGateTitle")}</h2>
          <p className="text-lg text-ink-muted">{t("singleDevice.dontLetOthersLook")}</p>
          <Button variant="primary" onClick={() => setUnlockedForPick(true)} className="text-xl">
            {t("singleDevice.selectingGateButton")}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <p className="font-display text-2xl text-ink-muted">{nameOf(side)}</p>
        <h2 className="font-display text-3xl text-ink text-center">{t("selectingTitle")}</h2>
        <p className="text-base text-ink-muted text-center">{t("selectingHint")}</p>

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
        >
          {t("confirmCharacterButton")}
        </Button>
      </div>
    );
  }

  if (state.phase === "resolution") {
    const winnerName = state.winnerSide ? nameOf(state.winnerSide) : "";

    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <ResultBlock title={t("singleDevice.wins", { name: winnerName })} />

        <div className="flex gap-6 justify-center flex-wrap">
          {(["A", "B"] as Side[]).map((side) => {
            const charId = state.revealedCharacters[side];
            return (
              <div key={side} className="flex flex-col items-center gap-2">
                <p className="text-base font-bold text-ink-muted">{nameOf(side)}</p>
                {charId ? <CharacterCard character={characterById(charId)!} size="large" /> : <WaitingState label="..." />}
              </div>
            );
          })}
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setAssignments(null);
            setUnlockedForPick(false);
            setPendingPick(null);
            setCrossedOut(EMPTY_BOARDS);
            setBoardSide("A");
            setGuessing(false);
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
    <div className="flex flex-col items-center gap-5 w-full">
      <KeyRow
        label={t("singleDevice.boardOwnerLabel")}
        value={boardSide}
        onChange={(side) => {
          setBoardSide(side);
          setGuessing(false);
        }}
        options={(["A", "B"] as Side[]).map((side) => ({ value: side, label: nameOf(side) }))}
      />

      <p className="text-lg font-bold text-ink text-center">
        {t("askAloudHint", { name: nameOf(otherSide(boardSide)) })}
      </p>

      {guessPending ? (
        <WaitingState label={t("resolvingGuess")} />
      ) : (
        <Button variant={guessing ? "ghost" : "primary"} onClick={() => setGuessing((g) => !g)}>
          {guessing ? t("cancelGuessButton") : t("startGuessButton")}
        </Button>
      )}

      <CharacterBoard
        crossedOut={crossedOut[boardSide]}
        guessing={guessing}
        disabled={guessPending}
        onCardClick={(characterId) => {
          if (guessing) setGuessCandidateId(characterId);
          else
            setCrossedOut((prev) => ({ ...prev, [boardSide]: toggleCrossedOut(prev[boardSide], characterId) }));
        }}
      />

      {guessCandidate && (
        <ConfirmDialog
          title={t("confirmGuessTitle")}
          message={t("confirmGuessMessage", { name: guessCandidate.name })}
          confirmLabel={t("confirmGuessConfirmButton")}
          cancelLabel={t("confirmGuessCancelButton")}
          onCancel={() => setGuessCandidateId(null)}
          onConfirm={() => {
            dispatch({ type: "GUESS", guesserSide: boardSide, characterId: guessCandidate.id });
            setGuessCandidateId(null);
            setGuessing(false);
          }}
        />
      )}
    </div>
  );
}
