import {
  battleshipReducer,
  answerPendingShot,
  createInitialState,
  type BattleshipState,
  type BattleshipAction,
  type BattleshipPrivate,
} from "./reducer";
import { PlayerView } from "./views/Player";
import type { Player, GameModule } from "@/lib/types/room";

export interface BattleshipConfig {
  boardSize: "8" | "10";
}

const DEFAULT_CONFIG: BattleshipConfig = {
  boardSize: "8",
};

export const battleshipGameModule: GameModule<BattleshipConfig, BattleshipState, BattleshipAction, BattleshipPrivate> = {
  id: "battleship",
  meta: {
    name: "games.battleship.name",
    minPlayers: 2,
    maxPlayers: 2, // M4c (teams) will raise this once >1 player per side is supported
    supportedModes: ["multi-device"], // no single-device: a pass-and-play phone can't hide a board between turns
  },
  configSchema: {
    boardSize: {
      type: "select",
      labelKey: "games.battleship.config.boardSize",
      options: [
        { value: "8", labelKey: "games.battleship.config.boardSize8" },
        { value: "10", labelKey: "games.battleship.config.boardSize10" },
      ],
      default: DEFAULT_CONFIG.boardSize,
    },
  },

  setup: (players: Player[], config: BattleshipConfig): BattleshipState =>
    createInitialState(
      players.map((p) => p.id),
      Number(config.boardSize)
    ),

  reducer: battleshipReducer,

  setupPrivate: (): BattleshipPrivate => ({ fleet: [] }),

  answerPending: answerPendingShot,

  views: {
    host: PlayerView,
    player: PlayerView,
    // Deliberately no singleDevice — see meta.supportedModes above.
  },
};
