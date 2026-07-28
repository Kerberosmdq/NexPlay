import {
  guessWhoReducer,
  answerPendingGuess,
  createInitialState,
  type GuessWhoState,
  type GuessWhoAction,
  type GuessWhoPrivate,
} from "./reducer";
import { PlayerView } from "./views/Player";
import { SingleDeviceView } from "./views/SingleDevice";
import type { Player, GameModule } from "@/lib/types/room";

// No host-facing options — the 32-character roster is fixed content
// (docs/09_ai/tasks/TASK-0038-guess-who.md).
export type GuessWhoConfig = Record<string, never>;

export const guessWhoGameModule: GameModule<GuessWhoConfig, GuessWhoState, GuessWhoAction, GuessWhoPrivate> = {
  id: "guess-who",
  meta: {
    name: "games.guess-who.name",
    // Strictly 1-vs-1 — team play is an explicit non-goal.
    minPlayers: 2,
    maxPlayers: 2,
    supportedModes: ["single-device", "multi-device"],
  },
  configSchema: {},

  setup: (players: Player[]): GuessWhoState => createInitialState(players.map((p) => p.id)),

  reducer: guessWhoReducer,

  setupPrivate: (): GuessWhoPrivate => ({ myCharacterId: null }),

  answerPending: answerPendingGuess,

  // M4d: wrapped in an array to match the contract's `string[] | null`
  // shape, even though a side is always exactly one player id here.
  getWinner: (state) => (state.phase === "resolution" && state.winnerSide ? [state.sides[state.winnerSide]] : null),

  views: {
    host: PlayerView,
    player: PlayerView,
    singleDevice: SingleDeviceView,
  },
};
