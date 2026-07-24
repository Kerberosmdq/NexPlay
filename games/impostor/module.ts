import { impostorReducer } from "./reducer";
import { PlayerView } from "./views/Player";
import { SingleDeviceView } from "./views/SingleDevice";
import { impostorContent } from "./content";
import type { HintDifficulty } from "./content";
import type { Player, GameModule } from "@/lib/types/room";
import type { ImpostorState, ImpostorAction } from "./reducer";

export interface ImpostorConfig {
  impostorCount: number;
  votingTimeSeconds: number;
  hintDifficulty: HintDifficulty;
}

const DEFAULT_CONFIG: ImpostorConfig = {
  impostorCount: 1,
  votingTimeSeconds: 15,
  hintDifficulty: "easy",
};

export const impostorGameModule: GameModule<ImpostorConfig, ImpostorState, ImpostorAction> = {
  id: "impostor",
  meta: {
    name: "games.impostor.name",
    minPlayers: 3,
    maxPlayers: 12,
    supportedModes: ["single-device", "multi-device"],
  },
  configSchema: {
    impostorCount: {
      type: "number",
      labelKey: "games.impostor.config.impostorCount",
      min: 1,
      max: 3,
      default: DEFAULT_CONFIG.impostorCount,
    },
    votingTimeSeconds: {
      type: "number",
      labelKey: "games.impostor.config.votingTimeSeconds",
      min: 0,
      max: 120,
      default: DEFAULT_CONFIG.votingTimeSeconds,
    },
    hintDifficulty: {
      type: "select",
      labelKey: "games.impostor.config.hintDifficulty",
      options: [
        { value: "none", labelKey: "games.impostor.config.hintNone" },
        { value: "hard", labelKey: "games.impostor.config.hintHard" },
        { value: "easy", labelKey: "games.impostor.config.hintEasy" },
      ],
      default: DEFAULT_CONFIG.hintDifficulty,
    },
  },
  content: impostorContent,

  setup: (players: Player[], config: ImpostorConfig): ImpostorState => ({
    phase: "config",
    impostorCount: config.impostorCount,
    votingTimeSeconds: config.votingTimeSeconds,
    hintDifficulty: config.hintDifficulty,
    secretWord: null,
    impostorIds: [],
    playerIds: players.map((p) => p.id),
    aliveIds: [],
    turnOrder: [],
    turnIndex: 0,
    votes: {},
    lastElimination: null,
    scores: {},
    lastRoundResult: null,
  }),

  reducer: impostorReducer,

  views: {
    host: PlayerView,
    player: PlayerView,
    singleDevice: SingleDeviceView,
  },
};

// `host` and `player` intentionally point at the same component: the host
// is also a player and sees the same phase-driven screen as everyone else,
// with host-only controls rendered inline (see PlayerView's `isHost`
// checks). Unlike the placeholder game, Impostor has no host-exclusive
// screen, so a separate Host.tsx would just re-export this one.
