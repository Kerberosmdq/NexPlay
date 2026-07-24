import type { Player } from "@/lib/types/room";
import { impostorContent, type ImpostorWord } from "./content";

/** Picks the round's secret word (never one already used this match) and a
 * shuffled player order to derive impostors from. Lives outside the reducer
 * because it uses Math.random() and next-intl's locale — the reducer stays
 * pure per CONVENTIONS.md, this is the one place that isn't. */
export function pickWordAndImpostors(players: Player[], locale: string, usedWordIds: string[]) {
  const allWords: ImpostorWord[] = impostorContent.locale[locale as "en" | "es"] ?? impostorContent.locale.en;
  const usedSet = new Set(usedWordIds);
  const unusedWords = allWords.filter((w) => !usedSet.has(w.id));
  // If the group has somehow played through the entire word pack in one
  // sitting, fall back to the full list rather than crashing on an empty pool.
  const pool = unusedWords.length > 0 ? unusedWords : allWords;

  const word = pool[Math.floor(Math.random() * pool.length)];
  const shuffledPlayerIds = [...players].sort(() => Math.random() - 0.5).map((p) => p.id);
  return { word, shuffledPlayerIds };
}
