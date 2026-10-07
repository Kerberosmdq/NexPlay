import type { ReactNode } from "react";

/** BDR-0002 §6: each game is a color *and* a pictogram — never the color
 * alone. Pictograms replace the emoji the games used as illustration.
 * Drawn in a 0–32 viewBox with chunky round strokes, in `currentColor`.
 *
 * Lives in the platform layer (like AVAILABLE_GAMES), keyed by game id, so
 * adding one doesn't touch the GameModule contract (ADR-0002). An unknown
 * id falls back to the plain Nex studs. */
const GLYPHS: Record<string, ReactNode> = {
  impostor: (
    <g>
      <path
        d="M3 9c7-5 19-5 26 0 0 10-6 17-13 17S3 19 3 9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="11" cy="13.5" rx="3" ry="2.2" fill="currentColor" />
      <ellipse cx="21" cy="13.5" rx="3" ry="2.2" fill="currentColor" />
    </g>
  ),
  "who-am-i": (
    <g>
      <path
        d="M10.5 11a5.5 5.5 0 1 1 8.3 4.7c-1.8 1-2.8 2.2-2.8 4.1v1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="27" r="2.3" fill="currentColor" />
    </g>
  ),
  connect4: (
    <g fill="currentColor">
      <circle cx="5" cy="27" r="3.6" />
      <circle cx="12.3" cy="19.7" r="3.6" />
      <circle cx="19.7" cy="12.3" r="3.6" />
      <circle cx="27" cy="5" r="3.6" />
    </g>
  ),
  "guess-who": (
    <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <circle cx="16" cy="16" r="12" />
      <circle cx="11.5" cy="14" r="3.2" />
      <circle cx="20.5" cy="14" r="3.2" />
      <path d="M14.7 14h2.6M12 21c2.2 1.6 5.8 1.6 8 0" />
    </g>
  ),
  battleship: (
    <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <rect x="4" y="4" width="24" height="24" rx="3" />
      <path d="M12 4v24M20 4v24M4 12h24M4 20h24" strokeWidth="1.6" />
      <circle cx="20" cy="12" r="4.5" strokeWidth="3" />
    </g>
  ),
};

/** Tailwind classes for a game's block color (bg + "on" text + molded
 * edge), from the per-game tokens in app/tokens.css. Spelled out in full so
 * Tailwind's scanner sees every class. */
export const GAME_BLOCK_CLASSES: Record<string, string> = {
  impostor: "bg-game-impostor text-on-game-impostor shadow-[0_var(--edge-md)_0_var(--color-edge-game-impostor)]",
  "who-am-i": "bg-game-who-am-i text-on-game-who-am-i shadow-[0_var(--edge-md)_0_var(--color-edge-game-who-am-i)]",
  connect4: "bg-game-connect4 text-on-game-connect4 shadow-[0_var(--edge-md)_0_var(--color-edge-game-connect4)]",
  "guess-who": "bg-game-guess-who text-on-game-guess-who shadow-[0_var(--edge-md)_0_var(--color-edge-game-guess-who)]",
  battleship:
    "bg-game-battleship text-on-game-battleship border-2 border-line shadow-[0_var(--edge-md)_0_var(--color-edge-game-battleship)]",
};

const FALLBACK_BLOCK = "bg-surface-sunken text-ink shadow-[0_var(--edge-md)_0_var(--color-edge-raised)]";

export function gameBlockClasses(gameId: string): string {
  return GAME_BLOCK_CLASSES[gameId] ?? FALLBACK_BLOCK;
}

export function gameGlyph(gameId: string): ReactNode | undefined {
  return GLYPHS[gameId];
}

export function GameIcon({ gameId, size = 40, className = "" }: { gameId: string; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className={className}>
      {GLYPHS[gameId] ?? (
        <g fill="currentColor">
          <circle cx="10" cy="10" r="4.5" />
          <circle cx="22" cy="10" r="4.5" />
          <circle cx="10" cy="22" r="4.5" />
          <circle cx="22" cy="22" r="4.5" />
        </g>
      )}
    </svg>
  );
}
