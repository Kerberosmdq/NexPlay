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
};

/**
 * `events.user_id` is a `uuid references auth.users(id)` — the durable
 * anonymous-auth identity (ADR-0001 §4), which is NOT the same as a room's
 * ephemeral Realtime presence id (e.g. "host-ab12cd"). Callers must never
 * pass a presence id here; this resolves the real one from the current
 * Supabase session, or omits the field if no session exists yet.
 */
async function resolveAuthUserId(
  supabase: ReturnType<typeof getSupabaseBrowserClient>
): Promise<string | undefined> {
  if (!supabase) return undefined;
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

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

  const user_id = await resolveAuthUserId(supabase);
  const { error } = await supabase.from("events").insert({ ...event, user_id });

  if (error) {
    console.error("Failed to record event:", error);
  }
}
