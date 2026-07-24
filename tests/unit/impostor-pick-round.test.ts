import { describe, expect, it } from "vitest";
import { pickWordAndImpostors } from "@/games/impostor/pickRound";
import { impostorContent } from "@/games/impostor/content";
import type { Player } from "@/lib/types/room";

const PLAYERS: Player[] = [
  { id: "p1", displayName: "A", isHost: true, joinedAt: 1, isOnline: true },
  { id: "p2", displayName: "B", isHost: false, joinedAt: 2, isOnline: true },
  { id: "p3", displayName: "C", isHost: false, joinedAt: 3, isOnline: true },
];

describe("pickWordAndImpostors", () => {
  it("never picks a word already in usedWordIds", () => {
    const allIds = impostorContent.locale.en.map((w) => w.id);
    const usedWordIds = allIds.slice(0, -1); // every word except the last one

    for (let i = 0; i < 20; i++) {
      const { word } = pickWordAndImpostors(PLAYERS, "en", usedWordIds);
      expect(word.id).toBe(allIds[allIds.length - 1]);
    }
  });

  it("falls back to the full pool if every word has been used", () => {
    const allIds = impostorContent.locale.en.map((w) => w.id);
    const { word } = pickWordAndImpostors(PLAYERS, "en", allIds);
    expect(allIds).toContain(word.id);
  });

  it("shuffles all given players into shuffledPlayerIds", () => {
    const { shuffledPlayerIds } = pickWordAndImpostors(PLAYERS, "en", []);
    expect(shuffledPlayerIds.sort()).toEqual(["p1", "p2", "p3"]);
  });
});
