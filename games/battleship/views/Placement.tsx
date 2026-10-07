"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { PrivateStateUpdater } from "@/lib/types/room";
import type { BattleshipAction, BattleshipPrivate, BattleshipSide, BattleshipState } from "../reducer";
import {
  shipCells,
  canPlaceShip,
  isFleetComplete,
  randomFleetPlacement,
  shipTypeAt,
  shipAt,
  orientationOf,
  anchorOf,
  type ShipPlacement,
  type Orientation,
} from "../placement";
import { Button, WaitingState } from "@/components/ui";
import { BoardGrid, EMPTY_CELL } from "./BoardGrid";

/** The "placing" phase. A side's captain drags each ship onto the board; a
 * non-captain teammate (M4c) watches the captain's fleet appear live. */
export function Placement({
  state,
  mySide,
  isCaptain,
  fleet,
  effectiveFleet,
  setPrivateState,
  dispatch,
}: {
  state: BattleshipState;
  mySide: BattleshipSide;
  isCaptain: boolean;
  fleet: ShipPlacement[];
  effectiveFleet: ShipPlacement[];
  setPrivateState?: PrivateStateUpdater<BattleshipPrivate>;
  dispatch: (action: BattleshipAction) => void;
}) {
  const t = useTranslations("Battleship");
  const tShips = useTranslations("Battleship.ships");
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  // The ghost preview anchor while placing a ship — set by pressing a cell
  // and moved by dragging; released, it commits if valid there.
  const [previewCell, setPreviewCell] = useState<{ row: number; col: number } | null>(null);
  // True for the instant between picking an already-placed ship back up and
  // either moving it or releasing again. A plain tap-to-pick-up (press and
  // release with no movement in between) must NOT re-commit the ship right
  // back where it was — that would silently undo the pickup before the
  // player has a chance to hit the rotate button, which is exactly the "no
  // me deja girarlo" bug: rotating only has an effect while the ship is
  // off the fleet (i.e. while `nextShip` is standing in for it), and that
  // window used to close itself instantly on release.
  const justPickedUpRef = useRef(false);

  const iAmReady = state.readySides[mySide];

  // M4c: a non-captain teammate never edits — they watch the captain's fleet
  // appear live via the side channel (`effectiveFleet`, which for them is
  // the mirrored fleet), same board rendering as their own board during
  // firing.
  if (!isCaptain) {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <h2 className="font-display text-3xl text-ink text-center">{t("placing.title")}</h2>
        <WaitingState label={iAmReady ? t("placing.waitingForOpponentReady") : t("placing.watchingCaptainHint")} />
        <BoardGrid
          boardSize={state.boardSize}
          ships={effectiveFleet}
          cellClassName={(_r, _c, cell) => (shipTypeAt(effectiveFleet, cell) ? "bg-transparent" : EMPTY_CELL)}
        />
      </div>
    );
  }

  const placedTypes = new Set(fleet.map((s) => s.type));
  const nextShip = state.fleetSpec.find((spec) => !placedTypes.has(spec.type));
  const fleetReady = isFleetComplete(fleet, state.fleetSpec);

  // The ghost preview: recomputed from `previewCell` on every render, not
  // stored itself, so rotating or moving the anchor always reflects the
  // current orientation/ship immediately.
  const ghostCells =
    nextShip && previewCell && !iAmReady
      ? shipCells(previewCell.row, previewCell.col, nextShip.length, orientation, state.boardSize)
      : null;
  const ghostValid = Boolean(ghostCells && canPlaceShip(fleet, ghostCells));

  // Founder feedback: this should feel like actually dragging the ship
  // across the board, not tap-somewhere / tap-again / press a separate
  // confirm button. A press starts the drag (picking an already-placed ship
  // back up if the fleet is complete and the press lands on one — gated on
  // `!nextShip` so a second ship can never get silently dropped mid-move),
  // continuous movement updates the ghost in real time, and releasing
  // commits the placement if it's valid there — a quick tap-and-release with
  // no movement in between still works, as a (very short) drag onto the
  // cell you tapped.
  const handleDragStart = (row: number, col: number) => {
    if (iAmReady || !setPrivateState) return;
    justPickedUpRef.current = false;
    if (!nextShip) {
      const existing = shipAt(fleet, `${row}-${col}`);
      if (existing) {
        setPrivateState((prev) => ({ fleet: prev.fleet.filter((s) => s.type !== existing.type) }));
        setOrientation(orientationOf(existing));
        setPreviewCell(anchorOf(existing)); // resumes exactly where it was, no jump on pickup
        justPickedUpRef.current = true;
        return;
      }
    }
    setPreviewCell({ row, col });
  };

  const handleDragEnd = () => {
    // A plain tap that only picked a ship back up (no movement in between)
    // must leave it picked up rather than instantly re-placing it — that
    // instant re-placement was what made the rotate button a no-op right
    // after grabbing an already-placed ship.
    if (justPickedUpRef.current) {
      justPickedUpRef.current = false;
      return;
    }
    if (!nextShip || !ghostCells || !ghostValid || !setPrivateState) return;
    setPrivateState((prev) => ({ fleet: [...prev.fleet, { type: nextShip.type, cells: ghostCells }] }));
    setPreviewCell(null);
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <h2 className="font-display text-3xl text-ink text-center">{t("placing.title")}</h2>

      {iAmReady ? (
        <WaitingState label={t("placing.waitingForOpponentReady")} />
      ) : (
        <>
          <div className="w-full flex items-center gap-3 bg-surface-sunken rounded-2xl px-4 py-3">
            {nextShip && (
              // eslint-disable-next-line @next/next/no-img-element -- a fixed local asset
              <img
                src={`/battleship/${nextShip.type}.png`}
                alt=""
                aria-hidden="true"
                className="w-8 h-14 object-contain shrink-0"
              />
            )}
            <div className="min-w-0 text-left">
              <p className="text-base font-bold text-ink-muted">
                {nextShip ? t("placing.placingShip") : t("placing.fleetComplete")}
              </p>
              {nextShip ? (
                <>
                  <p className="font-display text-xl text-ink leading-tight">
                    {tShips(nextShip.type)} — {t("placing.cellsLong", { count: nextShip.length })}
                  </p>
                  <p className="text-sm text-ink-muted">{t("placing.dragToPlaceHint")}</p>
                </>
              ) : (
                <p className="text-base text-ink-muted">{t("placing.tapToMoveHint")}</p>
              )}
            </div>
          </div>

          <BoardGrid
            boardSize={state.boardSize}
            onDragStart={handleDragStart}
            onDragMove={(row, col) => {
              // Real movement means this is a genuine drag, not a
              // pickup-tap — from here on, releasing should commit.
              justPickedUpRef.current = false;
              setPreviewCell({ row, col });
            }}
            onDragEnd={handleDragEnd}
            ships={fleet}
            ghost={nextShip && ghostCells ? { cells: ghostCells, type: nextShip.type, valid: ghostValid } : null}
            cellClassName={(_r, _c, cell) => {
              if (shipTypeAt(fleet, cell)) return "bg-transparent"; // the ship image itself shows
              if (ghostCells?.includes(cell)) return "bg-transparent"; // the ghost ship image shows instead
              return EMPTY_CELL;
            }}
          />

          {/* Natural-width keys that wrap, not a fixed three-column grid:
              "Horizontal" alone is wider than a third of a 375px tray. */}
          <div className="flex flex-wrap justify-center gap-2 w-full">
            <Button
              variant="ghost"
              onClick={() => setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"))}
              fullWidth={false}
              className="px-4 text-base"
            >
              {orientation === "horizontal" ? t("placing.orientationHorizontal") : t("placing.orientationVertical")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPrivateState?.({ fleet: randomFleetPlacement(state.fleetSpec, state.boardSize) });
                setPreviewCell(null);
              }}
              fullWidth={false}
              className="px-4 text-base"
            >
              {t("placing.randomButton")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPrivateState?.((prev) => ({ fleet: prev.fleet.slice(0, -1) }))}
              fullWidth={false}
              className="px-4 text-base"
              disabled={fleet.length === 0}
            >
              {t("placing.undoButton")}
            </Button>
          </div>

          <Button
            variant="primary"
            onClick={() => dispatch({ type: "SIDE_READY", side: mySide })}
            disabled={!fleetReady}
            className="text-xl"
          >
            {t("placing.readyButton")}
          </Button>
        </>
      )}
    </div>
  );
}
