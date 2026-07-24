import { initialPlaceholderState, placeholderReducer } from "./reducer";
import type { PlaceholderState, PlaceholderAction } from "./reducer";
import { HostView } from "./views/Host";
import { PlayerView } from "./views/Player";
import { SingleDeviceView } from "./views/SingleDevice";
import type { Player, GameModule } from "@/lib/types/room";

export interface PlaceholderConfig {
  initialCount: number;
}

export const placeholderGameModule: GameModule<
  PlaceholderConfig,
  PlaceholderState,
  PlaceholderAction
> = {
  id: "placeholder",
  meta: {
    name: "games.placeholder.name",
    minPlayers: 1,
    maxPlayers: 10,
    supportedModes: ["single-device", "multi-device"],
  },
  configSchema: {
    initialCount: {
      type: "number",
      labelKey: "games.placeholder.config.initialCount",
      min: 0,
      max: 100,
      default: 0,
    },
  },
  setup(players: Player[], config: PlaceholderConfig): PlaceholderState {
    return {
      ...initialPlaceholderState,
      count: config.initialCount,
    };
  },
  reducer: placeholderReducer,
  views: {
    host: HostView,
    player: PlayerView,
    singleDevice: SingleDeviceView,
  },
};
