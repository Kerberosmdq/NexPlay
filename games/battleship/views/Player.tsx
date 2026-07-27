"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Player, PrivateStateUpdater } from "@/lib/types/room";
import {
  otherSide,
  type BattleshipState,
  type BattleshipAction,
  type BattleshipPrivate,
  type BattleshipSide,
  type CellResult,
} from "../reducer";
import { shipCells, canPlaceShip, isFleetComplete, randomFleetPlacement, type ShipPlacement, type Orientation } from "../placement";
import { Button, Card, WaitingState } from "@/components/ui";

type BoardLayout = "stacked" | "side-by-side" | "one-at-a-time";
const BOARD_LAYOUT_STORAGE_KEY = "nexplay:battleship-board-layout";

function isBoardLayout(value: string | null): value is BoardLayout {
  return value === "stacked" || value === "side-by-side" || value === "one-at-a-time";
}

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

function columnLabel(col: number): string {
  return String.fromCharCode(65 + col);
}

function shipTypeAt(fleet: ShipPlacement[], cell: string): string | null {
  return fleet.find((s) => s.cells.includes(cell))?.type ?? null;
}

/** Renders one ship as a single image spanning its full cell footprint,
 * rather than tiling a flat color per cell. The source art
 * (`public/battleship/<type>.png`) is bow-up (a vertical ship, one column
 * wide); a horizontal placement is achieved by sizing the image to its
 * *transposed* footprint and rotating 90° around its own center — the
 * rotated bounding box then exactly matches the horizontal cell span. */
function ShipOverlay({
  boardSize,
  cells,
  type,
}: {
  boardSize: number;
  cells: string[];
  type: string;
}) {
  const cellPct = 100 / boardSize;
  const coords = cells.map((c) => c.split("-").map(Number));
  const rows = coords.map(([r]) => r);
  const cols = coords.map(([, c]) => c);
  const minRow = Math.min(...rows);
  const minCol = Math.min(...cols);
  const isHorizontal = minRow === Math.max(...rows);
  const span = cells.length;
  const outerWidthPct = isHorizontal ? span * cellPct : cellPct;
  const outerHeightPct = isHorizontal ? cellPct : span * cellPct;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${minCol * cellPct}%`,
        top: `${minRow * cellPct}%`,
        width: `${outerWidthPct}%`,
        height: `${outerHeightPct}%`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed local asset, no next/image optimization needed for a tiny board icon */}
      <img
        src={`/battleship/${type}.png`}
        alt=""
        aria-hidden="true"
        className="absolute object-contain"
        style={
          isHorizontal
            ? {
                top: "50%",
                left: "50%",
                width: `${(1 / span) * 100}%`,
                height: `${span * 100}%`,
                transform: "translate(-50%, -50%) rotate(90deg)",
              }
            : { inset: 0, width: "100%", height: "100%" }
        }
      />
    </div>
  );
}

function BoardGrid({
  boardSize,
  cellClassName,
  onCellClick,
  ships,
  hitCells,
}: {
  boardSize: number;
  cellClassName: (row: number, col: number, cell: string) => string;
  onCellClick?: (row: number, col: number, cell: string) => void;
  ships?: ShipPlacement[];
  hitCells?: string[];
}) {
  const cellPct = 100 / boardSize;
  return (
    <div
      className="relative grid w-full max-w-xs sm:max-w-sm mx-auto gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: boardSize }).flatMap((_, row) =>
        Array.from({ length: boardSize }).map((_, col) => {
          const cell = `${row}-${col}`;
          const className = `aspect-square rounded-md ${cellClassName(row, col, cell)}`;
          if (!onCellClick) {
            return <div key={cell} className={className} aria-hidden="true" />;
          }
          return (
            <button
              key={cell}
              type="button"
              aria-label={`${columnLabel(col)}${row + 1}`}
              onClick={() => onCellClick(row, col, cell)}
              className={`${className} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}
            />
          );
        })
      )}
      {ships?.map((ship) => (
        <ShipOverlay key={`${ship.type}-${ship.cells[0]}`} boardSize={boardSize} cells={ship.cells} type={ship.type} />
      ))}
      {/* Drawn above the ship art so a hit on an occupied cell stays visible
       * instead of being hidden underneath the ship image. */}
      {hitCells?.map((cell) => {
        const [row, col] = cell.split("-").map(Number);
        return (
          <div
            key={`hit-${cell}`}
            className="absolute pointer-events-none flex items-center justify-center"
            style={{ left: `${col * cellPct}%`, top: `${row * cellPct}%`, width: `${cellPct}%`, height: `${cellPct}%` }}
          >
            <div className="w-2/5 h-2/5 rounded-full bg-action-danger border-2 border-on-danger-surface/60" />
          </div>
        );
      })}
    </div>
  );
}

