"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "var(--color-action-primary)",
  "var(--color-action-secondary)",
  "var(--color-success)",
  "var(--color-accent)",
  "var(--color-surface-raised)",
];

type Piece = { left: number; size: number; dx: number; spin: number; fallMs: number; delay: number; color: string; hex: boolean };

/** BDR-0002: a burst of plastic pieces (studs and little hex tokens) thrown
 * up and falling off the bottom of the screen, for a win. Decorative only:
 * hidden from assistive tech, never blocks taps, removes itself after the
 * fall, and isn't shown at all with "reduce motion" (motion.css). Pieces are
 * generated after mount, so server and client markup always match. */
export function ToyConfetti({ count = 28 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    // Random layout is generated once per burst, client-side only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPieces(
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        size: 10 + Math.random() * 12,
        dx: (Math.random() - 0.5) * 160,
        spin: (Math.random() > 0.5 ? 1 : -1) * (240 + Math.random() * 480),
        fallMs: 1400 + Math.random() * 900,
        delay: Math.random() * 250,
        color: COLORS[i % COLORS.length],
        hex: i % 3 === 0,
      }))
    );
    const done = setTimeout(() => setPieces([]), 2600);
    return () => clearTimeout(done);
  }, [count]);

  if (pieces.length === 0) return null;

  return (
    <div aria-hidden="true" className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="motion-confetti absolute -top-6"
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.size,
              background: piece.color,
              borderRadius: piece.hex ? 0 : "50%",
              clipPath: piece.hex ? "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)" : undefined,
              boxShadow: piece.hex ? undefined : "inset 0 -3px 0 rgba(0,0,0,0.18)",
              animationDelay: `${piece.delay}ms`,
              "--dx": `${piece.dx}px`,
              "--spin": `${piece.spin}deg`,
              "--fall-ms": `${piece.fallMs}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
