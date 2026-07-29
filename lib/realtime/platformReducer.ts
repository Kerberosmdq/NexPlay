"use client";

import { impostorGameModule } from "@/games/impostor/module";
import { whoAmIGameModule } from "@/games/who-am-i/module";
import { battleshipGameModule } from "@/games/battleship/module";
import { connect4GameModule } from "@/games/connect4/module";
import { guessWhoGameModule } from "@/games/guess-who/module";
import type { AnyGameModule, GameModule, Player } from "@/lib/types/room";
import { advanceTournament, buildFirstRound, nextPlayableMatch, type TournamentMatch } from "./tournament";

/**
 * A heterogeneous registry (`AVAILABLE_GAMES`) necessarily erases each
 * game's concrete TConfig/TState/TAction/TPrivate to `unknown` — that's what
 * `AnyGameModule` is for. Assigning a concrete `GameModule<TConfig, ...>`
 * into that shape is a legitimate upcast (every concrete module really is
 * usable through the erased interface — the platform never fabricates a
 * config or state, it only ever passes back what it was given), so this one
 * cast is centralized here instead of scattered/unsafe at each call site.
 */
function toAnyGameModule<TConfig, TState, TAction, TPrivate>(
  mod: GameModule<TConfig, TState, TAction, TPrivate>
): AnyGameModule {
  return mod as unknown as AnyGameModule;
}

// Registry of all available games.
export const AVAILABLE_GAMES: Record<string, AnyGameModule> = {
  [impostorGameModule.id]: toAnyGameModule(impostorGameModule),
  [whoAmIGameModule.id]: toAnyGameModule(whoAmIGameModule),
  [battleshipGameModule.id]: toAnyGameModule(battleshipGameModule),
  [connect4GameModule.id]: toAnyGameModule(connect4GameModule),
  [guessWhoGameModule.id]: toAnyGameModule(guessWhoGameModule),
};

/** Derives a game's starting config from its configSchema defaults — the
 * platform selects a game generically and has no business knowing its
 * concrete config shape beyond "whatever the schema declares as default". */
function buildDefaultConfig(gameModule: AnyGameModule): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(gameModule.configSchema as Record<string, { default: unknown }>).map(
      ([key, field]) => [key, field.default]
    )
  );
}

// M4d: a completed tournament's status is a distinct terminal screen (the
// champion, the final bracket), not the same "LOBBY" a host returns to
// explicitly (PLATFORM_RETURN_LOBBY still gets there from either state).
export type PlatformStatus = "LOBBY" | "PLAYING" | "TOURNAMENT_COMPLETE";

/** M4d: a single-elimination bracket running on top of the same
 * single-match machinery every game already uses — `activeGameId`/
 * `gameState` always represent *the currently playing match*, exactly as
 * without a tournament; this just remembers the bracket and advances those
 * two fields to the next match once one resolves. */
export interface TournamentState {
  gameId: string;
  rounds: TournamentMatch[][]; // rounds[0] = round 1, appended to as built
  champion: string | null; // set once the final match resolves
}

export interface PlatformState {
  status: PlatformStatus;
  activeGameId: string | null;
  gameState: unknown; // The state of the currently active game
  tournament: TournamentState | null;
}

export type PlatformAction =
  | { type: "PLATFORM_START_GAME"; gameId: string; players: Player[] }
  // `shuffledPlayers` is the full room roster, already shuffled by the
  // caller (the view) — same "Math.random() stays out of the reducer" rule
  // `randomFleetPlacement`/`pickRound.ts` already follow.
  | { type: "PLATFORM_START_TOURNAMENT"; gameId: string; shuffledPlayers: Player[] }
  // `players` is the current room roster, passed fresh each time so the
  // reducer can build the next match's `Player[]` without storing its own
  // stale copy of the roster inside `TournamentState`.
  | { type: "PLATFORM_ADVANCE_TOURNAMENT"; winnerId: string; players: Player[] }
  | { type: "PLATFORM_RETURN_LOBBY" }
  | { type: "GAME_ACTION"; action: unknown };

export function createInitialPlatformState(): PlatformState {
  return {
    status: "LOBBY",
    activeGameId: null,
    gameState: null,
    tournament: null,
  };
}

