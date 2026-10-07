"use client";

import { useEffect, useRef, useState } from "react";
import { orientationOf, type ShipPlacement } from "../placement";
import { ToyShip } from "./ToyShip";

export function columnLabel(col: number): string {
  return String.fromCharCode(65 + col);
}

/** An untouched cell: a white peg hole on the navy frame (BDR-0002). */
export const EMPTY_CELL = "bg-surface-sunken";
/** A miss: the hole shows water (founder: "si es agua tiene que ser azul"). */
export const MISS_CELL = "bg-water";
/** A hit on the rival's board: a red peg in the hole, as in the physical
 * game (TASK-0048). */
export const HIT_CELL =
  "bg-surface-sunken relative after:absolute after:inset-[20%] after:rounded-full after:bg-action-primary after:shadow-[0_2px_0_var(--color-edge-primary)]";

type PointerKind = "mouse" | "touch" | "pen" | string;

/** Positions a ship over its cells as a percentage box, so the board can be
 * any size. */
function ShipBox({
  boardSize,
  cells,
  children,
}: {
  boardSize: number;
  cells: string[];
  children: React.ReactNode;
}) {
  const pct = 100 / boardSize;
  const coords = cells.map((c) => c.split("-").map(Number));
  const rows = coords.map(([r]) => r);
  const cols = coords.map(([, c]) => c);
  const minRow = Math.min(...rows);
  const minCol = Math.min(...cols);
  const horizontal = minRow === Math.max(...rows);
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${minCol * pct}%`,
        top: `${minRow * pct}%`,
        width: `${(horizontal ? cells.length : 1) * pct}%`,
        height: `${(horizontal ? 1 : cells.length) * pct}%`,
      }}
    >
      {children}
    </div>
  );
}

/** Hit indices along a ship (0 = its first cell), for its pegs. */
function hitIndices(ship: ShipPlacement, hits: Set<string>): number[] {
  const sorted = [...ship.cells].sort((a, b) => {
    const [ra, ca] = a.split("-").map(Number);
    const [rb, cb] = b.split("-").map(Number);
    return ra - rb || ca - cb;
  });
  return sorted.flatMap((cell, i) => (hits.has(cell) ? [i] : []));
}

/** One Battleship board: a navy plastic frame on its molded edge with a
 * white peg hole per cell — the physical game's board. Purely
 * presentational; each phase says how cells look and what a press does.
 *
 * TASK-0048: ships are drawn in code (`ToyShip`) with their hits as red pegs,
 * the board can carry A–H / 1–8 coordinates, and a `mini` variant renders a
 * small non-interactive copy (the radar's mini-map). */
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
  coords = false,
  mini = false,
  className = "",
}: {
  boardSize: number;
  cellClassName: (row: number, col: number, cell: string) => string;
  onCellClick?: (row: number, col: number, cell: string) => void;
  // Continuous-drag mode (placement): a press anywhere on the grid starts a
  // drag that tracks the pointer in real time. `onDragStart` fires once, on
  // press; `onDragMove` fires as the pointer moves to another cell;
  // `onDragEnd` on release. The pointer kind lets placement lift a ship
  // above a finger (touch) but not above a mouse cursor.
  onDragStart?: (row: number, col: number, pointer: PointerKind) => void;
  onDragMove?: (row: number, col: number, pointer: PointerKind) => void;
  onDragEnd?: () => void;
  ships?: ShipPlacement[];
  /** Cells hit on *this* board. On my own board they become red pegs in my
   * ships' holes. */
  hitCells?: string[];
  ghost?: { cells: string[]; type: string; valid: boolean } | null;
  // Ships confirmed sunk on this board, drawn faded with every peg in —
  // only ever ships whose every cell is already known to be a hit, so this
  // never reveals anything not already visible.
  sunkShips?: ShipPlacement[];
  // A weapon's aim preview on the rival's board.
  aim?: { cells: string[]; valid: boolean } | null;
  coords?: boolean;
  mini?: boolean;
  className?: string;
}) {
  const pct = 100 / boardSize;
  const gridRef = useRef<HTMLDivElement>(null);
  // The press in progress: which pointer kind is dragging, and the last
  // cell it reported (so only real cell changes count as a drag). State,
  // not refs: the window listeners below re-subscribe with it.
  const [drag, setDrag] = useState<{ kind: PointerKind; last: string } | null>(null);
  const hits = new Set(hitCells ?? []);

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
    if (!drag) return;
    const handleMove = (e: PointerEvent) => {
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (!cell) return;
      const key = `${cell.row}-${cell.col}`;
      if (key === drag.last) return; // only real cell changes count as a drag
      setDrag({ kind: drag.kind, last: key });
      onDragMove(cell.row, cell.col, drag.kind);
    };
    const handleUp = () => {
      setDrag(null);
      onDragEnd?.();
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDragMove, onDragEnd, boardSize, drag]);

  const isDraggable = Boolean(onDragMove);

  const startDrag = (e: React.PointerEvent, row: number, col: number) => {
    e.preventDefault();
    const kind = e.pointerType || "mouse";
    setDrag({ kind, last: `${row}-${col}` });
    onDragStart?.(row, col, kind);
  };
  const interactive = !mini && (Boolean(onCellClick) || isDraggable);

  return (
    <div
      className={
        mini
          ? `rounded-lg bg-edge-ground p-1 ${className}`
          : `w-full rounded-2xl bg-edge-ground p-2 shadow-[0_var(--edge-md)_0_var(--color-ink)] ${className}`
      }
      aria-hidden={mini || undefined}
    >
      <div
        className={coords && !mini ? "grid gap-1" : undefined}
        style={coords && !mini ? { gridTemplateColumns: "0.9rem minmax(0, 1fr)" } : undefined}
      >
        {coords && !mini && (
          <>
            <span />
            <div
              className="grid text-center font-display text-[0.65rem] leading-none text-on-ground/80"
              style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
              aria-hidden="true"
            >
              {Array.from({ length: boardSize }, (_, c) => (
                <span key={c}>{columnLabel(c)}</span>
              ))}
            </div>
            <div
              className="grid items-center text-right font-display text-[0.65rem] leading-none text-on-ground/80"
              style={{ gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))` }}
              aria-hidden="true"
            >
              {Array.from({ length: boardSize }, (_, r) => (
                <span key={r}>{r + 1}</span>
              ))}
            </div>
          </>
        )}
        <div
          ref={gridRef}
          className={`relative grid w-full ${mini ? "gap-px" : "gap-[3px]"}`}
          style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: boardSize }).flatMap((_, row) =>
            Array.from({ length: boardSize }).map((_, col) => {
              const cell = `${row}-${col}`;
              const className = `aspect-square rounded-full ${cellClassName(row, col, cell)}`;
              if (!interactive) {
                return <div key={cell} className={className} aria-hidden="true" />;
              }
              return (
                <button
                  key={cell}
                  type="button"
                  aria-label={`${columnLabel(col)}${row + 1}`}
                  onPointerDown={isDraggable ? (e) => startDrag(e, row, col) : undefined}
                  onClick={!isDraggable && onCellClick ? () => onCellClick(row, col, cell) : undefined}
                  className={`${className} touch-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-action-secondary`}
                />
              );
            })
          )}
          {ships?.map((ship) => (
            <ShipBox key={`${ship.type}-${ship.cells[0]}`} boardSize={boardSize} cells={ship.cells}>
              <ToyShip
                type={ship.type}
                length={ship.cells.length}
                orientation={orientationOf(ship)}
                hits={hitIndices(ship, hits)}
              />
            </ShipBox>
          ))}
          {sunkShips?.map((ship) => (
            <ShipBox key={`sunk-${ship.type}-${ship.cells[0]}`} boardSize={boardSize} cells={ship.cells}>
              <ToyShip
                type={ship.type}
                length={ship.cells.length}
                orientation={orientationOf(ship)}
                hits={ship.cells.map((_, i) => i)}
                sunk
              />
            </ShipBox>
          ))}
          {ghost && (
            <ShipBox boardSize={boardSize} cells={ghost.cells}>
              <ToyShip
                type={ghost.type}
                length={ghost.cells.length}
                orientation={orientationOf({ type: ghost.type, cells: ghost.cells })}
                ghost={{ valid: ghost.valid }}
              />
            </ShipBox>
          )}
          {aim?.cells.map((cell) => {
            const [row, col] = cell.split("-").map(Number);
            return (
              <div
                key={`aim-${cell}`}
                className={`absolute pointer-events-none rounded-full ring-[3px] ring-inset ${
                  aim.valid ? "ring-action-secondary bg-action-secondary/40" : "ring-action-primary bg-action-primary/25"
                }`}
                style={{ left: `${col * pct}%`, top: `${row * pct}%`, width: `${pct}%`, height: `${pct}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
