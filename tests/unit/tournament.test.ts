import { describe, expect, it } from "vitest";
import {
  advanceTournament,
  buildFirstRound,
  buildNextRound,
  nextPlayableMatch,
  isRoundComplete,
  type TournamentMatch,
} from "@/lib/realtime/tournament";

describe("buildFirstRound", () => {
  it("4 players (a power of 2) produces two matches, no byes", () => {
    const round = buildFirstRound(["p1", "p2", "p3", "p4"]);
    expect(round).toEqual([
      { round: 1, slotInRound: 0, playerA: "p1", playerB: "p2", winner: null },
      { round: 1, slotInRound: 1, playerA: "p3", playerB: "p4", winner: null },
    ]);
  });

  it("3 players gets one automatic bye, pre-resolved with no game played", () => {
    const round = buildFirstRound(["p1", "p2", "p3"]);
    expect(round).toEqual([
      { round: 1, slotInRound: 0, playerA: "p1", playerB: null, winner: "p1" },
      { round: 1, slotInRound: 1, playerA: "p2", playerB: "p3", winner: null },
    ]);
  });

  it("5 players pads to a bracket of 8 with three byes", () => {
    const round = buildFirstRound(["p1", "p2", "p3", "p4", "p5"]);
    expect(round).toHaveLength(4);
    const byes = round.filter((m) => m.playerB === null);
    expect(byes).toHaveLength(3);
    expect(byes.every((m) => m.winner === m.playerA)).toBe(true);
    // The one real match is whoever's left after the byes.
    const realMatch = round.find((m) => m.playerB !== null)!;
    expect(realMatch).toEqual({ round: 1, slotInRound: 3, playerA: "p4", playerB: "p5", winner: null });
  });

  it("requires no player to appear twice or be dropped", () => {
    const round = buildFirstRound(["p1", "p2", "p3", "p4", "p5", "p6"]);
    const allPlayers = round.flatMap((m) => [m.playerA, m.playerB]).filter((p): p is string => p !== null);
    expect(allPlayers.sort()).toEqual(["p1", "p2", "p3", "p4", "p5", "p6"].sort());
  });
});

describe("buildNextRound", () => {
  it("pairs up a fully resolved round's winners in order", () => {
    const round1: TournamentMatch[] = [
      { round: 1, slotInRound: 0, playerA: "p1", playerB: "p2", winner: "p1" },
      { round: 1, slotInRound: 1, playerA: "p3", playerB: "p4", winner: "p4" },
    ];
    const round2 = buildNextRound(round1);
    expect(round2).toEqual([{ round: 2, slotInRound: 0, playerA: "p1", playerB: "p4", winner: null }]);
  });

  it("returns null once the previous round was the final (a single match)", () => {
    const final: TournamentMatch[] = [{ round: 3, slotInRound: 0, playerA: "p1", playerB: "p4", winner: "p1" }];
    expect(buildNextRound(final)).toBeNull();
  });
});

describe("nextPlayableMatch / isRoundComplete", () => {
  it("finds the first unresolved match, skipping pre-resolved byes", () => {
    const round: TournamentMatch[] = [
      { round: 1, slotInRound: 0, playerA: "p1", playerB: null, winner: "p1" },
      { round: 1, slotInRound: 1, playerA: "p2", playerB: "p3", winner: null },
    ];
    expect(nextPlayableMatch(round)).toEqual(round[1]);
    expect(isRoundComplete(round)).toBe(false);
  });

  it("reports a round complete once every match has a winner", () => {
    const round: TournamentMatch[] = [
      { round: 1, slotInRound: 0, playerA: "p1", playerB: null, winner: "p1" },
      { round: 1, slotInRound: 1, playerA: "p2", playerB: "p3", winner: "p2" },
    ];
    expect(nextPlayableMatch(round)).toBeNull();
    expect(isRoundComplete(round)).toBe(true);
  });
});

describe("a full 5-player tournament, round by round", () => {
  it("advances from the first round to a champion", () => {
    let round = buildFirstRound(["p1", "p2", "p3", "p4", "p5"]);
    expect(round).toHaveLength(4); // 3 byes + 1 real match

    // Resolve the one real match (p4 vs p5) — the byes are already resolved.
    round = round.map((m) => (m.playerB === "p5" ? { ...m, winner: "p5" } : m));
    expect(isRoundComplete(round)).toBe(true);

    let next = buildNextRound(round)!;
    expect(next).toHaveLength(2); // 4 winners -> 2 matches
    // Resolve round 2.
    next = next.map((m, i) => ({ ...m, winner: i === 0 ? m.playerA : m.playerB! }));
    expect(isRoundComplete(next)).toBe(true);

    const final = buildNextRound(next)!;
    expect(final).toHaveLength(1);
    const resolvedFinal = final.map((m) => ({ ...m, winner: m.playerA }));
    expect(buildNextRound(resolvedFinal)).toBeNull(); // champion decided, no round 4
  });
});

describe("advanceTournament", () => {
  it("resolves the current match and returns the next playable match in the same round", () => {
    const rounds: TournamentMatch[][] = [
      [
        { round: 1, slotInRound: 0, playerA: "p1", playerB: "p2", winner: null },
        { round: 1, slotInRound: 1, playerA: "p3", playerB: "p4", winner: null },
      ],
    ];
    const result = advanceTournament(rounds, "p1");
    expect(result.champion).toBeNull();
    expect(result.nextMatch).toEqual({ round: 1, slotInRound: 1, playerA: "p3", playerB: "p4", winner: null });
    expect(result.rounds[0][0].winner).toBe("p1");
    expect(result.rounds).toHaveLength(1); // still round 1
  });

  it("builds and starts the next round once the current one is fully resolved", () => {
    const rounds: TournamentMatch[][] = [
      [
        { round: 1, slotInRound: 0, playerA: "p1", playerB: "p2", winner: "p1" },
        { round: 1, slotInRound: 1, playerA: "p3", playerB: "p4", winner: null },
      ],
    ];
    const result = advanceTournament(rounds, "p4");
    expect(result.champion).toBeNull();
    expect(result.rounds).toHaveLength(2);
    expect(result.rounds[1]).toEqual([{ round: 2, slotInRound: 0, playerA: "p1", playerB: "p4", winner: null }]);
    expect(result.nextMatch).toEqual(result.rounds[1][0]);
  });

  it("crowns a champion once the final match resolves, with no next match", () => {
    const rounds: TournamentMatch[][] = [[{ round: 2, slotInRound: 0, playerA: "p1", playerB: "p4", winner: null }]];
    const result = advanceTournament(rounds, "p4");
    expect(result.champion).toBe("p4");
    expect(result.nextMatch).toBeNull();
    expect(result.rounds[0][0].winner).toBe("p4");
  });

  it("does not mutate the rounds array passed in", () => {
    const rounds: TournamentMatch[][] = [
      [{ round: 1, slotInRound: 0, playerA: "p1", playerB: "p2", winner: null }],
    ];
    const original = JSON.parse(JSON.stringify(rounds));
    advanceTournament(rounds, "p1");
    expect(rounds).toEqual(original);
  });
});
