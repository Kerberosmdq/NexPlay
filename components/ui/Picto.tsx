import type { ReactNode } from "react";

export interface PictoProps {
  size?: number;
  className?: string;
}

/** BDR-0002: the shared frame for every game's pictograms — a 0–48 viewBox
 * drawn with chunky round strokes in `currentColor`, so each screen picks
 * the color. Decorative: always paired with text that says the same thing.
 * Games draw their own shapes inside it (they replace emoji illustration,
 * FEEL.md). */
export function Picto({ size = 56, className = "", children }: PictoProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
