import { impostorGameModule } from "@/games/impostor/module";
import { whoAmIGameModule } from "@/games/who-am-i/module";
import { placeholderGameModule } from "@/games/placeholder/module";
import type { AnyGameModule, GameModule, Player } from "@/lib/types/room";

/**
 * A heterogeneous registry (`AVAILABLE_GAMES`) necessarily erases each
 * game's concrete TConfig/TState/TAction to `unknown` — that's what
 * `AnyGameModule` is for. Assigning a concrete `GameModule<TConfig, ...>`
 * into that shape is a legitimate upcast (every concrete module really is
 * usable through the erased interface — the platform never fabricates a
 * config or state, it only ever passes back what it was given), so this one
 * cast is centralized here instead of scattered/unsafe at each call site.
 */
function toAnyGameModule<TConfig, TState, TAction>(
  mod: GameModule<TConfig, TState, TAction>
): AnyGameModule {
  return mod as unknown as AnyGameModule;
}

// Registry of all available games.
export const AVAILABLE_GAMES: Record<string, AnyGameModule> = {
  [impostorGameModule.id]: toAnyGameModule(impostorGameModule),
  [whoAmIGameModule.id]: toAnyGameModule(whoAmIGameModule),
  [placeholderGameModule.id]: toAnyGameModule(placeholderGameModule),
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

export type PlatformStatus = "LOBBY" | "PLAYING";

export interface PlatformState {
  status: PlatformStatus;
  activeGameId: string | null;
  gameState: unknown; // The state of the currently active game
}

export type PlatformAction =
  | { type: "PLATFORM_START_GAME"; gameId: string; players: Player[] }
  | { type: "PLATFORM_RETURN_LOBBY" }
  | { type: "GAME_ACTION"; action: unknown };

export function createInitialPlatformState(): PlatformState {
  return {
    status: "LOBBY",
    activeGameId: null,
    gameState: null,
  };
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
        gameState: gameModule.setup(action.players, buildDefaultConfig(gameModule)),
      };
    }

    case "PLATFORM_RETURN_LOBBY": {
      return {
        ...state,
        status: "LOBBY",
        activeGameId: null,
        gameState: null,
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
