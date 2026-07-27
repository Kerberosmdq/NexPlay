import { cellId, type Orientation } from "./placement";

/** M4b's four special shot shapes (`docs/ROADMAP.md` M4b). Anchored on the
 * cell the firing side taps; `doubleHorizontal`/`doubleVertical` are each a
 * fixed, non-rotating shape (that's what makes them two separate entries
 * instead of one "double" with a chosen orientation) — only `triple` takes
 * an orientation, the same way ship placement does. */
export type WeaponType = "doubleHorizontal" | "doubleVertical" | "triple" | "cross";

/** Charge cost per shot, scaled to how many cells each shape covers.
 * Deliberately playtest-tunable (`docs/ROADMAP.md`: "the exact numbers are
 * playtest-tuned, the anti-snowball intent is not") — not a sacred table. */
export const WEAPON_COST: Record<WeaponType, number> = {
  doubleHorizontal: 2,
  doubleVertical: 2,
  triple: 3,
  cross: 4,
};

/** Which ship type carries which weapon — the "ship-bound" half of the
 * founder's charges+ship-bound combination: losing this ship loses this
 * weapon, full stop, regardless of remaining charges. `patrol` deliberately
 * carries no weapon in either fleet size; on an 8×8 board (no "battleship"
 * ship type) only 3 of the 4 weapons ever come into play in a given match —
 * confirmed acceptable, not a gap to close. */
export const SHIP_WEAPON: Partial<Record<string, WeaponType>> = {
  carrier: "cross",
  battleship: "triple",
  destroyer: "doubleVertical",
  submarine: "doubleHorizontal",
};

export function weaponForShipType(shipType: string): WeaponType | null {
  return SHIP_WEAPON[shipType] ?? null;
}

/** The cells a weapon would hit, anchored at (row, col) — off-board cells
 * are silently dropped rather than rejecting the whole shot (you're
 * bombarding an area, not placing a physical object; firing near an edge
 * just wastes part of the shot). `orientation` is ignored for every weapon
 * except `triple`. */
export function weaponCells(
  weapon: WeaponType,
  row: number,
  col: number,
  orientation: Orientation,
  boardSize: number
): string[] {
  const raw: Array<[number, number]> = (() => {
    switch (weapon) {
      case "doubleHorizontal":
        return [
          [row, col],
          [row, col + 1],
        ];
      case "doubleVertical":
        return [
          [row, col],
          [row + 1, col],
        ];
      case "triple":
        return orientation === "horizontal"
          ? [
              [row, col],
              [row, col + 1],
              [row, col + 2],
            ]
          : [
              [row, col],
              [row + 1, col],
              [row + 2, col],
            ];
      case "cross":
        return [
          [row, col],
          [row - 1, col],
          [row + 1, col],
          [row, col - 1],
          [row, col + 1],
        ];
    }
  })();

  return raw.filter(([r, c]) => r >= 0 && r < boardSize && c >= 0 && c < boardSize).map(([r, c]) => cellId(r, c));
}
