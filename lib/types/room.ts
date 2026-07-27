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

/** Updater for a device's private slice — same shape as React's setState so
 * `setPrivateState((prev) => ...)` works for updates that depend on the
 * current value (e.g. adding one more placed ship to a fleet in progress). */
export type PrivateStateUpdater<TPrivate> = (value: TPrivate | ((prev: TPrivate) => TPrivate)) => void;

/** ADR-0002 §3 — the contract every game implements identically so the
 * platform can treat them uniformly.
 *
 * `TPrivate` (ADR-0005) is a device-local slice that never enters `TState`
 * and therefore never broadcasts — e.g. a Battleship player's own fleet
 * layout. It defaults to `never` so games with no private state (Impostor,
 * Who Am I) and the type-erased `AnyGameModule` registry are unaffected. */
export interface GameModule<TConfig, TState, TAction, TPrivate = never> {
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

  /** ADR-0005 §2: produces this device's initial private slice. Runs
   * locally on each device, for its own player only — never broadcast.
   * Takes `state`, not `config`: the platform never stores a started
   * match's config separately from the `TState` `setup()` produced from it,
   * so any config-derived value a private slice needs (e.g. board size)
   * must already be a field on `state`, the same way every existing game's
   * `setup(players, config)` already bakes config into its `TState`. */
  setupPrivate?: (playerId: string, state: TState) => TPrivate;

  /** ADR-0005 §2/§3: when the shared state is waiting on information only
   * this device holds (a "pending" marker), returns the action that answers
   * it — or `null` if this device isn't the one being asked. Pure: the
   * private data arrives as an explicit argument, not read ambiently, so
   * this stays unit-testable with no I/O (CONVENTIONS.md §Game logic). */
  answerPending?: (state: TState, privateState: TPrivate, playerId: string) => TAction | null;

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
      privateState?: TPrivate;
      setPrivateState?: PrivateStateUpdater<TPrivate>;
    }>;
    player: ComponentType<{
      state: TState;
      players: Player[];
      playerId: string;
      roomCode: string;
      dispatch: (action: TAction) => void;
      privateState?: TPrivate;
      setPrivateState?: PrivateStateUpdater<TPrivate>;
    }>;
    /** Optional: a pass-and-play flow has no way to hide state between
     * turns, so a game whose hidden information *is* the game (Battleship)
     * legitimately supports no single-device mode at all. Games that do
     * support it (per `meta.supportedModes`) must still provide this. */
    singleDevice?: ComponentType<{
      state: TState;
      players: Player[];
      dispatch: (action: TAction) => void;
      onExit?: () => void;
    }>;
  };
}

/** Type-erased view of a GameModule for heterogeneous registries
 * (e.g. AVAILABLE_GAMES) where each game has its own TConfig/TState/TAction/TPrivate. */
export type AnyGameModule = GameModule<unknown, unknown, unknown, unknown>;