function startMatch(gameModule: AnyGameModule, matchPlayers: Player[]): unknown {
  return gameModule.setup(matchPlayers, buildDefaultConfig(gameModule));
}

function playersFor(match: TournamentMatch, roster: Player[]): Player[] {
  return roster.filter((p) => p.id === match.playerA || p.id === match.playerB);
}

export function platformReducer(state: PlatformState, action: PlatformAction): PlatformState {
  switch (action.type) {
    case "PLATFORM_START_GAME": {
      const gameModule = AVAILABLE_GAMES[action.gameId];
      if (!gameModule) return state; // Invalid game

      return {
        ...state,
        status: "PLAYING",
        activeGameId: action.gameId,
        gameState: startMatch(gameModule, action.players),
        tournament: null,
      };
    }

    case "PLATFORM_START_TOURNAMENT": {
      const gameModule = AVAILABLE_GAMES[action.gameId];
      if (!gameModule || !gameModule.getWinner) return state; // this game can't report a winner
      if (action.shuffledPlayers.length < 3) return state; // a 1-match "bracket" is degenerate

      const round1 = buildFirstRound(action.shuffledPlayers.map((p) => p.id));
      const firstMatch = nextPlayableMatch(round1);
      const tournament: TournamentState = { gameId: action.gameId, rounds: [round1], champion: null };

      if (!firstMatch) {
        // Every round-1 "match" was a bye — can't happen with >=3 real
        // entrants, but handled rather than assumed impossible.
        return {
          ...state,
          status: "TOURNAMENT_COMPLETE",
          activeGameId: null,
          gameState: null,
          tournament: { ...tournament, champion: round1[0]?.winner ?? null },
        };
      }

      return {
        ...state,
        status: "PLAYING",
        activeGameId: action.gameId,
        gameState: startMatch(gameModule, playersFor(firstMatch, action.shuffledPlayers)),
        tournament,
      };
    }

    case "PLATFORM_ADVANCE_TOURNAMENT": {
      if (!state.tournament || state.status !== "PLAYING") return state;
      const gameModule = AVAILABLE_GAMES[state.tournament.gameId];
      if (!gameModule) return state;

      const currentRound = state.tournament.rounds[state.tournament.rounds.length - 1];
      if (!currentRound.some((m) => m.winner === null)) return state; // nothing pending — stale/duplicate dispatch

      // The actual bracket bookkeeping is a pure helper in `tournament.ts`
      // (kept free of any `GameModule` dependency so it's unit-testable —
      // see that file's docstring for why this reducer case itself isn't).
      const { rounds, champion, nextMatch } = advanceTournament(state.tournament.rounds, action.winnerId);

      if (!nextMatch) {
        return {
          ...state,
          status: "TOURNAMENT_COMPLETE",
          activeGameId: null,
          gameState: null,
          tournament: { ...state.tournament, rounds, champion },
        };
      }

      return {
        ...state,
        gameState: startMatch(gameModule, playersFor(nextMatch, action.players)),
        tournament: { ...state.tournament, rounds },
      };
    }

    case "PLATFORM_RETURN_LOBBY": {
      return {
        ...state,
        status: "LOBBY",
        activeGameId: null,
        gameState: null,
        tournament: null,
      };
    }

    case "GAME_ACTION": {
      if (state.status !== "PLAYING" || !state.activeGameId) return state;

      const gameModule = AVAILABLE_GAMES[state.activeGameId];
      if (!gameModule) return state;

      // Delegate the action to the specific game's reducer
      const nextGameState = gameModule.reducer(state.gameState, action.action);

      return {
        ...state,
        gameState: nextGameState,
      };
    }

    default:
      return state;
  }
}

/** The active game's decisive winner(s) for the current match, or `null` if
 * the game doesn't implement `getWinner` or the match isn't decided yet.
 * Used both to drive `MatchResolvedModal` (any game, tournament or not) and,
 * within a tournament, to know who to advance once the host confirms —
 * founder feedback (2026-07-28) removed the previous auto-advance-on-
 * detection behavior here, since it left no time to see the final board. */
export function getActiveMatchWinners(platformState: PlatformState): string[] | null {
  if (platformState.status !== "PLAYING" || !platformState.activeGameId) return null;
  const gameModule = AVAILABLE_GAMES[platformState.activeGameId];
  return gameModule?.getWinner?.(platformState.gameState) ?? null;
}
