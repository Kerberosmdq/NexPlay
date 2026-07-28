import { describe, expect, it } from "vitest";
import { GUESS_WHO_CHARACTERS } from "@/games/guess-who/content/characters";
import type { GuessWhoTraits } from "@/games/guess-who/content/types";

// Difficulty for this game lives entirely in content design, not reducer
// logic (docs/09_ai/tasks/TASK-0038-guess-who.md): every trait is a
// literal askable yes/no question, so if one value covered nearly all (or
// almost none) of the roster, that question would be either a near-instant
// giveaway or a waste of a turn. This guards the actual authored roster,
// not just the mechanism that reads it.
const MIN_SHARE = 0.1; // no value may apply to fewer than 10% of characters
const MAX_SHARE = 0.65; // or more than 65%

function tally<T extends string | boolean>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return counts;
}

function assertBalanced(label: string, counts: Map<string | boolean, number>, total: number) {
  for (const [value, count] of counts) {
    const share = count / total;
    expect(share, `${label}=${value} covers ${count}/${total} characters (${(share * 100).toFixed(0)}%)`).toBeGreaterThanOrEqual(
      MIN_SHARE
    );
    expect(share, `${label}=${value} covers ${count}/${total} characters (${(share * 100).toFixed(0)}%)`).toBeLessThanOrEqual(
      MAX_SHARE
    );
  }
}

describe("Guess Who roster", () => {
  it("has exactly 32 characters", () => {
    expect(GUESS_WHO_CHARACTERS).toHaveLength(32);
  });

  it("has unique ids and unique names", () => {
    const ids = GUESS_WHO_CHARACTERS.map((c) => c.id);
    const names = GUESS_WHO_CHARACTERS.map((c) => c.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  const total = GUESS_WHO_CHARACTERS.length;
  const traitKeys: (keyof GuessWhoTraits)[] = [
    "glasses",
    "hat",
    "hairColor",
    "hairLength",
    "facialHair",
    "earrings",
  ];

  for (const key of traitKeys) {
    it(`no single "${key}" value is a giveaway or a wasted question`, () => {
      const values = GUESS_WHO_CHARACTERS.map((c) => c.traits[key]);
      const counts = tally(values);
      assertBalanced(key, counts, total);
    });
  }

  it("is not dominated by any single fully-repeated combination", () => {
    // A handful of exact-duplicate trait combinations is fine (the game
    // still works — players fall back to the character's actual look/name
    // once traits alone can't distinguish), but the roster shouldn't be
    // mostly duplicates of a small number of templates.
    const combos = GUESS_WHO_CHARACTERS.map((c) => JSON.stringify(c.traits));
    const uniqueCombos = new Set(combos).size;
    expect(uniqueCombos).toBeGreaterThanOrEqual(total * 0.8);
  });
});
