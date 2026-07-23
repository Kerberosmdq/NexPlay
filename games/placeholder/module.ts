import { initialPlaceholderState, placeholderReducer } from "./reducer";
import type { PlaceholderState } from "./reducer";
import type { Player } from "@/lib/types/room";

export interface PlaceholderConfig {
  initialCount?: number;
}

export const placeholderGameModule = {
  id: "placeholder",
  meta: {
    name: "game.placeholder.name",
    minPlayers: 1,
    maxPlayers: 10,
    supportedModes: ["single-device", "multi-device"] as const,
  },
  setup(players: Player[], config?: PlaceholderConfig): PlaceholderState {
    return {
      ...initialPlaceholderState,
      count: config?.initialCount ?? 0,
    };
  },
  reducer: placeholderReducer,
};
