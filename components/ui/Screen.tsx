import type { ReactNode } from "react";
import { Button } from "./Button";

export interface ScreenProps {
  displayName?: string;
  onExit?: () => void;
  exitLabel?: string;
  children: ReactNode;
}

/** ADR-0004 §2: the persistent top bar (whose player, a way out) every
 * in-session screen renders above its content. Replaces a raw 12px "✕"
 * with no accessible label and no real tap target — using `Button` here
 * gives it both for free. */
export function Screen({ displayName, onExit, exitLabel = "Salir", children }: ScreenProps) {
  return (
    <div className="w-full flex flex-col items-center gap-4">
      {(displayName || onExit) && (
        <div className="w-full max-w-md flex justify-between items-center px-2">
          <span className="text-xs text-ink-muted">{displayName}</span>
          {onExit && (
            <Button variant="ghost" fullWidth={false} onClick={onExit} aria-label={exitLabel} className="px-4">
              ✕
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
