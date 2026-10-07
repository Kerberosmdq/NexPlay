"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AVAILABLE_GAMES } from "@/lib/realtime/platformReducer";
import { Button, Dialog } from "@/components/ui";

const STEPS = ["step1", "step2", "step3"] as const;

/** TASK-0039: a three-step "how to play" for any registered game. Content
 * follows the same `games.<id>.*` catalog convention as a game's
 * `description`, so a new game only adds three strings per locale — no
 * `GameModule` contract change. */
export function HowToPlayButton({ gameId, compact = false }: { gameId: string; compact?: boolean }) {
  const t = useTranslations("Lobby");
  const tGame = useTranslations();
  const [open, setOpen] = useState(false);
  const game = AVAILABLE_GAMES[gameId];
  if (!game) return null;

  return (
    <>
      {/* Compact: a round "?" key for tight rows (the game picker), still
          announced by its full name. */}
      <Button
        variant="ghost"
        fullWidth={false}
        className={compact ? "w-14 px-0 text-2xl shrink-0" : "px-4 text-base"}
        aria-label={compact ? t("howToPlayButton") : undefined}
        onClick={() => setOpen(true)}
      >
        {compact ? "?" : t("howToPlayButton")}
      </Button>
      {open && (
        <Dialog title={t("howToPlayTitle", { game: tGame(game.meta.name) })} onClose={() => setOpen(false)}>
          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 items-start">
                <span
                  aria-hidden="true"
                  className="font-mono font-bold shrink-0 w-8 h-8 rounded-full bg-action-primary text-on-primary flex items-center justify-center"
                >
                  {i + 1}
                </span>
                <span className="text-ink pt-1">{tGame(`games.${gameId}.howTo.${step}`)}</span>
              </li>
            ))}
          </ol>
          <Button variant="primary" onClick={() => setOpen(false)}>
            {t("howToPlayCloseButton")}
          </Button>
        </Dialog>
      )}
    </>
  );
}
