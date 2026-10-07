"use client";

import { useState } from "react";
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
  placeShipAt,
  rotateShipInPlace,
  type ShipPlacement,
  type ShipSpec,
  type Orientation,
} from "../placement";
import { Button, WaitingState } from "@/components/ui";
import { playCue } from "@/lib/feedback";
import { BoardGrid, EMPTY_CELL } from "./BoardGrid";
import { ToyShip } from "./ToyShip";

/** An in-progress press on the board: placing a ship from the shipyard
 * ("new") or moving one already on the board ("move"). `grab` is where on the
 * ship the press landed, so a moved ship doesn't jump to put its bow under
 * the finger; `moved` tells a drag from a tap. */
type Drag = {
  mode: "new" | "move";
  spec: ShipSpec;
  orientation: Orientation;
  grab: { row: number; col: number };
  anchor: { row: number; col: number };
  moved: boolean;
};

function clampAnchor(row: number, col: number, spec: ShipSpec, orientation: Orientation, boardSize: number) {
  const maxRow = orientation === "vertical" ? boardSize - spec.length : boardSize - 1;
  const maxCol = orientation === "horizontal" ? boardSize - spec.length : boardSize - 1;
  return { row: Math.min(Math.max(row, 0), maxRow), col: Math.min(Math.max(col, 0), maxCol) };
}

