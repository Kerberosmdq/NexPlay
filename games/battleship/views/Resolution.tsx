"use client";

import { useTranslations } from "next-intl";
import type { BattleshipAction, BattleshipSide, BattleshipState } from "../reducer";
import { shipTypeAt } from "../placement";
import { Button, Picto, WaitingState } from "@/components/ui";
import { BoardGrid, EMPTY_CELL } from "./BoardGrid";

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

/** The end of a match: who won, and the losing side's fleet revealed
 * (ADR-0005 §3 — no longer secret once the match is over). */
export function Resolution({
  state,
  mySide,
  isHost,
  dispatch,
}: {
  state: BattleshipState;
  mySide: BattleshipSide;
  isHost: boolean;
  dispatch: (action: BattleshipAction) => void;
}) {
  const t = useTranslations("Battleship");
  const won = state.winner === mySide;
  const loserSide = state.winner ? (state.winner === "A" ? "B" : "A") : null;
  const revealedFleet = loserSide ? state.revealedFleets[loserSide] : undefined;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="motion-celebrate w-full rounded-[1.75rem] bg-water text-on-water px-5 py-6 flex flex-col items-center gap-2 shadow-[0_var(--edge-lg)_0_var(--color-edge-ground)]">
        <AnchorPicto size={64} />
        <h2 className="font-display text-3xl text-center leading-tight">
          {won ? t("resolution.youWon") : t("resolution.youLost")}
        </h2>
      </div>

      {revealedFleet ? (
        <div className="w-full space-y-2">
          <p className="text-base font-bold text-ink-muted text-center">{t("resolution.revealedFleetLabel")}</p>
          <BoardGrid
            boardSize={state.boardSize}
            ships={revealedFleet}
            cellClassName={(_r, _c, cell) => (shipTypeAt(revealedFleet, cell) ? "bg-transparent" : EMPTY_CELL)}
          />
        </div>
      ) : (
        <WaitingState label={t("resolution.waitingForReveal")} />
      )}

      {isHost && (
        <Button variant="primary" onClick={() => dispatch({ type: "PLAY_AGAIN" })}>
          {t("resolution.nextRoundButton")}
        </Button>
      )}
    </div>
  );
}
