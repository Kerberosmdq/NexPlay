"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Slides a game's screen up into place whenever its phase changes (setup →
 * reveal → discussion …), like a drawer of the toy box (BDR-0002 §10).
 *
 * It replays the animation on the same element instead of remounting it
 * with a new `key`: a remount would throw away the game view's own local
 * state (pass-and-play names, whose turn it is), which lives in the view.
 * "Reduce motion" skips it entirely. */
export function PhaseTransition({ phaseKey, children }: { phaseKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = ref.current;
    if (!el || typeof el.animate !== "function") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 260, easing: "cubic-bezier(0.3, 1.4, 0.5, 1)" }
    );
  }, [phaseKey]);

  return (
    <div ref={ref} className="w-full flex flex-col items-center">
      {children}
    </div>
  );
}
