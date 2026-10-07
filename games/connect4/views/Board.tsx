"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { playCue } from "@/lib/feedback";
import { lowestEmptyRow, COLUMNS, ROWS, type Cell } from "../winCheck";
import type { Connect4Side } from "../reducer";

import { Disc, HEX_CLIP } from "./parts";

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
  const t = useTranslations("Connect4");
  const prevCellsRef = useRef(cells);
  const [justPlacedIndex, setJustPlacedIndex] = useState<number | null>(null);
  const [activeColumn, setActiveColumn] = useState<number | null>(null);

  useEffect(() => {
    const prev = prevCellsRef.current;
    const changedIndex = cells.findIndex((cell, i) => cell !== null && prev[i] === null);
    if (changedIndex >= 0) {
      setJustPlacedIndex(changedIndex);
      playCue("drop");
    }
    prevCellsRef.current = cells;
  }, [cells]);

  const winningSet = new Set(winningLine ?? []);

  // BDR-0002: the classic plastic Connect 4 frame, in the game's green, on
  // its molded edge; empty slots are dark sockets cut into it.
  return (
    <div
      className="grid gap-1.5 bg-game-connect4 rounded-[1.5rem] p-2.5 w-full shadow-[0_var(--edge-lg)_0_var(--color-edge-game-connect4)]"
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
            aria-label={t("columnLabel", { n: col + 1 })}
            className="grid gap-1.5 disabled:cursor-not-allowed w-full rounded-xl focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
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

              const isLastMove = side !== null && index === justPlacedIndex;

              return (
                <div key={row} className="relative w-full aspect-square">
                  {/* The socket cut into the frame. */}
                  <div
                    className="absolute inset-0.5"
                    style={{ clipPath: HEX_CLIP, background: "var(--color-edge-game-connect4)" }}
                  />
                  {(side || isGhost) && (
                    <div
                      className={
                        "absolute inset-0.5 " +
                        (isLastMove ? "motion-drop " : "") +
                        (isWinning ? "motion-celebrate " : "")
                      }
                      // The disc falls from above the top row down to where
                      // it lands, and bounces (M6.5 phase 3).
                      style={
                        {
                          opacity: !resolved || isWinning ? 1 : 0.35,
                          "--drop-rows": row + 1,
                        } as React.CSSProperties
                      }
                    >
                      {/* The last disc dropped carries a dot, so the player
                          whose turn it is can see what the other just did. */}
                      <Disc side={side ?? turnSide} ghost={isGhost} marked={isLastMove && !resolved} />
                    </div>
                  )}
                </div>
              );
            })}
          </button>
        );
      })}
    </div>
  );
}
