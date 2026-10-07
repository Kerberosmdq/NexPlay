import type { ReactNode } from "react";

export interface NexMarkProps {
  /** Rendered size in px (width; height follows the hexagon's aspect). */
  size?: number;
  /** What's embossed inside the hexagon (BDR-0002 §8: the outer shape never
   * changes, the interior is per game). Drawn in a 0–32 viewBox, centered;
   * defaults to four toy-brick studs. */
  glyph?: ReactNode;
  className?: string;
}

/** BDR-0002 §8: the Nex hexagon as a chunky yellow plastic token sitting on
 * its molded edge. Decorative — callers pair it with a visible name. */
export function NexMark({ size = 72, glyph, className = "" }: NexMarkProps) {
  return (
    <svg
      viewBox="0 0 100 110"
      width={size}
      height={(size * 110) / 100}
      aria-hidden="true"
      className={className}
    >
      <polygon points="50,10 91.6,34 91.6,82 50,106 8.4,82 8.4,34" fill="var(--color-edge-secondary)" />
      <polygon
        points="50,2 91.6,26 91.6,74 50,98 8.4,74 8.4,26"
        fill="var(--color-action-secondary)"
        stroke="var(--color-edge-secondary)"
        strokeWidth="2"
      />
      <svg x="22" y="22" width="56" height="56" viewBox="0 0 32 32" color="var(--color-ink)">
        {glyph ?? (
          <g fill="currentColor">
            <circle cx="10" cy="10" r="4.5" />
            <circle cx="22" cy="10" r="4.5" />
            <circle cx="10" cy="22" r="4.5" />
            <circle cx="22" cy="22" r="4.5" />
          </g>
        )}
      </svg>
    </svg>
  );
}
