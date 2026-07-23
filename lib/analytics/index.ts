import { getSupabaseBrowserClient } from "@/lib/auth/client";

export type GameResultInsert = {
  game_id: string;
  mode: "single-device" | "multi-device";
  player_count: number;
  duration_seconds: number;
  outcome?: string;
};

export type EventInsert = {
  event_name: "room_created" | "game_started" | "game_finished";
  game_id?: string;
  mode?: "single-device" | "multi-device";
  player_count?: number;
  user_id?: string;
};

/**
 * Records a durable game result summary to Postgres per ADR-0001 §3.
 */
export async function recordGameResult(result: GameResultInsert) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.from("game_results").insert(result);
  
  if (error) {
    console.error("Failed to record game result:", error);
  }
}

/**
 * Records an anonymous analytics event to Postgres per ADR-0001 §3.
 */
export async function recordEvent(event: EventInsert) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.from("events").insert(event);
  
  if (error) {
    console.error("Failed to record event:", error);
  }
}
