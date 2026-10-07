"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { SoundToggle } from "./SoundToggle";

export interface ScreenProps {
  displayName?: string;
  onExit?: () => void;
  exitLabel?: string;
  /** Shown in the exit-confirmation dialog's body. Defaults to the
   * multi-device wording ("you'll leave the game and the room") since
   * that's the more consequential case — pass a lighter single-device
   * message where there's no room/other players to leave behind. */
  exitConfirmMessage?: string;
  /** Optional "back to the games list" action, shown at the left of the
   * top bar. One way back and one way out, both in the same place on every
   * screen, instead of extra exit buttons scattered through each game's
   * own view (TASK-0039). */
  onBack?: () => void;
  backLabel?: string;
  backAriaLabel?: string;
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
export function Screen({
  displayName,
  onExit,
  exitLabel = "Exit",
  exitConfirmMessage,
  onBack,
  backLabel,
  backAriaLabel,
  children,
}: ScreenProps) {
  const t = useTranslations("Lobby");
  const [confirmingExit, setConfirmingExit] = useState(false);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {(displayName || onExit || onBack) && (
        <div className="w-full max-w-lg flex justify-between items-center gap-3">
          {onBack ? (
            <Button variant="ghost" fullWidth={false} onClick={onBack} aria-label={backAriaLabel} className="px-4">
              <span aria-hidden="true">← </span>
              {backLabel}
            </Button>
          ) : (
            <span className="font-display text-lg text-on-ground">{displayName}</span>
          )}
          <div className="flex items-center gap-2">
            <SoundToggle />
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
        </div>
      )}
      {/* BDR-0002 §1–2: the blue baseplate is the table, never a surface to
          read on — every screen's content sits on one white plastic tray. */}
      <div className="w-full max-w-lg bg-surface rounded-[2rem] px-4 py-6 sm:px-6 shadow-[0_var(--edge-lg)_0_var(--color-edge-raised)] flex flex-col items-center">
        {children}
      </div>
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
