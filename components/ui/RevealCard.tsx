"use client";

import { useState, type ReactNode } from "react";

export interface RevealCardProps {
  hidden: ReactNode;
  revealed: ReactNode;
  className?: string;
}

/** ADR-0004 §2 + §3, BDR-0001: the press-and-hold secret reveal (a role, a
 * word). This is the one place NexPlay goes dark — the screen dims to
 * penumbra and a warm glow gathers around the card while it's held, "as
 * if someone cupped a hand around it." `revealed` content should use the
 * `--color-on-penumbra*`/`--color-penumbra-*` tokens (not the light-theme
 * ones), since it's read against this dark ground, not the parchment
 * surface. Applies the `motion-reveal` gesture — the direct fix for the
 * audit's top finding: the previous version referenced `animate-in
 * fade-in zoom-in` from `tailwindcss-animate`, a package that was never
 * installed, so the reveal never actually animated. */
export function RevealCard({ hidden, revealed, className = "" }: RevealCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <>
      {/* Penumbra scrim: fixed so it dims the whole screen regardless of
          where this card sits in the layout, not just the card itself. */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 pointer-events-none ${isRevealed ? "opacity-95" : "opacity-0"}`}
        style={{ backgroundColor: "var(--color-penumbra-ground)" }}
      />
      <button
        onPointerDown={() => setIsRevealed(true)}
        onPointerUp={() => setIsRevealed(false)}
        onPointerLeave={() => setIsRevealed(false)}
        className={`relative z-50 w-full rounded-3xl p-10 flex flex-col items-center justify-center min-h-[300px] touch-none select-none border-2 ${
          isRevealed ? "border-transparent bg-transparent" : "border-line active:border-focus bg-surface-raised"
        } ${className}`}
        style={
          isRevealed
            ? {
                backgroundColor: "var(--color-penumbra-ground)",
                boxShadow: "0 0 70px 12px color-mix(in srgb, var(--color-penumbra-glow) 40%, transparent)",
              }
            : undefined
        }
      >
        {!isRevealed ? hidden : <div className="motion-reveal">{revealed}</div>}
      </button>
    </>
  );
}
