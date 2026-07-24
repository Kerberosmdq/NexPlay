import { whoAmIReducer } from "./reducer";
import { PlayerView } from "./views/Player";
import { SingleDeviceView } from "./views/SingleDevice";
import { whoAmIContent } from "./content";
import type { Player, GameModule } from "@/lib/types/room";
import type { WhoAmIState, WhoAmIAction } from "./reducer";

export interface WhoAmIConfig {
  timerSeconds: number;
}

const DEFAULT_CONFIG: WhoAmIConfig = {
  timerSeconds: 300,
};

export const whoAmIGameModule: GameModule<WhoAmIConfig, WhoAmIState, WhoAmIAction> = {
  id: "who-am-i",
  meta: {
    name: "games.whoAmI.name",
    minPlayers: 3,
    maxPlayers: 12,
    supportedModes: ["single-device", "multi-device"],
  },
  configSchema: {
    timerSeconds: {
      type: "select",
      labelKey: "games.whoAmI.config.timerSeconds",
      options: [
        { value: "180", labelKey: "games.whoAmI.config.time3min" },
        { value: "300", labelKey: "games.whoAmI.config.time5min" },
        { value: "420", labelKey: "games.whoAmI.config.time7min" },
        { value: "600", labelKey: "games.whoAmI.config.time10min" },
        { value: "0", labelKey: "games.whoAmI.config.timeUnlimited" },
      ],
      default: String(DEFAULT_CONFIG.timerSeconds),
    },
  },
  content: whoAmIContent,

  setup: (players: Player[], config: WhoAmIConfig): WhoAmIState => ({
    phase: "config",
    timerSeconds: config.timerSeconds,
    playerIds: players.map((p) => p.id),
    usedWordIds: [],
    wordAssignments: {},
    turnOrder: [],
    turnIndex: 0,
    guessedIds: [],
    roundEndsAt: null,
    scores: {},
  }),

  reducer: whoAmIReducer,

  // `host` and `player` intentionally point at the same component, same as
  // Impostor: the host is also a player and sees the same phase-driven
  // screen as everyone else, with host-only controls (ending the round
  // early) rendered inline.
  views: {
    host: PlayerView,
    player: PlayerView,
    singleDevice: SingleDeviceView,
  },
};
