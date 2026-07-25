"use client";

import { useState, type ReactNode } from "react";

export interface RevealCardProps {
  hidden: ReactNode;
  revealed: ReactNode;
  className?: string;
}

/** ADR-0004 §2 + §3: the press-and-hold secret reveal (a role, a word).
 * Applies the `motion-reveal` gesture to the revealed content — this is
 * the direct fix for the audit's top finding: the previous version
 * referenced `animate-in fade-in zoom-in` from `tailwindcss-animate`, a
 * package that was never installed, so the reveal never actually
 * animated. The penumbra "dim the room" look (BDR-0001) is code task 2's
 * job; this primitive exists and animates correctly ahead of that. */
export function RevealCard({ hidden, revealed, className = "" }: RevealCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <button
      onPointerDown={() => setIsRevealed(true)}
      onPointerUp={() => setIsRevealed(false)}
      onPointerLeave={() => setIsRevealed(false)}
      className={`w-full bg-surface-raised border-2 border-line active:border-focus rounded-3xl p-10 flex flex-col items-center justify-center min-h-[300px] touch-none select-none transition-colors ${className}`}
    >
      {!isRevealed ? hidden : <div className="motion-reveal">{revealed}</div>}
    </button>
  );
}
