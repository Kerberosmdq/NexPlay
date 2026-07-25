"use client";

import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";
import { PlayerChip } from "@/components/ui";

interface PlayerRosterProps {
  players: Player[];
  aliveIds: string[];
}

/** Compact "who's still in" strip shown during discussion/voting so a group
 * of 5+ players across multiple elimination rounds doesn't lose track of
 * who was already voted out. */
export function PlayerRoster({ players, aliveIds }: PlayerRosterProps) {
  const t = useTranslations("Impostor.roster");

  return (
    <div className="w-full max-w-sm bg-surface-sunken rounded-2xl border border-line p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted mb-2">{t("title")}</p>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <PlayerChip
            key={p.id}
            player={p}
            variant="roster"
            alive={aliveIds.includes(p.id)}
            eliminatedLabel={t("eliminated")}
          />
        ))}
      </div>
    </div>
  );
}
