"use client";

import type { ReactNode } from "react";
import { ToyConfetti } from "@/components/ui";
import type { FeedbackCue } from "@/lib/feedback";
import { useCueOnMount } from "@/lib/feedback/react";
import type { Connect4Side } from "../reducer";

/** BDR-0002 pieces shared by both Connect 4 views. */

// The same hexagon the NexPlay mark itself uses — a token, not a plain
// circle, is what makes this board feel like this app's rather than a
// generic reskin (docs/09_ai/tasks/TASK-0037-connect4.md, "Option B").
export const HEX_CLIP = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

const FACE: Record<Connect4Side, string> = {
  A: "var(--color-action-primary)",
  B: "var(--color-action-secondary)",
};
const EDGE: Record<Connect4Side, string> = {
  A: "var(--color-edge-primary)",
  B: "var(--color-edge-secondary)",
};

/** A molded hex token: a darker edge layer with the colored face sitting on
 * top of it, offset upward. Clip-path clips box-shadows, so the edge is its
 * own layer instead. `marked` puts a white dot on it (the last move). */
export function Disc({
  side,
  ghost = false,
  marked = false,
  className = "",
}: {
  side: Connect4Side;
  ghost?: boolean;
  marked?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative w-full h-full ${ghost ? "opacity-40" : ""} ${className}`} aria-hidden="true">
      <div className="absolute inset-0" style={{ clipPath: HEX_CLIP, background: EDGE[side] }} />
      <div
        className="absolute inset-x-0 top-0 bottom-[10%] flex items-center justify-center"
        style={{ clipPath: HEX_CLIP, background: FACE[side] }}
      >
        {marked && <div className="w-[28%] h-[28%] rounded-full bg-surface-raised" />}
      </div>
    </div>
  );
}

/** Whose turn it is: their token next to their name, on a sunken strip. */
export function TurnBanner({ side, children }: { side: Connect4Side; children: ReactNode }) {
  return (
    <div className="w-full flex items-center justify-center gap-3 bg-surface-sunken rounded-2xl px-4 py-3">
      <div className="w-9 h-9 shrink-0">
        <Disc side={side} />
      </div>
      <p className="font-display text-xl text-ink">{children}</p>
    </div>
  );
}

/** The end of a match as a plastic block: the winner's token (or both, for
 * a draw) on the game's green. */
export function ResultBlock({
  winnerSide,
  title,
  cue = "win",
}: {
  winnerSide: Connect4Side | null;
  title: string;
  /** "win" for whoever won, "lose" on the losing device, "pop" for a draw. */
  cue?: FeedbackCue;
}) {
  useCueOnMount(cue);
  return (
    <div className="motion-celebrate w-full rounded-[1.75rem] bg-game-connect4 text-on-game-connect4 px-5 py-6 flex flex-col items-center gap-3 shadow-[0_var(--edge-lg)_0_var(--color-edge-game-connect4)]">
      {cue === "win" && <ToyConfetti />}
      <div className="flex gap-2">
        {(winnerSide ? [winnerSide] : (["A", "B"] as Connect4Side[])).map((side) => (
          <div key={side} className="w-14 h-14">
            <Disc side={side} />
          </div>
        ))}
      </div>
      <h2 className="font-display text-3xl text-center leading-tight">{title}</h2>
    </div>
  );
}
