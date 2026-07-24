import type { ComponentType } from "react";

export interface Player {
  id: string;
  displayName: string;
  isHost: boolean;
  joinedAt: number;
  isOnline: boolean;
}

export interface RoomState {
  code: string;
  hostUserId: string;
  players: Player[];
  createdAt: number;
}

export interface PresencePayload {
  userId: string;
  displayName: string;
  joinedAt: number;
}

export type DeviceMode = "single-device" | "multi-device";

/** A single host-facing config option, described so a view can render a
 * generic control for it without the platform knowing the game's specifics. */
export type ConfigFieldSchema =
  | {
      type: "number";
      labelKey: string;
      min: number;
      max: number;
      step?: number;
      default: number;
    }
  | {
      type: "select";
      labelKey: string;
      options: Array<{ value: string; labelKey: string }>;
      default: string;
    };

/** ADR-0002 §3: host-facing options, typed + validated. One schema entry per
 * key of the game's config object. */
export type ConfigSchema<TConfig> = {
  [K in keyof TConfig]: ConfigFieldSchema;
};

/** ADR-0002 §5: game content (categories/words/prompts) ships as versioned,
 * localized data — never hardcoded in a view or reducer. */
export interface LocalizedContentPack<TItem> {
  locale: Record<"en" | "es", TItem[]>;
}

/** ADR-0002 §3 — the contract every game implements identically so the
 * platform can treat them uniformly. */
export interface GameModule<TConfig, TState, TAction> {
  id: string;
  meta: {
    /** i18n key (e.g. "games.impostor.name"), not raw display text. */
    name: string;
    minPlayers: number;
    maxPlayers: number;
    supportedModes: DeviceMode[];
  };
  configSchema: ConfigSchema<TConfig>;
  content?: LocalizedContentPack<unknown>;
  setup: (players: Player[], config: TConfig) => TState;
  reducer: (state: TState, action: TAction) => TState;
  views: {
    host: ComponentType<{
      state: TState;
      players: Player[];
      roomCode: string;
      dispatch: (action: TAction) => void;
      // The platform always knows the host's own userId (it's connected
      // like any other player) and passes it through even though a "host"
      // conceptually isn't required to be a player. Optional here so games
      // that don't need it aren't forced to destructure it.
      playerId?: string;
    }>;
    player: ComponentType<{
      state: TState;
      players: Player[];
      playerId: string;
      roomCode: string;
      dispatch: (action: TAction) => void;
    }>;
    singleDevice: ComponentType<{
      state: TState;
      players: Player[];
      dispatch: (action: TAction) => void;
      onExit?: () => void;
    }>;
  };
}

/** Type-erased view of a GameModule for heterogeneous registries
 * (e.g. AVAILABLE_GAMES) where each game has its own TConfig/TState/TAction. */
export type AnyGameModule = GameModule<unknown, unknown, unknown>;
