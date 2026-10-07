import type { ReactNode } from "react";
import { NexMark } from "./NexMark";

export interface WaitingStateProps {
  label: string;
  icon?: ReactNode;
}

/** ADR-0004 §2 + §3: the shared "waiting on something" state — connecting,
 * waiting for the host, waiting for other votes. A steady mark with the
 * `pulse` gesture (BDR-0002: the Nex hex token), never a spinning emoji. */
export function WaitingState({ label, icon }: WaitingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <div className="motion-pulse">{icon ?? <NexMark size={56} />}</div>
      <p className="text-xl font-semibold text-ink-muted">{label}</p>
    </div>
  );
}
