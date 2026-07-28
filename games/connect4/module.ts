import { connect4Reducer, createInitialState, type Connect4State, type Connect4Action } from "./reducer";
import { PlayerView } from "./views/Player";
import { SingleDeviceView } from "./views/SingleDevice";
import type { Player, GameModule } from "@/lib/types/room";

// No host-facing options — the board is fixed at the canonical 7x6 size
// (docs/09_ai/tasks/TASK-0037-connect4.md); a different size arguably makes
// it a different game, not a config variant.
export type Connect4Config = Record<string, never>;

export const connect4GameModule: GameModule<Connect4Config, Connect4State, Connect4Action> = {
  id: "connect4",
  meta: {
    name: "games.connect4.name",
    // Strictly 1-vs-1 for this game — team play is an explicit non-goal.
    minPlayers: 2,
    maxPlayers: 2,
    // No hidden information at all, unlike every other multi-device-only
    // game so far — single-device is a genuinely trivial shared screen,
    // not a reveal-and-pass loop.
    supportedModes: ["single-device", "multi-device"],
  },
  configSchema: {},

  setup: (players: Player[]): Connect4State => createInitialState(players.map((p) => p.id)),

  reducer: connect4Reducer,

  // M4d: wrapped in an array to match the contract's `string[] | null`
  // shape, even though a side is always exactly one player id here.
  getWinner: (state) => (state.phase === "resolution" && state.winnerSide ? [state.sides[state.winnerSide]] : null),

  views: {
    host: PlayerView,
    player: PlayerView,
    singleDevice: SingleDeviceView,
  },
};
