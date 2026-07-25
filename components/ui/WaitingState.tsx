import type { ReactNode } from "react";

export interface WaitingStateProps {
  label: string;
  icon?: ReactNode;
}

/** ADR-0004 §2 + §3: the shared "waiting on something" state — connecting,
 * waiting for the host, waiting for other votes. Replaces the spinning
 * hourglass emoji duplicated across three files (a rotating glyph that
 * isn't drawn to rotate reads as visibly crooked mid-spin) with the
 * `pulse` gesture on a steady mark instead. */
export function WaitingState({ label, icon = "⬡" }: WaitingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <div className="text-4xl text-ink-muted motion-pulse">{icon}</div>
      <p className="text-xl text-ink-muted">{label}</p>
    </div>
  );
}
