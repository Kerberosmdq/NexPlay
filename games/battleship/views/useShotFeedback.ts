"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { BattleshipSide, BattleshipState, CellResult } from "../reducer";

export interface ShotAnnouncement {
  text: string;
  sunk: boolean;
  shipType: string | null;
}

/** Fire animation + hit/sink announcement: diffs the shared `shots`/
 * `sunkShips` against what this device last saw, so both devices play the
 * same feedback independently from the same shared state — no reducer field
 * needed. Lives above the phase switch in `Player.tsx` because it has to see
 * every update, whatever is on screen. */
export function useShotFeedback(state: BattleshipState, mySide: BattleshipSide | null) {
  const t = useTranslations("Battleship");
  const tShips = useTranslations("Battleship.ships");

  const prevShotsRef = useRef<{ A: Record<string, CellResult>; B: Record<string, CellResult> }>({ A: {}, B: {} });
  const prevSunkRef = useRef<{ A: string[]; B: string[] }>({ A: [], B: [] });
  const strikeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Every cell of the shot that just landed, as `${side}:${cell}` — a Set,
  // not a single cell. It used to be one string, so a multi-cell weapon
  // (M4b's Double/Triple/Cross) animated only whichever cell the diff loop
  // happened to visit last: the founder's "cuando disparas un tiro especial
  // solo se pone de color un solo cuadrado, no la forma del disparo".
  const [strikeCells, setStrikeCells] = useState<ReadonlySet<string>>(() => new Set());
  const [announcement, setAnnouncement] = useState<ShotAnnouncement | null>(null);

  useEffect(() => {
    // One shot resolves every cell of its shape at once, so this collects
    // the whole diff before touching state — the previous version set the
    // strike cell and the announcement *inside* the per-cell loop, which
    // meant a multi-cell weapon overwrote both on every iteration and only
    // the last cell survived to be rendered.
    const newCells: string[] = [];
    let hits = 0;
    let misses = 0;
    let sunkType: string | null = null;
    // `side` here is the *defending* side (whose ship, if any, was just
    // hit) — when it's my own side, the sinking was done TO me, not BY me,
    // so the phrasing has to flip.
    let iWasSunk = false;

    for (const side of ["A", "B"] as const) {
      const prevShots = prevShotsRef.current[side];
      for (const [cell, result] of Object.entries(state.shots[side])) {
        if (cell in prevShots) continue; // already seen, not a new result
        newCells.push(`${side}:${cell}`);
        if (result === "hit") hits++;
        else misses++;
      }
      const newlySunk = state.sunkShips[side].slice(prevSunkRef.current[side].length);
      if (newlySunk.length > 0) {
        // A Cross can complete two ships at once; the modal names one, and
        // naming the last is what the previous per-cell loop effectively did.
        sunkType = newlySunk[newlySunk.length - 1];
        iWasSunk = side === mySide;
      }
    }

    prevShotsRef.current = { A: { ...state.shots.A }, B: { ...state.shots.B } };
    prevSunkRef.current = { A: [...state.sunkShips.A], B: [...state.sunkShips.B] };

    if (newCells.length === 0) return;

    if (strikeTimerRef.current) clearTimeout(strikeTimerRef.current);
    // This is transient feedback on a timer, not state derivable during
    // render: the strike animation and banner exist for 2.2s after a shot
    // lands and then clear themselves, so there is nothing to compute from
    // the current props instead. The external system being synchronized is
    // the timer above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStrikeCells(new Set(newCells));
    setAnnouncement({
      text: sunkType
        ? t(iWasSunk ? "firing.shipSunkAnnouncement" : "firing.sunkAnnouncement", { ship: tShips(sunkType) })
        : newCells.length > 1
          ? // A multi-cell weapon needs its own phrasing: "¡Tocado!" alone
            // is wrong when the same shot also splashed, and picking one
            // cell's result to report was what made the old feedback
            // arbitrary.
            t("firing.multiAnnouncement", { hits, misses })
          : hits > 0
            ? t("firing.hitAnnouncement")
            : t("firing.missAnnouncement"),
      sunk: Boolean(sunkType),
      shipType: sunkType,
    });
    strikeTimerRef.current = setTimeout(() => {
      setStrikeCells(new Set());
      setAnnouncement(null);
    }, 2200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.shots, state.sunkShips]);

  useEffect(
    () => () => {
      if (strikeTimerRef.current) clearTimeout(strikeTimerRef.current);
    },
    []
  );

  const dismiss = () => {
    if (strikeTimerRef.current) clearTimeout(strikeTimerRef.current);
    setStrikeCells(new Set());
    setAnnouncement(null);
  };

  return { strikeCells, announcement, dismiss };
}
