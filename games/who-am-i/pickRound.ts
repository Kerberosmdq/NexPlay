import type { Player } from "@/lib/types/room";
import { whoAmIContent, type WhoAmIWord } from "./content";

/** Picks one distinct, never-before-used-this-match word per player, and a
 * shuffled turn order. Lives outside the reducer because it uses
 * Math.random() and next-intl's locale — the reducer stays pure per
 * CONVENTIONS.md, this is the one place that isn't. */
export function pickAssignmentsAndTurnOrder(players: Player[], locale: string, usedWordIds: string[]) {
  const allWords: WhoAmIWord[] = whoAmIContent.locale[locale as "en" | "es"] ?? whoAmIContent.locale.en;
  const usedSet = new Set(usedWordIds);
  const unusedWords = allWords.filter((w) => !usedSet.has(w.id));
  // If the group has somehow played through the entire pack in one
  // sitting, fall back to the full list rather than crashing on an empty pool.
  const pool = unusedWords.length >= players.length ? unusedWords : allWords;

  const shuffledWords = [...pool].sort(() => Math.random() - 0.5);
  const assignments: Record<string, WhoAmIWord> = {};
  players.forEach((player, i) => {
    assignments[player.id] = shuffledWords[i % shuffledWords.length];
  });

  const turnOrder = [...players].sort(() => Math.random() - 0.5).map((p) => p.id);

  return { assignments, turnOrder };
}
