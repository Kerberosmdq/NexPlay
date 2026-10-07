"use client";

import { useEffect, useRef } from "react";
import type { ShipPlacement } from "../placement";

export function columnLabel(col: number): string {
  return String.fromCharCode(65 + col);
}

/** The class an untouched cell gets on every board: a white plastic peg
 * hole on the navy frame (BDR-0002). */
export const EMPTY_CELL = "bg-surface-sunken";

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
        <div className={`absolute inset-0 rounded-sm ${valid ? "bg-success/30" : "bg-action-danger/40"}`} />
      )}
    </div>
  );
}

/** One Battleship board. BDR-0002: a navy plastic frame on its molded edge
 * with a white peg hole per cell — the physical game's board — so water
 * (blue) and hits (red) stand out against the white. Purely presentational:
 * every phase passes how each cell should look and what a press does. */
export function BoardGrid({
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
    <div className="w-full max-w-xs sm:max-w-sm mx-auto rounded-2xl bg-edge-ground p-2 shadow-[0_var(--edge-md)_0_var(--color-ink)]">
      <div
        ref={gridRef}
        className="relative grid w-full gap-[3px]"
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
                className={`${className} touch-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-action-secondary`}
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
              className={`absolute pointer-events-none rounded-md ${aim.valid ? "bg-action-secondary/60" : "bg-action-danger/40"}`}
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
              <div className="w-2/5 h-2/5 rounded-full bg-action-danger border-2 border-surface-raised" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
