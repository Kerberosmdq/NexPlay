"use client";

import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";

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
    <div className="w-full max-w-sm bg-black/20 rounded-2xl border border-white/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-purple-300 mb-2">{t("title")}</p>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => {
          const isAlive = aliveIds.includes(p.id);
          return (
            <span
              key={p.id}
              title={isAlive ? undefined : t("eliminated")}
              className={
                isAlive
                  ? "text-sm font-bold text-white bg-white/10 px-2.5 py-1 rounded-full"
                  : "text-sm font-bold text-white/30 bg-white/5 px-2.5 py-1 rounded-full line-through"
              }
            >
              {p.displayName}
            </span>
          );
        })}
      </div>
    </div>
  );
}
