"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { Player, PrivateStateUpdater } from "@/lib/types/room";
import {
  otherSide,
  type BattleshipState,
  type BattleshipAction,
  type BattleshipPrivate,
  type BattleshipSide,
  type BattleshipPhase,
} from "../reducer";
import type { ShipPlacement } from "../placement";
import { useTeamFleetChannel } from "@/lib/realtime/teamState";
import { WaitingState } from "@/components/ui";
import { TeamSetup } from "./TeamSetup";
import { Placement } from "./Placement";
import { Firing } from "./Firing";
import { Resolution } from "./Resolution";
import { useShotFeedback } from "./useShotFeedback";

interface PlayerProps {
  state: BattleshipState;
  players: Player[];
  // Optional because this component also fills the `host` view slot, whose
  // contract doesn't guarantee a playerId — same fallback pattern as
  // Impostor's PlayerView.
  playerId?: string;
  roomCode: string;
  dispatch: (action: BattleshipAction) => void;
  privateState?: BattleshipPrivate;
  setPrivateState?: PrivateStateUpdater<BattleshipPrivate>;
}

/** Battleship's view for every device. This file owns identity (which side
 * am I, am I the captain), the side's shared fleet channel, and the effects
 * that must run whatever phase is on screen; each phase renders from its
 * own file (`TeamSetup`, `Placement`, `Firing`, `Resolution`), and the board
 * itself lives in `BoardGrid`. Split out of a single 1105-line view in
 * M6.5 (TASK-0046) with behavior unchanged. */
export function PlayerView({
  state,
  players,
  playerId: rawPlayerId,
  roomCode,
  dispatch,
  privateState,
  setPrivateState,
}: PlayerProps) {
  const t = useTranslations("Battleship");

  const me = players.find((p) => p.id === rawPlayerId) ?? players.find((p) => p.isHost);
  const playerId = rawPlayerId ?? me?.id ?? "";
  const isHost = me?.isHost || false;

  const mySide: BattleshipSide | null = state.sides.A.includes(playerId)
    ? "A"
    : state.sides.B.includes(playerId)
      ? "B"
      : null;
  const fleet = privateState?.fleet ?? [];

  // M4c: the captain (`sides[side][0]`) is the one whose `privateState.fleet`
  // is real — a 1-vs-1 match's one player is always their own side's
  // captain, so this is a no-op there. A non-captain teammate's own private
  // slice is never written to (their placement UI is read-only), so their
  // usable fleet is whatever the captain last broadcast on the side channel
  // (ADR-0005 §6), not their own `privateState`.
  const isCaptain = mySide ? state.sides[mySide][0] === playerId : false;
  const [mirroredFleet, setMirroredFleet] = useState<ShipPlacement[]>([]);
  useTeamFleetChannel<ShipPlacement[]>(roomCode, "battleship", mySide ?? "A", isCaptain, fleet, setMirroredFleet);
  const effectiveFleet = isCaptain ? fleet : mirroredFleet;

  const { strikeCells, announcement, dismiss } = useShotFeedback(state, mySide);

  // The other side's name(s) for banners and labels — a team reads as a
  // localized list ("Ana y Leo" / "Ana and Leo").
  const format = useFormatter();
  const sideName = (side: BattleshipSide) =>
    format.list(
      state.sides[side].map((id) => players.find((p) => p.id === id)?.displayName ?? id),
      { type: "conjunction" }
    );

  // ADR-0005: once the match resolves, fleets are no longer secret. Each
  // side's own device reveals its board — the loser's and, since TASK-0048,
  // the winner's too, so both players see both fleets at the end. Every hook
  // must run unconditionally before any phase-based early return below.
  useEffect(() => {
    if (state.phase !== "resolution" || !mySide || !setPrivateState) return;
    if (!isCaptain || state.revealedFleets[mySide]) return;
    dispatch({ type: "REVEAL_FLEET", side: mySide, fleet: effectiveFleet });
    // `effectiveFleet`/`dispatch` are stable enough in practice (new closures
    // each render, but the guards above make this effect a no-op once it has
    // fired) — depending on the full array here would refire on every
    // unrelated private-state change without ever changing the outcome.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.winner, state.revealedFleets, mySide, isCaptain]);

  // A "Jugar de nuevo" rematch reuses the same match, so the platform's
  // match-scoped private-state key (PlatformState.matchNumber) doesn't
  // change and the previous round's fleet would carry over — the board
  // would open on "¡FLOTA LISTA!" with the layout the opponent just spent a
  // whole match learning. PLAY_AGAIN resets `readySides`, so a fresh entry
  // into "placing" is the signal; the ref keeps this from wiping the fleet
  // again on every later render of that same phase (the same guard shape
  // Guess Who uses to re-pick its character on a rematch).
  const prevPhaseRef = useRef<BattleshipPhase | null>(null);
  useEffect(() => {
    const enteringPlacing = state.phase === "placing" && prevPhaseRef.current !== "placing";
    prevPhaseRef.current = state.phase;
    if (!enteringPlacing || !mySide || !setPrivateState) return;
    setPrivateState({ fleet: [] });
    // Keyed on the phase transition rather than on "the board looks fresh":
    // PLAY_AGAIN resets shots and readySides to exactly their start-of-match
    // values, so any snapshot of those is identical between a first
    // placement and a rematch, and the reset would never fire the second
    // time. Staying within "placing" never re-triggers, so this cannot wipe
    // a fleet mid-placement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, mySide]);

  // M4c: a 4-player match starts here, before anyone has a `mySide` yet —
  // must come before the `!mySide` guard below, which would otherwise
  // wrongly show "not in this match" to every unassigned player.
  if (state.phase === "teamSetup") {
    return <TeamSetup state={state} players={players} isHost={isHost} dispatch={dispatch} />;
  }

  if (!mySide) {
    return <WaitingState label={t("notInMatch")} />;
  }

  if (state.phase === "placing") {
    return (
      <Placement
        state={state}
        mySide={mySide}
        isCaptain={isCaptain}
        fleet={fleet}
        effectiveFleet={effectiveFleet}
        setPrivateState={setPrivateState}
        dispatch={dispatch}
      />
    );
  }

  if (state.phase === "firing") {
    return (
      <Firing
        state={state}
        mySide={mySide}
        opponentSide={otherSide(mySide)}
        opponentName={sideName(otherSide(mySide))}
        effectiveFleet={effectiveFleet}
        strikeCells={strikeCells}
        announcement={announcement}
        onDismissAnnouncement={dismiss}
        dispatch={dispatch}
      />
    );
  }

  if (state.phase === "resolution") {
    return (
      <Resolution
        state={state}
        mySide={mySide}
        opponentName={sideName(otherSide(mySide))}
        isHost={isHost}
        dispatch={dispatch}
      />
    );
  }

  return null;
}
