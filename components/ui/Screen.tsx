"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

export interface ScreenProps {
  displayName?: string;
  onExit?: () => void;
  exitLabel?: string;
  /** Shown in the exit-confirmation dialog's body. Defaults to the
   * multi-device wording ("you'll leave the game and the room") since
   * that's the more consequential case — pass a lighter single-device
   * message where there's no room/other players to leave behind. */
  exitConfirmMessage?: string;
  children: ReactNode;
}

/** ADR-0004 §2: the persistent top bar (whose player, a way out) every
 * in-session screen renders above its content. Replaces a raw 12px "✕"
 * with no accessible label and no real tap target — using `Button` here
 * gives it both for free.
 *
 * The exit action itself is never immediate: a founder-reported gap was
 * that tapping "✕" left the game (and, in multi-device, the whole room)
 * with zero warning. Now it opens a `ConfirmDialog` naming exactly what's
 * about to happen; `onExit` only fires once the user confirms. */
export function Screen({ displayName, onExit, exitLabel = "Exit", exitConfirmMessage, children }: ScreenProps) {
  const t = useTranslations("Lobby");
  const [confirmingExit, setConfirmingExit] = useState(false);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {(displayName || onExit) && (
        <div className="w-full max-w-md flex justify-between items-center px-2">
          <span className="text-xs text-ink-muted">{displayName}</span>
          {onExit && (
            <Button
              variant="ghost"
              fullWidth={false}
              onClick={() => setConfirmingExit(true)}
              aria-label={exitLabel}
              className="px-4"
            >
              ✕
            </Button>
          )}
        </div>
      )}
      {children}
      {confirmingExit && onExit && (
        <ConfirmDialog
          title={t("exitConfirmTitle")}
          message={exitConfirmMessage ?? t("exitConfirmMessage")}
          confirmLabel={t("exitConfirmConfirmButton")}
          cancelLabel={t("exitConfirmCancelButton")}
          onCancel={() => setConfirmingExit(false)}
          onConfirm={() => {
            setConfirmingExit(false);
            onExit();
          }}
        />
      )}
    </div>
  );
}
