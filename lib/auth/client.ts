import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  // .trim() guards against a trailing newline/whitespace in the env var
  // value itself (e.g. pasted from a terminal into Vercel's dashboard) —
  // that alone was enough to corrupt the `apikey` query param on the
  // Realtime websocket URL and make every connection fail silently
  // (CHANNEL_ERROR / transport failure) while REST/Auth calls, which don't
  // put the key in a URL the same way, kept working fine.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (typeof window === "undefined") {
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
