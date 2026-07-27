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
import { weaponCells, weaponForShipType, WEAPON_COST, type WeaponType } from "../weapons";
import { useTeamFleetChannel } from "@/lib/realtime/teamState";
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
  ghost,
  valid,
  sunk,
}: {
  boardSize: number;
  cells: string[];
  type: string;
  // A ghost renders the same ship art translucent, with a green/red tint
  // for placement validity — so moving or placing a ship shows the actual
  // ship following the pointer, not just colored cells underneath it.
  ghost?: boolean;
  valid?: boolean;
  // A sunk ship renders faded and desaturated over its own hit dots on the
  // *target* board — a visual reminder of what's already been eliminated
  // there, once its shape is known (only once every one of its cells has
  // been hit; never before, since that would leak the rest of the fleet).
  sunk?: boolean;
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
        // `object-cover` rather than `object-contain`: each source art's own
        // aspect ratio doesn't exactly match every cell-span it can occupy
        // (the carrier is 4 cells long on an 8-wide board but 5 on a 10-wide
        // one, from the same asset) — `contain` letterboxes the *short* axis,
        // which for a squatter ship (the carrier) left visible empty cells
        // at its bow/stern instead of filling its full length. `cover` always
        // fills the ship's full length, at the cost of a small crop on the
        // narrow axis — invisible in practice, since every crop already
        // carries transparent padding there.
        className={`absolute object-cover ${ghost ? "opacity-60" : sunk ? "opacity-50 grayscale" : ""}`}
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
      {ghost && (
        <div className={`absolute inset-0 rounded-sm ${valid ? "bg-action-primary/25" : "bg-action-danger/40"}`} />
      )}
    </div>
  );
}