/** The "placing" phase, as a shipyard (TASK-0048). Every ship waits in a tray
 * under the board; the captain picks any ship, in any order, and taps or
 * drags it onto the board. Tapping a placed ship turns it in place; dragging
 * it moves it. Dragged by a finger, a new ship sits one row above the touch
 * point, so the finger doesn't hide it. A non-captain teammate (M4c) watches
 * the captain's fleet appear live. */
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
  const [selectedType, setSelectedType] = useState<string | null>(state.fleetSpec[0]?.type ?? null);
  const [newOrientation, setNewOrientation] = useState<Orientation>("horizontal");
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hint, setHint] = useState<"pick" | "place" | "rotate" | "noFit" | "noRotate">("place");

  const iAmReady = state.readySides[mySide];

  if (!isCaptain) {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <h2 className="font-display text-3xl text-ink text-center">{t("placing.title")}</h2>
        <WaitingState label={iAmReady ? t("placing.waitingForOpponentReady") : t("placing.watchingCaptainHint")} />
        <BoardGrid
          boardSize={state.boardSize}
          ships={effectiveFleet}
          coords
          cellClassName={(_r, _c, cell) => (shipTypeAt(effectiveFleet, cell) ? "bg-transparent" : EMPTY_CELL)}
        />
      </div>
    );
  }

  const placedTypes = new Set(fleet.map((s) => s.type));
  const fleetReady = isFleetComplete(fleet, state.fleetSpec);
  const setFleet = (next: ShipPlacement[]) => setPrivateState?.({ fleet: next });
  const nextUnplaced = (after: ShipPlacement[]) =>
    state.fleetSpec.find((spec) => !after.some((s) => s.type === spec.type))?.type ?? null;

  // The ship being dragged is drawn as a ghost; while moving one, the board
  // shows the rest of the fleet without it.
  const ghostCells = drag?.moved
    ? shipCells(drag.anchor.row, drag.anchor.col, drag.spec.length, drag.orientation, state.boardSize)
    : null;
  const shipsOnBoard = drag?.mode === "move" && drag.moved ? fleet.filter((s) => s.type !== drag.spec.type) : fleet;
  const ghostValid = Boolean(ghostCells && canPlaceShip(shipsOnBoard, ghostCells));

  const handleDragStart = (row: number, col: number) => {
    if (iAmReady || !setPrivateState) return;
    const existing = shipAt(fleet, `${row}-${col}`);
    if (existing) {
      const anchor = anchorOf(existing);
      setDrag({
        mode: "move",
        spec: { type: existing.type, length: existing.cells.length },
        orientation: orientationOf(existing),
        grab: { row: row - anchor.row, col: col - anchor.col },
        anchor,
        moved: false,
      });
      return;
    }
    const spec = state.fleetSpec.find((s) => s.type === selectedType);
    if (!spec) {
      setHint("pick");
      return;
    }
    setDrag({
      mode: "new",
      spec,
      orientation: newOrientation,
      grab: { row: 0, col: 0 },
      anchor: clampAnchor(row, col, spec, newOrientation, state.boardSize),
      moved: false,
    });
  };

  const handleDragMove = (row: number, col: number, pointer: string) => {
    setDrag((d) => {
      if (!d) return d;
      // A new ship rides one row above a finger; a grabbed ship keeps the
      // spot it was grabbed by, so it doesn't jump.
      const lift = d.mode === "new" && pointer === "touch" ? 1 : 0;
      const anchor = clampAnchor(row - d.grab.row - lift, col - d.grab.col, d.spec, d.orientation, state.boardSize);
      return { ...d, anchor, moved: true };
    });
  };

  const handleDragEnd = () => {
    const d = drag;
    setDrag(null);
    if (!d || !setPrivateState) return;

    if (d.mode === "move" && !d.moved) {
      // A tap on a placed ship turns it.
      const turned = rotateShipInPlace(fleet, d.spec.type, state.boardSize);
      if (turned) {
        setFleet(turned);
        playCue("select");
        setHint("rotate");
      } else {
        playCue("wrong");
        setHint("noRotate");
      }
      return;
    }

    const placed = placeShipAt(fleet, d.spec, d.anchor.row, d.anchor.col, d.orientation, state.boardSize);
    if (!placed) {
      playCue("wrong");
      setHint("noFit");
      return;
    }
    setFleet(placed);
    playCue("drop");
    if (d.mode === "new") {
      setNewOrientation(d.orientation);
      const next = nextUnplaced(placed);
      setSelectedType(next);
      setHint(next ? "place" : "rotate");
    }
  };

  const hintText = {
    pick: t("placing.pickShipHint"),
    place: t("placing.tapCellHint"),
    rotate: t("placing.tapToRotateHint"),
    noFit: t("placing.doesNotFitHint"),
    noRotate: t("placing.cannotRotateHint"),
  }[fleetReady && hint === "place" ? "rotate" : hint];

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <h2 className="font-display text-3xl text-ink text-center">{t("placing.title")}</h2>

      {iAmReady ? (
        <WaitingState label={t("placing.waitingForOpponentReady")} />
      ) : (
        <>
          <p
            role="status"
            className={`w-full text-center rounded-2xl px-4 py-2 font-bold ${
              hint === "noFit" || hint === "noRotate" ? "bg-danger-surface text-on-danger-surface" : "bg-ink text-on-ground"
            }`}
          >
            {hintText}
          </p>

          <div className="w-full max-w-sm">
            <BoardGrid
              boardSize={state.boardSize}
              coords
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              ships={shipsOnBoard}
              ghost={ghostCells && drag ? { cells: ghostCells, type: drag.spec.type, valid: ghostValid } : null}
              cellClassName={() => EMPTY_CELL}
            />
          </div>

          {/* The shipyard: every ship of the fleet, placed or not. */}
          <div className="w-full space-y-2">
            <p className="text-base font-bold text-ink-muted">{t("placing.shipyardLabel")}</p>
            <div className="flex flex-wrap justify-center gap-2 bg-surface-sunken rounded-2xl p-2 shadow-[inset_0_3px_0_var(--color-edge-sunken)]">
              {state.fleetSpec.map((spec) => {
                const placed = placedTypes.has(spec.type);
                const selected = selectedType === spec.type && !placed;
                return (
                  <button
                    key={spec.type}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${tShips(spec.type)} — ${t("placing.cellsLong", { count: spec.length })}`}
                    onClick={() => {
                      playCue("select");
                      if (placed) {
                        // Taking a placed ship back to the yard to place it again.
                        setFleet(fleet.filter((s) => s.type !== spec.type));
                      }
                      setSelectedType(spec.type);
                      setHint("place");
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 pt-2 pb-1 transition-transform focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
                      selected
                        ? "bg-action-secondary -translate-y-1 shadow-[0_var(--edge-sm)_0_var(--color-edge-secondary)]"
                        : placed
                          ? "opacity-40"
                          : "bg-surface-raised shadow-[0_var(--edge-sm)_0_var(--color-edge-raised)]"
                    }`}
                  >
                    <span className="block h-5" style={{ width: `${spec.length * 1.25}rem` }}>
                      <ToyShip type={spec.type} length={spec.length} orientation="horizontal" />
                    </span>
                    <span className="text-xs font-bold text-ink">{tShips(spec.type)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => {
                setFleet(randomFleetPlacement(state.fleetSpec, state.boardSize));
                setSelectedType(null);
                setHint("rotate");
              }}
              className="text-lg px-3"
            >
              {t("placing.randomButton")}
            </Button>
            <Button
              variant="primary"
              onClick={() => dispatch({ type: "SIDE_READY", side: mySide })}
              disabled={!fleetReady}
              className="text-lg px-3"
            >
              {t("placing.readyButton")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
