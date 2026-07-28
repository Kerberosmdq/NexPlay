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
    // M4c: 2 is still 1-vs-1 (unchanged), 4 is fixed 2-vs-2 teams. 3 (or 5+)
    // isn't supported — the reducer's own `createInitialState` only knows
    // how to build either shape; the "teamSetup" view shows a friendly
    // message rather than a broken assignment screen for any other count.
    maxPlayers: 4,
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

  // M4d: the platform's tournament orchestration reads this to know when
  // to advance the bracket, without knowing Battleship's own state shape.
  getWinner: (state) => (state.phase === "resolution" && state.winner ? state.sides[state.winner] : null),

  views: {
    host: PlayerView,
    player: PlayerView,
    // Deliberately no singleDevice — see meta.supportedModes above.
  },
};
