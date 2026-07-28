"use client";

import { useEffect, useRef, useState } from "react";
import { lowestEmptyRow, COLUMNS, ROWS, type Cell } from "../winCheck";
import type { Connect4Side } from "../reducer";

const SIDE_COLOR: Record<Connect4Side, string> = {
  A: "var(--color-action-primary)",
  B: "var(--color-action-secondary)",
};

// The same hexagon the NexPlay mark itself uses — a token, not a plain
// circle, is what makes this board feel like this app's rather than a
// generic reskin (docs/09_ai/tasks/TASK-0037-connect4.md, "Option B").
const HEX_CLIP = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

interface BoardProps {
  cells: Cell<Connect4Side>[];
  turnSide: Connect4Side;
  winningLine: number[] | null;
  // Whether the match has ended (a win or a draw) — separate from
  // `winningLine` because a draw ends the match with no winning line at
  // all, and both cases dim the board the same way.
  resolved: boolean;
  disabled: boolean;
  onColumnClick: (column: number) => void;
}

/** Pure(-ish) shared board render — used by both the multi-device and
 * single-device views, since neither needs anything different here (no
 * hidden information exists in this game to filter per device). Owns two
 * bits of purely-visual local state: which cell most recently changed (so
 * only that one plays the drop animation, not a full re-render replay) and
 * which column is currently hovered/pressed (the ghost-token preview). */
export function Board({ cells, turnSide, winningLine, resolved, disabled, onColumnClick }: BoardProps) {
  const prevCellsRef = useRef(cells);
  const [justPlacedIndex, setJustPlacedIndex] = useState<number | null>(null);
  const [activeColumn, setActiveColumn] = useState<number | null>(null);

  useEffect(() => {
    const prev = prevCellsRef.current;
    const changedIndex = cells.findIndex((cell, i) => cell !== null && prev[i] === null);
    if (changedIndex >= 0) setJustPlacedIndex(changedIndex);
    prevCellsRef.current = cells;
  }, [cells]);

  const winningSet = new Set(winningLine ?? []);

  return (
    <div
      className="grid gap-1.5 bg-surface-sunken rounded-2xl p-2 w-full"
      style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: COLUMNS }, (_, col) => {
        const previewRow = activeColumn === col ? lowestEmptyRow(cells, col) : null;
        const columnFull = lowestEmptyRow(cells, col) === null;

        return (
          <button
            key={col}
            type="button"
            disabled={disabled || columnFull}
            aria-label={`Columna ${col + 1}`}
            className="grid gap-1.5 disabled:cursor-not-allowed w-full"
            style={{ gridTemplateRows: `repeat(${ROWS}, auto)` }}
            onPointerEnter={() => !disabled && !columnFull && setActiveColumn(col)}
            onPointerLeave={() => setActiveColumn((c) => (c === col ? null : c))}
            onClick={() => {
              if (disabled || columnFull) return;
              onColumnClick(col);
              setActiveColumn(null);
            }}
          >
            {Array.from({ length: ROWS }, (_, row) => {
              const index = row * COLUMNS + col;
              const side = cells[index];
              const isWinning = winningSet.has(index);
              const isGhost = previewRow === row && side === null;

              const cellClasses =
                "absolute inset-0.5 " +
                (side && index === justPlacedIndex ? "motion-strike " : "") +
                (isWinning ? "motion-celebrate " : "");

              return (
                <div key={row} className="relative w-full aspect-square">
                  <div
                    className={cellClasses}
                    style={{
                      clipPath: HEX_CLIP,
                      background: side
                        ? SIDE_COLOR[side]
                        : isGhost
                          ? SIDE_COLOR[turnSide]
                          : "var(--color-surface-well)",
                      opacity: isGhost ? 0.4 : !resolved || isWinning || !side ? 1 : 0.35,
                    }}
                  />
                </div>
              );
            })}
          </button>
        );
      })}
    </div>
  );
}
