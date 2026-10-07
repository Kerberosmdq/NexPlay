"use client";

import { useTranslations } from "next-intl";
import type { BattleshipAction, BattleshipSide, BattleshipState } from "../reducer";
import { shipTypeAt, type ShipPlacement } from "../placement";
import { Button, Picto, ToyConfetti, WaitingState } from "@/components/ui";
import { useCueOnMount } from "@/lib/feedback/react";
import { BoardGrid, EMPTY_CELL, MISS_CELL } from "./BoardGrid";

/** An anchor: the game's pictogram for the end of a match. */
function AnchorPicto({ size }: { size: number }) {
  return (
    <Picto size={size}>
      <circle cx="24" cy="9" r="4" />
      <path d="M24 13v29M15 21h18" />
      <path d="M8 28c0 8 7 14 16 14s16-6 16-14" />
      <path d="M8 28l-3 4M40 28l3 4" />
    </Picto>
  );
}

/** A side's revealed fleet with every shot it took: misses in water, hits as
 * red pegs in the ships. */
function RevealedBoard({ state, side, fleet }: { state: BattleshipState; side: BattleshipSide; fleet: ShipPlacement[] }) {
  const shots = state.shots[side];
  return (
    <BoardGrid
      boardSize={state.boardSize}
      ships={fleet}
      hitCells={Object.entries(shots)
        .filter(([, r]) => r === "hit")
        .map(([c]) => c)}
      cellClassName={(_r, _c, cell) =>
        shipTypeAt(fleet, cell) ? "bg-transparent" : shots[cell] === "miss" ? MISS_CELL : EMPTY_CELL
      }
    />
  );
}

/** The end of a match: who won, and both fleets revealed with every peg in
 * (ADR-0005 §3 — nothing is secret once the match is over; TASK-0048 added
 * the winner's fleet, so each player sees where the other had hidden). */
export function Resolution({
  state,
  mySide,
  opponentName,
  isHost,
  dispatch,
}: {
  state: BattleshipState;
  mySide: BattleshipSide;
  opponentName: string;
  isHost: boolean;
  dispatch: (action: BattleshipAction) => void;
}) {
  const t = useTranslations("Battleship");
  const won = state.winner === mySide;
  const opponentSide: BattleshipSide = mySide === "A" ? "B" : "A";
  const theirFleet = state.revealedFleets[opponentSide];
  const myFleet = state.revealedFleets[mySide];
  useCueOnMount(won ? "win" : "lose");

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="motion-celebrate w-full rounded-[1.75rem] bg-water text-on-water px-5 py-6 flex flex-col items-center gap-2 shadow-[0_var(--edge-lg)_0_var(--color-edge-ground)]">
        {won && <ToyConfetti />}
        <AnchorPicto size={64} />
        <h2 className="font-display text-3xl text-center leading-tight">
          {won ? t("resolution.youWon") : t("resolution.youLost")}
        </h2>
      </div>

      <div className="w-full grid gap-5 landscape:grid-cols-2">
        <div className="space-y-2">
          <p className="text-base font-bold text-ink-muted text-center">{t("resolution.theirFleetLabel", { name: opponentName })}</p>
          {theirFleet ? (
            <RevealedBoard state={state} side={opponentSide} fleet={theirFleet} />
          ) : (
            <WaitingState label={t("resolution.waitingForReveal")} />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-base font-bold text-ink-muted text-center">{t("resolution.yourFleetLabel")}</p>
          {myFleet ? (
            <RevealedBoard state={state} side={mySide} fleet={myFleet} />
          ) : (
            <WaitingState label={t("resolution.waitingForReveal")} />
          )}
        </div>
      </div>

      {isHost && (
        <Button variant="primary" onClick={() => dispatch({ type: "PLAY_AGAIN" })}>
          {t("resolution.nextRoundButton")}
        </Button>
      )}
    </div>
  );
}
