import type { Orientation } from "../placement";
import { weaponForShipType, type WeaponType } from "../weapons";

/** The colour each weapon is shown in — on its ship's stripe and on its key
 * in the weapon dock, so a player can see which ship gives which shot. */
export const WEAPON_COLOR: Record<WeaponType, string> = {
  cross: "var(--color-action-primary)",
  triple: "var(--color-accent)",
  doubleVertical: "var(--color-success)",
  doubleHorizontal: "var(--color-action-secondary)",
};

const UNIT = 40; // one cell, in SVG units

/** Deck details per ship type, drawn bow-up in a `UNIT`-wide column of
 * height `h`. Plain grey shapes: they read as different ships without
 * competing with the pegs and the weapon stripe. */
function deck(type: string, h: number) {
  const fill = "var(--color-ship-deck)";
  const dark = "var(--color-ship-edge)";
  switch (type) {
    case "carrier":
      return (
        <>
          <rect x="12" y="28" width="16" height={h - 46} rx="3" fill={fill} />
          <path d={`M20 34v${h - 58}`} stroke="var(--color-surface-sunken)" strokeWidth="1.6" strokeDasharray="5 5" />
          <rect x="27" y={h * 0.42} width="7" height="16" rx="2" fill={dark} />
        </>
      );
    case "battleship":
      return (
        <>
          <circle cx="20" cy="38" r="6.5" fill={fill} />
          <rect x="18.5" y="24" width="3" height="10" rx="1.5" fill={dark} />
          <rect x="12" y={h / 2 - 12} width="16" height="24" rx="4" fill={fill} />
          <circle cx="20" cy={h - 36} r="6.5" fill={fill} />
          <rect x="18.5" y={h - 30} width="3" height="10" rx="1.5" fill={dark} />
        </>
      );
    case "destroyer":
      return (
        <>
          <circle cx="20" cy="34" r="5.5" fill={fill} />
          <rect x="13" y={h / 2 - 10} width="14" height="20" rx="4" fill={fill} />
          <circle cx="20" cy={h - 30} r="5.5" fill={fill} />
        </>
      );
    case "submarine":
      return <rect x="13" y={h / 2 - 12} width="14" height="22" rx="7" fill={dark} />;
    default:
      return <rect x="12" y="26" width="16" height="18" rx="4" fill={fill} />;
  }
}

function hullPath(type: string, h: number): string {
  if (type === "submarine") {
    return `M20 3 C31 7 35 20 35 33 L35 ${h - 17} C35 ${h - 7} 28 ${h - 3} 20 ${h - 3} C12 ${h - 3} 5 ${h - 7} 5 ${h - 17} L5 33 C5 20 9 7 20 3Z`;
  }
  return `M20 2 C31 9 36 21 36 33 L36 ${h - 10} Q36 ${h - 3} 28 ${h - 3} L12 ${h - 3} Q4 ${h - 3} 4 ${h - 10} L4 33 C4 21 9 9 20 2Z`;
}

/** A Battleship ship as a molded plastic toy piece, seen from above
 * (TASK-0048, replacing the photo-style PNG art): a grey hull on a darker
 * molded edge, simple deck details, a stripe in its weapon's colour, and a
 * peg hole per cell. A hit puts a red peg in that hole — the physical game's
 * feedback. Fills its box exactly: put it in a box `length` cells long.
 *
 * `hits` are cell indices along the ship, 0 = its top-left cell (the same
 * order as a `ShipPlacement`'s cells sorted by row, then column). */
export function ToyShip({
  type,
  length,
  orientation = "vertical",
  hits = [],
  sunk = false,
  ghost,
  className = "",
}: {
  type: string;
  length: number;
  orientation?: Orientation;
  hits?: number[];
  sunk?: boolean;
  /** Placement preview: translucent, tinted green where it fits, red where
   * it doesn't. */
  ghost?: { valid: boolean };
  className?: string;
}) {
  const h = length * UNIT;
  const weapon = weaponForShipType(type);
  const stripe = weapon ? WEAPON_COLOR[weapon] : "var(--color-line)";
  const horizontal = orientation === "horizontal";
  const hull = hullPath(type, h);

  const body = (
    <>
      <path d={hull} transform="translate(0 3)" fill="var(--color-ship-edge)" />
      <path d={hull} fill={ghost ? (ghost.valid ? "var(--color-success)" : "var(--color-action-danger)") : "var(--color-ship-hull)"} />
      <path d={`M5 ${h / 2 - 4}h30v8H5z`} fill={stripe} />
      {deck(type, h)}
      {Array.from({ length }, (_, i) => {
        // The bow is pointed, so its hole sits a little lower.
        const cy = i * UNIT + 20 + (i === 0 ? 5 : 0);
        return (
          <g key={i}>
            <circle cx="20" cy={cy} r="4.2" fill="var(--color-ship-hole)" />
            {hits.includes(i) && (
              <circle
                cx="20"
                cy={cy - 1}
                r="6"
                fill="var(--color-action-primary)"
                stroke="var(--color-edge-primary)"
                strokeWidth="1.8"
              />
            )}
          </g>
        );
      })}
    </>
  );

  return (
    <svg
      viewBox={horizontal ? `0 0 ${h} ${UNIT}` : `0 0 ${UNIT} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block w-full h-full ${sunk ? "grayscale opacity-60" : ""} ${ghost ? "opacity-70" : ""} ${className}`}
    >
      {/* Drawn bow-up; a horizontal ship is the same drawing turned so its
          first cell stays at the left. */}
      {horizontal ? <g transform={`translate(0 ${UNIT}) rotate(-90)`}>{body}</g> : body}
    </svg>
  );
}