function BoardGrid({
  boardSize,
  cellClassName,
  onCellClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  ships,
  hitCells,
  ghost,
  sunkShips,
  aim,
}: {
  boardSize: number;
  cellClassName: (row: number, col: number, cell: string) => string;
  onCellClick?: (row: number, col: number, cell: string) => void;
  // Continuous-drag mode (placement): a press anywhere on the grid starts a
  // drag that tracks the pointer in real time — not a tap-then-tap-again —
  // matching "quiero ver como si uno lo arrastrara por el tablero" (founder
  // feedback: the tap/tap/confirm flow didn't read as dragging). Takes over
  // from `onCellClick` when provided. `onDragStart` fires once, on press
  // (e.g. to pick an already-placed ship back up); `onDragMove` fires
  // continuously as the pointer moves, including the initial press position.
  onDragStart?: (row: number, col: number) => void;
  onDragMove?: (row: number, col: number) => void;
  onDragEnd?: () => void;
  ships?: ShipPlacement[];
  hitCells?: string[];
  // The ship currently being placed/moved, rendered as a translucent
  // ship-shaped overlay (not just colored cells) so it actually looks like
  // the real ship following the pointer.
  ghost?: { cells: string[]; type: string; valid: boolean } | null;
  // Ships confirmed sunk on this board, rendered faded over their hit dots
  // — only ever populated with ships whose every cell is already known to
  // be a hit, so this never reveals anything not already visible.
  sunkShips?: ShipPlacement[];
  // M4b weapon-aim preview on the *target* board — a tinted reticle, not a
  // ship image (there's no ship there to show; you're bombarding an area).
  aim?: { cells: string[]; valid: boolean } | null;
}) {
  const cellPct = 100 / boardSize;
  const gridRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const cellFromPoint = (clientX: number, clientY: number) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const col = Math.floor(((clientX - rect.left) / rect.width) * boardSize);
    const row = Math.floor(((clientY - rect.top) / rect.height) * boardSize);
    if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) return null;
    return { row, col };
  };

  useEffect(() => {
    if (!onDragMove) return;
    const handleMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (cell) onDragMove(cell.row, cell.col);
    };
    const handleUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      onDragEnd?.();
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDragMove, onDragEnd, boardSize]);

  const isDraggable = Boolean(onDragMove);

  return (
    <div
      ref={gridRef}
      className="relative grid w-full max-w-xs sm:max-w-sm mx-auto gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: boardSize }).flatMap((_, row) =>
        Array.from({ length: boardSize }).map((_, col) => {
          const cell = `${row}-${col}`;
          const className = `aspect-square rounded-md ${cellClassName(row, col, cell)}`;
          if (!onCellClick && !isDraggable) {
            return <div key={cell} className={className} aria-hidden="true" />;
          }
          return (
            <button
              key={cell}
              type="button"
              aria-label={`${columnLabel(col)}${row + 1}`}
              onPointerDown={
                isDraggable
                  ? (e) => {
                      e.preventDefault();
                      draggingRef.current = true;
                      // Only `onDragStart` here — it's responsible for the
                      // drag's *initial* position (which may not be this
                      // exact cell: picking an already-placed ship back up
                      // re-anchors to where it already was, not wherever it
                      // was grabbed, so it doesn't visually jump the instant
                      // it's pressed). `onDragMove` only fires from actual
                      // subsequent pointer movement.
                      onDragStart?.(row, col);
                    }
                  : undefined
              }
              onClick={!isDraggable && onCellClick ? () => onCellClick(row, col, cell) : undefined}
              className={`${className} touch-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}
            />
          );
        })
      )}
      {ships?.map((ship) => (
        <ShipOverlay key={`${ship.type}-${ship.cells[0]}`} boardSize={boardSize} cells={ship.cells} type={ship.type} />
      ))}
      {ghost && (
        <ShipOverlay boardSize={boardSize} cells={ghost.cells} type={ghost.type} ghost valid={ghost.valid} />
      )}
      {sunkShips?.map((ship) => (
        <ShipOverlay
          key={`sunk-${ship.type}-${ship.cells[0]}`}
          boardSize={boardSize}
          cells={ship.cells}
          type={ship.type}
          sunk
        />
      ))}
      {aim?.cells.map((cell) => {
        const [row, col] = cell.split("-").map(Number);
        return (
          <div
            key={`aim-${cell}`}
            className={`absolute pointer-events-none rounded-md ${aim.valid ? "bg-action-primary/40" : "bg-action-danger/40"}`}
            style={{ left: `${col * cellPct}%`, top: `${row * cellPct}%`, width: `${cellPct}%`, height: `${cellPct}%` }}
          />
        );
      })}
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
  roomCode,
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
  // True for the instant between picking an already-placed ship back up and
  // either moving it or releasing again. A plain tap-to-pick-up (press and
  // release with no movement in between) must NOT re-commit the ship right
  // back where it was — that would silently undo the pickup before the
  // player has a chance to hit the rotate button, which is exactly the "no
  // me deja girarlo" bug: rotating only has an effect while the ship is
  // off the fleet (i.e. while `nextShip` is standing in for it), and that
  // window used to close itself instantly on release.
  const justPickedUpRef = useRef(false);

  // M4b weapon aiming (firing phase only, but declared unconditionally per
  // Rules of Hooks): `null` selectedWeapon means the plain, free, always-
  // available single-cell shot. Picking a weapon just arms aiming mode —
  // it doesn't fire until `aimCell` is also set and confirmed, so a shape
  // preview can be shown first (weapons cost charges; a plain shot doesn't
  // need this two-step confirmation and still fires on a single tap).
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType | null>(null);
  const [weaponOrientation, setWeaponOrientation] = useState<Orientation>("horizontal");
  const [aimCell, setAimCell] = useState<{ row: number; col: number } | null>(null);

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
  const [announcement, setAnnouncement] = useState<{ text: string; sunk: boolean; shipType: string | null } | null>(
    null
  );

  useEffect(() => {
    for (const side of ["A", "B"] as const) {
      const prevShots = prevShotsRef.current[side];
      const currShots = state.shots[side];
      for (const [cell, result] of Object.entries(currShots)) {
        if (cell in prevShots) continue; // already seen, not a new result
        const prevSunkCount = prevSunkRef.current[side].length;
        const currSunkCount = state.sunkShips[side].length;
        const sunkType = currSunkCount > prevSunkCount ? state.sunkShips[side][currSunkCount - 1] : null;
        // `side` is the *defending* side here (whose ship, if any, was just
        // hit) — when it's my own side, the sinking was done TO me, not BY
        // me, so the phrasing has to flip (this is the modal the founder
        // asked for: "que aparezca un modal que diga que lo hundiste" only
        // reads right from the shooter's side).
        const iWasSunk = side === mySide;

        if (strikeTimerRef.current) clearTimeout(strikeTimerRef.current);
        setStrikeCell(`${side}:${cell}`);
        setAnnouncement({
          text: sunkType
            ? t(iWasSunk ? "firing.shipSunkAnnouncement" : "firing.sunkAnnouncement", { ship: tShips(sunkType) })
            : result === "hit"
              ? t("firing.hitAnnouncement")
              : t("firing.missAnnouncement"),
          sunk: Boolean(sunkType),
          shipType: sunkType,
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

  // ADR-0005: once the match resolves, the losing side's own device reveals
  // its board — it's no longer secret at that point. Every hook must run
  // unconditionally before any phase-based early return below.
  useEffect(() => {
    if (state.phase !== "resolution" || !mySide || !setPrivateState) return;
    if (loserSide !== mySide || state.revealedFleets[mySide]) return;
    dispatch({ type: "REVEAL_FLEET", side: mySide, fleet: effectiveFleet });
    // `effectiveFleet`/`dispatch` are stable enough in practice (new closures each
    // render, but the guards above make this effect a no-op once it has
    // fired) — depending on the full array here would refire on every
    // unrelated private-state change without ever changing the outcome.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.winner, state.revealedFleets, mySide, loserSide]);

  // M4c: a 4-player match starts here, before anyone has a `mySide` yet —
  // must come before the `!mySide` guard below, which would otherwise
  // wrongly show "not in this match" to every unassigned player.
  if (state.phase === "teamSetup") {
    const nameFor = (id: string) => players.find((p) => p.id === id)?.displayName ?? id;
    const bothFull = state.sides.A.length === 2 && state.sides.B.length === 2;

    return (
      <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2 className="font-display text-2xl text-ink text-center">{t("teamSetup.title")}</h2>
        {!isHost && <p className="text-sm text-ink-muted text-center">{t("teamSetup.waitingForHost")}</p>}

        <div className="flex gap-4 w-full">
          <Card className="flex-1 space-y-1 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">{t("teamSetup.sideA")}</p>
            {state.sides.A.map((id) => (
              <p key={id} className="font-bold text-ink">
                {nameFor(id)}
              </p>
            ))}
          </Card>
          <Card className="flex-1 space-y-1 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">{t("teamSetup.sideB")}</p>
            {state.sides.B.map((id) => (
              <p key={id} className="font-bold text-ink">
                {nameFor(id)}
              </p>
            ))}
          </Card>
        </div>

        {isHost && (
          <Card className="w-full space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">{t("teamSetup.assignPlayersLabel")}</p>
            {state.rosterPlayerIds.map((id) => {
              const currentSide = state.sides.A.includes(id) ? "A" : state.sides.B.includes(id) ? "B" : null;
              return (
                <div key={id} className="flex items-center justify-between gap-2">
                  <span className="font-bold text-ink">{nameFor(id)}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      fullWidth={false}
                      active={currentSide === "A"}
                      disabled={currentSide !== "A" && state.sides.A.length >= 2}
                      onClick={() => dispatch({ type: "ASSIGN_SIDE", playerId: id, side: "A" })}
                      className="px-4 text-sm"
                    >
                      {t("teamSetup.sideA")}
                    </Button>
                    <Button
                      variant="ghost"
                      fullWidth={false}
                      active={currentSide === "B"}
                      disabled={currentSide !== "B" && state.sides.B.length >= 2}
                      onClick={() => dispatch({ type: "ASSIGN_SIDE", playerId: id, side: "B" })}
                      className="px-4 text-sm"
                    >
                      {t("teamSetup.sideB")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {isHost && (
          <Button
            variant={bothFull ? "primary" : "ghost"}
            disabled={!bothFull}
            onClick={() => dispatch({ type: "START_TEAMS" })}
            className="max-w-xs"
          >
            {t("teamSetup.startButton")}
          </Button>
        )}
      </div>
    );
  }

  if (!mySide) {
    return <WaitingState label={t("notInMatch")} />;
  }

  if (state.phase === "placing") {
    // M4c: a non-captain teammate never edits — they watch the captain's
    // fleet appear live via the side channel (`effectiveFleet`, which for
    // them is `mirroredFleet`), same board rendering as their own board
    // during firing.
    if (!isCaptain) {
      const iAmReady = state.readySides[mySide];
      return (
        <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
          <h2 className="font-display text-2xl text-ink text-center">{t("placing.title")}</h2>
          <WaitingState label={iAmReady ? t("placing.waitingForOpponentReady") : t("placing.watchingCaptainHint")} />
          <BoardGrid
            boardSize={state.boardSize}
            ships={effectiveFleet}
            cellClassName={(_r, _c, cell) =>
              shipTypeAt(effectiveFleet, cell) ? "bg-transparent" : "bg-surface-sunken border border-line"
            }
          />
        </div>
      );
    }

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

    // Founder feedback: this should feel like actually dragging the ship
    // across the board, not tap-somewhere / tap-again / press a separate
    // confirm button. A press starts the drag (picking an already-placed
    // ship back up if the fleet is complete and the press lands on one —
    // gated on `!nextShip` so a second ship can never get silently dropped
    // mid-move), continuous movement updates the ghost in real time
    // (`onDragTo`, driven by `BoardGrid`'s own pointermove tracking), and
    // releasing (`onDragEnd`) commits the placement if it's valid there —
    // a quick tap-and-release with no movement in between still works, as a
    // (very short) drag onto the cell you tapped.
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
              {nextShip ? (
                <>
                  <p className="text-xl font-bold text-ink">
                    {tShips(nextShip.type)} — {t("placing.cellsLong", { count: nextShip.length })}
                  </p>
                  <p className="text-xs text-ink-muted">{t("placing.dragToPlaceHint")}</p>
                </>
              ) : (
                <p className="text-sm text-ink-muted">{t("placing.tapToMoveHint")}</p>
              )}
            </Card>

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
    const myCharges = state.charges[mySide];

    // M4b: every weapon whose ship is still afloat on my own side — a
    // weapon disappears the instant its ship is sunk, regardless of
    // charges (the "ship-bound" half of the founder's design). Affordability
    // is checked separately per weapon so the selector can show what's
    // still out of reach rather than hiding it entirely.
    const myWeapons = state.fleetSpec
      .map((spec) => ({ shipType: spec.type, weapon: weaponForShipType(spec.type) }))
      .filter(
        (w): w is { shipType: string; weapon: WeaponType } => w.weapon !== null && !state.sunkShips[mySide].includes(w.shipType)
      );

    const aimGhostCells =
      selectedWeapon && aimCell ? weaponCells(selectedWeapon, aimCell.row, aimCell.col, weaponOrientation, state.boardSize) : null;
    // A shot is only worth confirming if at least one of its cells is still
    // unfired-at — same "some risk is on you" rule the plain shot already
    // has via `shotsIFired[cell]`, just tolerant of a partially-wasted shape.
    const aimGhostValid = Boolean(aimGhostCells?.length && aimGhostCells.some((c) => !shotsIFired[c]));
    const aimCost = selectedWeapon ? WEAPON_COST[selectedWeapon] : 0;

    const selectWeapon = (weapon: WeaponType | null) => {
      setSelectedWeapon(weapon);
      setAimCell(null);
    };

    const confirmWeaponShot = () => {
      if (!selectedWeapon || !aimGhostCells || !aimGhostValid || myCharges < aimCost) return;
      dispatch({ type: "FIRE", side: mySide, cells: aimGhostCells, weapon: selectedWeapon });
      setSelectedWeapon(null);
      setAimCell(null);
    };

    const targetBoard = (
      <div className="w-full space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-muted text-center">
          {t("firing.targetBoardLabel")}
        </p>
        <BoardGrid
          boardSize={state.boardSize}
          onCellClick={
            isMyTurn && !state.pendingShot
              ? (row, col, cell) => {
                  if (selectedWeapon) {
                    setAimCell({ row, col });
                    return;
                  }
                  if (shotsIFired[cell]) return;
                  dispatch({ type: "FIRE", side: mySide, cells: [cell], weapon: null });
                }
              : undefined
          }
          sunkShips={opponentSide ? state.sunkShipCells[opponentSide] : []}
          aim={aimGhostCells ? { cells: aimGhostCells, valid: aimGhostValid } : null}
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
          ships={effectiveFleet}
          hitCells={Object.entries(shotsIReceived)
            .filter(([, result]) => result === "hit")
            .map(([cell]) => cell)}
          cellClassName={(_r, _c, cell) => {
            const result = shotsIReceived[cell];
            const hasShip = Boolean(shipTypeAt(effectiveFleet, cell));
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

        {announcement && !announcement.sunk && (
          <div
            role="status"
            aria-live="assertive"
            className="w-full text-center py-3 px-4 rounded-2xl font-black text-lg bg-surface-sunken text-ink motion-deal"
          >
            {announcement.text}
          </div>
        )}

        {announcement?.sunk && (
          <div
            role="alertdialog"
            aria-live="assertive"
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4"
            onClick={() => {
              if (strikeTimerRef.current) clearTimeout(strikeTimerRef.current);
              setStrikeCell(null);
              setAnnouncement(null);
            }}
          >
            <div className="bg-surface rounded-3xl px-8 py-8 max-w-xs w-full text-center space-y-4 motion-celebrate">
              {announcement.shipType && (
                // eslint-disable-next-line @next/next/no-img-element -- a fixed local asset, no next/image optimization needed for a small modal icon
                <img
                  src={`/battleship/${announcement.shipType}.png`}
                  alt=""
                  aria-hidden="true"
                  className="w-20 h-20 mx-auto object-contain"
                />
              )}
              <p className="font-black text-2xl text-ink">{announcement.text}</p>
              <p className="text-xs text-ink-muted">{t("firing.tapToContinue")}</p>
            </div>
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

        {isMyTurn && !state.pendingShot && (
          <Card className="w-full space-y-3 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
              {t("firing.chargesLabel", { count: myCharges })}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="ghost"
                fullWidth={false}
                active={selectedWeapon === null}
                onClick={() => selectWeapon(null)}
                className="px-4 text-sm"
              >
                {t("firing.plainShotButton")}
              </Button>
              {myWeapons.map(({ weapon }) => (
                <Button
                  key={weapon}
                  variant="ghost"
                  fullWidth={false}
                  active={selectedWeapon === weapon}
                  disabled={myCharges < WEAPON_COST[weapon]}
                  onClick={() => selectWeapon(weapon)}
                  className="px-4 text-sm"
                >
                  {t(`firing.weapon.${weapon}`)} ({WEAPON_COST[weapon]})
                </Button>
              ))}
            </div>

            {selectedWeapon === "triple" && (
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={() => setWeaponOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"))}
                className="px-4 text-sm mx-auto"
              >
                {weaponOrientation === "horizontal" ? t("placing.orientationHorizontal") : t("placing.orientationVertical")}
              </Button>
            )}

            {selectedWeapon && !aimGhostCells && <p className="text-xs text-ink-muted">{t("firing.aimHint")}</p>}

            {selectedWeapon && aimGhostCells && (
              <Button
                variant={aimGhostValid ? "primary" : "ghost"}
                onClick={confirmWeaponShot}
                disabled={!aimGhostValid}
                className="max-w-xs mx-auto"
              >
                {t("firing.confirmShotButton", { cost: aimCost })}
              </Button>
            )}
          </Card>
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
