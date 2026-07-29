"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

export interface MatchResolvedModalProps {
  /** The active game's own state — used only for reference-identity
   * comparison, to know when a *new* resolution has happened (a rematch or
   * the next tournament round produces a new object) versus this same
   * resolved match re-rendering, which must not re-show a dismissed modal. */
  gameState: unknown;
  winners: string[] | null | undefined;
  /** True for the host in multi-device (the only device allowed to dispatch
   * the continue action) and always true in single-device (no host concept
   * there). A non-host sees a waiting hint instead of the continue button —
   * same host-gating this platform already applies to "volver al lobby". */
  canContinue: boolean;
  onContinue: () => void;
}

/** Founder feedback (2026-07-28): a tournament match used to advance to the
 * next round (or crown a champion) the instant a winner was detected —
 * before anyone had a chance to see the final board or how the match was
 * won. This pauses on every match's resolution, for every game with
 * `getWinner` (Connect 4, Battleship, Guess Who) in both device modes, and
 * lets whoever can act choose to keep looking or move on explicitly. */
export function MatchResolvedModal({ gameState, winners, canContinue, onContinue }: MatchResolvedModalProps) {
  const t = useTranslations("Lobby");
  const [dismissed, setDismissed] = useState(false);
  const lastStateRef = useRef<unknown>(null);

  useEffect(() => {
    if (lastStateRef.current !== gameState) {
      lastStateRef.current = gameState;
      setDismissed(false);
    }
  }, [gameState]);

  const hasWinner = Boolean(winners && winners.length > 0);
  if (!hasWinner || dismissed) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(43, 33, 24, 0.55)" }}
      onClick={() => setDismissed(true)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="match-resolved-title"
        aria-describedby="match-resolved-message"
        className="motion-deal bg-surface-raised border border-line rounded-3xl p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="match-resolved-title" className="font-display text-2xl text-ink">
          {t("matchResolvedTitle")}
        </h2>
        <p id="match-resolved-message" className="text-sm text-ink-muted">
          {t("matchResolvedMessage")}
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button variant="ghost" onClick={() => setDismissed(true)}>
            {t("matchResolvedViewButton")}
          </Button>
          {canContinue ? (
            <Button variant="secondary" onClick={onContinue}>
              {t("matchResolvedContinueButton")}
            </Button>
          ) : (
            <p className="text-xs text-ink-muted text-center">{t("matchResolvedWaitingHint")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