export function PlayerView({
  state,
  players,
  playerId: rawPlayerId,
  dispatch,
  privateState,
  setPrivateState,
}: PlayerProps) {
  const t = useTranslations("Battleship");
  const tShips = useTranslations("Battleship.ships");
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  // The ghost preview anchor while placing a ship — set by tapping a cell,
  // moved by tapping another, committed only by an explicit confirm button
  // (founder feedback: the old tap-to-instantly-place flow gave no chance
  // to see where a ship would land before it was already placed).
  const [previewCell, setPreviewCell] = useState<{ row: number; col: number } | null>(null);

  // Per-device display preference (not game state — never touches the
  // reducer or syncs between players). Read lazily on first render rather
  // than via a mount effect, so there's no cascading re-render from setting
  // state inside an effect body.
  const [layout, setLayout] = useState<BoardLayout>(() => {
    try {
      const stored = localStorage.getItem(BOARD_LAYOUT_STORAGE_KEY);
      return isBoardLayout(stored) ? stored : "stacked";
    } catch {
      return "stacked";
    }
  });
  const [singleBoardView, setSingleBoardView] = useState<"target" | "own">("target");
  useEffect(() => {
    try {
      localStorage.setItem(BOARD_LAYOUT_STORAGE_KEY, layout);
    } catch {
      // Losing this convenience isn't worth crashing the app over.
    }
  }, [layout]);

  // Fire animation + hit/sink announcement: diffs the shared `shots`/
  // `sunkShips` against what this device last saw, so both devices play
  // the same feedback independently from the same shared state — no new
  // reducer field needed. M4b's multi-cell shots will need to handle more
  // than one new cell per update; this loop already does, it just never
  // sees more than one today.
  const prevShotsRef = useRef<{ A: Record<string, CellResult>; B: Record<string, CellResult> }>({ A: {}, B: {} });
  const prevSunkRef = useRef<{ A: string[]; B: string[] }>({ A: [], B: [] });
  const strikeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [strikeCell, setStrikeCell] = useState<string | null>(null); // `${side}:${cell}`
  const [announcement, setAnnouncement] = useState<{ text: string; sunk: boolean } | null>(null);

  useEffect(() => {
    for (const side of ["A", "B"] as const) {
      const prevShots = prevShotsRef.current[side];
      const currShots = state.shots[side];
      for (const [cell, result] of Object.entries(currShots)) {
        if (cell in prevShots) continue; // already seen, not a new result
        const prevSunkCount = prevSunkRef.current[side].length;
        const currSunkCount = state.sunkShips[side].length;
        const sunkType = currSunkCount > prevSunkCount ? state.sunkShips[side][currSunkCount - 1] : null;

        if (strikeTimerRef.current) clearTimeout(strikeTimerRef.current);
        setStrikeCell(`${side}:${cell}`);
        setAnnouncement({
          text: sunkType
            ? t("firing.sunkAnnouncement", { ship: tShips(sunkType) })
            : result === "hit"
              ? t("firing.hitAnnouncement")
              : t("firing.missAnnouncement"),
          sunk: Boolean(sunkType),
        });
        strikeTimerRef.current = setTimeout(() => {
          setStrikeCell(null);
          setAnnouncement(null);
        }, 2200);
      }
    }
    prevShotsRef.current = { A: { ...state.shots.A }, B: { ...state.shots.B } };
    prevSunkRef.current = { A: [...state.sunkShips.A], B: [...state.sunkShips.B] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.shots, state.sunkShips]);

  useEffect(
    () => () => {
      if (strikeTimerRef.current) clearTimeout(strikeTimerRef.current);
    },
    []
  );

  const me = players.find((p) => p.id === rawPlayerId) ?? players.find((p) => p.isHost);
  const playerId = rawPlayerId ?? me?.id ?? "";
  const isHost = me?.isHost || false;

  const mySide: BattleshipSide | null = state.sides.A.includes(playerId)
    ? "A"
    : state.sides.B.includes(playerId)
      ? "B"
      : null;
  const opponentSide = mySide ? otherSide(mySide) : null;
  const fleet = privateState?.fleet ?? [];
  const loserSide = state.winner ? otherSide(state.winner) : null;

  // ADR-0005: once the match resolves, the losing side's own device reveals
  // its board — it's no longer secret at that point. Every hook must run
  // unconditionally before any phase-based early return below.
  useEffect(() => {
    if (state.phase !== "resolution" || !mySide || !setPrivateState) return;
    if (loserSide !== mySide || state.revealedFleets[mySide]) return;
    dispatch({ type: "REVEAL_FLEET", side: mySide, fleet });
    // `fleet`/`dispatch` are stable enough in practice (new closures each
    // render, but the guards above make this effect a no-op once it has
    // fired) — depending on the full array here would refire on every
    // unrelated private-state change without ever changing the outcome.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.winner, state.revealedFleets, mySide, loserSide]);

  if (!mySide) {
    return <WaitingState label={t("notInMatch")} />;
  }

  if (state.phase === "placing") {
    const placedTypes = new Set(fleet.map((s) => s.type));
    const nextShip = state.fleetSpec.find((spec) => !placedTypes.has(spec.type));
    const fleetReady = isFleetComplete(fleet, state.fleetSpec);
    const iAmReady = state.readySides[mySide];

    // The ghost preview: recomputed from `previewCell` on every render, not
    // stored itself, so rotating or moving the anchor always reflects the
    // current orientation/ship immediately.
    const ghostCells =
      nextShip && previewCell && !iAmReady
        ? shipCells(previewCell.row, previewCell.col, nextShip.length, orientation, state.boardSize)
        : null;
    const ghostValid = Boolean(ghostCells && canPlaceShip(fleet, ghostCells));

    const confirmShip = () => {
      if (!nextShip || !ghostCells || !ghostValid || !setPrivateState) return;
      setPrivateState((prev) => ({ fleet: [...prev.fleet, { type: nextShip.type, cells: ghostCells }] }));
      setPreviewCell(null);
    };

    return (
      <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2 className="font-display text-2xl text-ink text-center">{t("placing.title")}</h2>

        {iAmReady ? (
          <WaitingState label={t("placing.waitingForOpponentReady")} />
        ) : (
          <>
            <Card className="w-full text-center space-y-1">
              <p className="text-sm text-ink-muted uppercase tracking-widest font-bold">
                {nextShip ? t("placing.placingShip") : t("placing.fleetComplete")}
              </p>
              {nextShip && (
                <p className="text-xl font-bold text-ink">
                  {tShips(nextShip.type)} — {t("placing.cellsLong", { count: nextShip.length })}
                </p>
              )}
            </Card>

            <BoardGrid
              boardSize={state.boardSize}
              onCellClick={(row, col) => setPreviewCell({ row, col })}
              ships={fleet}
              cellClassName={(_r, _c, cell) => {
                if (shipTypeAt(fleet, cell)) return "bg-transparent"; // the ship image itself shows
                if (ghostCells?.includes(cell)) {
                  return ghostValid ? "bg-action-primary opacity-40" : "bg-action-danger opacity-40";
                }
                return "bg-surface-sunken border border-line";
              }}
            />

            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={() => setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"))}
                className="px-5 text-sm"
              >
                {orientation === "horizontal" ? t("placing.orientationHorizontal") : t("placing.orientationVertical")}
              </Button>
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={() => {
                  setPrivateState?.({ fleet: randomFleetPlacement(state.fleetSpec, state.boardSize) });
                  setPreviewCell(null);
                }}
                className="px-5 text-sm"
              >
                {t("placing.randomButton")}
              </Button>
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={() => setPrivateState?.((prev) => ({ fleet: prev.fleet.slice(0, -1) }))}
                className="px-5 text-sm"
                disabled={fleet.length === 0}
              >
                {t("placing.undoButton")}
              </Button>
            </div>

            {nextShip && (
              <Button variant="primary" onClick={confirmShip} disabled={!ghostValid} className="max-w-xs">
                {previewCell ? t("placing.confirmShipButton") : t("placing.tapToPreviewHint")}
              </Button>
            )}

            <Button
              variant={fleetReady ? "primary" : "ghost"}
              onClick={() => dispatch({ type: "SIDE_READY", side: mySide })}
              disabled={!fleetReady}
              className="max-w-xs"
            >
              {t("placing.readyButton")}
            </Button>
          </>
        )}
      </div>
    );
  }

  if (state.phase === "firing") {
    const isMyTurn = state.turn === mySide;
    const pendingIsMine = state.pendingShot?.shooterSide === mySide;
    const pendingIsOpponents = state.pendingShot && !pendingIsMine;
    const shotsIFired = opponentSide ? state.shots[opponentSide] : {};
    const shotsIReceived = state.shots[mySide];

    const targetBoard = (
      <div className="w-full space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-muted text-center">
          {t("firing.targetBoardLabel")}
        </p>
        <BoardGrid
          boardSize={state.boardSize}
          onCellClick={
            isMyTurn && !state.pendingShot
              ? (_r, _c, cell) => {
                  if (shotsIFired[cell]) return;
                  dispatch({ type: "FIRE", side: mySide, cell });
                }
              : undefined
          }
          cellClassName={(_r, _c, cell) => {
            const result = shotsIFired[cell];
            const striking = opponentSide && strikeCell === `${opponentSide}:${cell}`;
            if (striking) return announcement?.sunk ? "bg-action-danger motion-shake" : "bg-action-danger motion-strike";
            if (result === "hit") return "bg-action-danger";
            if (result === "miss") return "bg-surface-well";
            return "bg-surface-sunken border border-line";
          }}
        />
      </div>
    );

    const ownBoard = (
      <div className="w-full space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-muted text-center">
          {t("firing.yourBoardLabel")}
        </p>
        <BoardGrid
          boardSize={state.boardSize}
          ships={fleet}
          hitCells={Object.entries(shotsIReceived)
            .filter(([, result]) => result === "hit")
            .map(([cell]) => cell)}
          cellClassName={(_r, _c, cell) => {
            const result = shotsIReceived[cell];
            const hasShip = Boolean(shipTypeAt(fleet, cell));
            const striking = mySide && strikeCell === `${mySide}:${cell}`;
            if (striking && !hasShip) {
              return announcement?.sunk ? "bg-action-danger motion-shake" : "bg-action-danger motion-strike";
            }
            if (hasShip) return "bg-transparent"; // the ship image itself shows; hit dots layer on top
            if (result === "miss") return "bg-surface-well";
            return "bg-surface-sunken border border-line";
          }}
        />
      </div>
    );

    return (
      <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2 className="font-display text-2xl text-ink text-center">{t("firing.title")}</h2>

        {announcement && (
          <div
            role="status"
            aria-live="assertive"
            className={`w-full text-center py-3 px-4 rounded-2xl font-black text-lg ${
              announcement.sunk
                ? "bg-danger-surface text-on-danger-surface motion-celebrate"
                : "bg-surface-sunken text-ink motion-deal"
            }`}
          >
            {announcement.text}
          </div>
        )}

        {pendingIsMine ? (
          <WaitingState label={t("firing.waitingForOpponent")} />
        ) : pendingIsOpponents ? (
          <WaitingState label={t("firing.resolvingYourAnswer")} />
        ) : (
          <p className={`text-lg font-black ${isMyTurn ? "text-action-secondary motion-pulse" : "text-ink-muted"}`}>
            {isMyTurn ? t("firing.yourTurn") : t("firing.opponentTurn")}
          </p>
        )}

        <div className="flex gap-2 flex-wrap justify-center">
          <Button
            variant="ghost"
            fullWidth={false}
            active={layout === "stacked"}
            onClick={() => setLayout("stacked")}
            className="px-3 py-2 text-xs"
          >
            {t("firing.layoutStacked")}
          </Button>
          <Button
            variant="ghost"
            fullWidth={false}
            active={layout === "side-by-side"}
            onClick={() => setLayout("side-by-side")}
            className="px-3 py-2 text-xs"
          >
            {t("firing.layoutSideBySide")}
          </Button>
          <Button
            variant="ghost"
            fullWidth={false}
            active={layout === "one-at-a-time"}
            onClick={() => setLayout("one-at-a-time")}
            className="px-3 py-2 text-xs"
          >
            {t("firing.layoutOneAtATime")}
          </Button>
        </div>

        {layout === "stacked" && (
          <>
            {targetBoard}
            {ownBoard}
          </>
        )}

        {layout === "side-by-side" && (
          <div className="flex flex-row gap-3 w-full justify-center items-start">
            <div className="flex-1 min-w-0">{targetBoard}</div>
            <div className="flex-1 min-w-0">{ownBoard}</div>
          </div>
        )}

        {layout === "one-at-a-time" && (
          <>
            <div className="flex gap-2 w-full max-w-xs">
              <Button
                variant="ghost"
                active={singleBoardView === "target"}
                onClick={() => setSingleBoardView("target")}
                className="text-xs"
              >
                {t("firing.targetBoardLabel")}
              </Button>
              <Button
                variant="ghost"
                active={singleBoardView === "own"}
                onClick={() => setSingleBoardView("own")}
                className="text-xs"
              >
                {t("firing.yourBoardLabel")}
              </Button>
            </div>
            {singleBoardView === "target" ? targetBoard : ownBoard}
          </>
        )}
      </div>
    );
  }

  if (state.phase === "resolution") {
    const won = state.winner === mySide;
    const revealedFleet = loserSide ? state.revealedFleets[loserSide] : undefined;

    return (
      <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2
          className={`font-display text-4xl text-center leading-tight motion-celebrate ${won ? "text-action-primary" : "text-ink"}`}
        >
          {won ? t("resolution.youWon") : t("resolution.youLost")}
        </h2>

        {revealedFleet ? (
          <div className="w-full space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted text-center">
              {t("resolution.revealedFleetLabel")}
            </p>
            <BoardGrid
              boardSize={state.boardSize}
              ships={revealedFleet}
              cellClassName={(_r, _c, cell) => (shipTypeAt(revealedFleet, cell) ? "bg-transparent" : "bg-surface-sunken")}
            />
          </div>
        ) : (
          <WaitingState label={t("resolution.waitingForReveal")} />
        )}

        {isHost && (
          <Button variant="ghost" onClick={() => dispatch({ type: "PLAY_AGAIN" })} className="mt-4 max-w-xs">
            {t("resolution.nextRoundButton")}
          </Button>
        )}
      </div>
    );
  }

  return null;
}
