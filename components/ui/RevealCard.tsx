"use client";

import { useState, type ReactNode } from "react";

export interface RevealCardProps {
  hidden: ReactNode;
  revealed: ReactNode;
  className?: string;
  /** Fires each time the card is pressed open — lets a pass-and-play flow
   * keep its "next player" step locked until the secret was actually seen
   * (TASK-0039). */
  onReveal?: () => void;
}

/** ADR-0004 §2 + §3, BDR-0002 §9: the press-and-hold secret reveal (a role,
 * a word) — a prize-machine capsule. While it's held, the lid pops off, the
 * card inside rises out, and everything else on screen is covered by bare
 * baseplate so nothing competes with (or leaks next to) the secret. Let go
 * and it snaps shut. `revealed` content is read on the white card, so it
 * uses the normal ink/action tokens.
 *
 * Keyboard: Space/Enter held down is the same as a press-and-hold —
 * required since pass-and-play flows wait for `onReveal`. */
export function RevealCard({ hidden, revealed, className = "", onReveal }: RevealCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const open = () => {
    setIsRevealed(true);
    onReveal?.();
  };
  const close = () => setIsRevealed(false);

  return (
    <>
      {/* Privacy cover: bare baseplate over the whole screen while open. */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 pointer-events-none transition-opacity duration-150 motion-reduce:transition-none ${
          isRevealed ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundColor: "var(--color-ground)",
          backgroundImage:
            "radial-gradient(circle at 50% 44%, var(--color-ground-stud) 0 6px, transparent 6.5px)",
          backgroundSize: "24px 24px",
        }}
      />
      <button
        onPointerDown={open}
        onPointerUp={close}
        onPointerLeave={close}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            open();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") close();
        }}
        onBlur={close}
        className={`relative z-50 w-full flex flex-col items-center gap-5 py-4 touch-none select-none rounded-[1.75rem] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus ${className}`}
      >
        {/* The capsule: a tall yellow lid with a molded rim on a white
            base — egg-shaped like a prize-machine capsule (and deliberately
            not a red-over-white ball). Open, the lid flies up and aside. */}
        <div aria-hidden="true" className="relative w-32 h-44">
          <div
            className={`absolute left-0 right-0 top-0 h-[6.5rem] rounded-t-[4rem] bg-action-secondary shadow-[inset_0_-8px_0_var(--color-edge-secondary)] origin-bottom-left transition-transform duration-300 ease-[cubic-bezier(0.3,1.5,0.5,1)] motion-reduce:transition-none ${
              isRevealed ? "-translate-x-12 -translate-y-14 -rotate-[38deg]" : ""
            }`}
          />
          <div className="absolute left-0 right-0 bottom-0 h-[4.25rem] rounded-b-[4rem] bg-surface-raised border-2 border-line shadow-[0_var(--edge-md)_0_var(--color-edge-raised)]" />
        </div>

        {isRevealed ? (
          <div className="motion-reveal w-full bg-surface-raised rounded-[1.75rem] px-6 py-8 shadow-[0_var(--edge-lg)_0_var(--color-edge-raised)]">
            {revealed}
          </div>
        ) : (
          <div className="w-full">{hidden}</div>
        )}
      </button>
    </>
  );
}
