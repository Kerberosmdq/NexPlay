import type { Session, SupabaseClient } from "@supabase/supabase-js";

export interface AnonymousSessionResult {
  session: Session | null;
  createdNew: boolean;
  error: Error | null;
}

/**
 * Ensures the device holds a stable, durable anonymous Supabase session.
 *
 * 1. Reuses an existing active session if present.
 * 2. Signs in anonymously if no session exists.
 * 3. Records a row in `public.users` table for new sessions per ADR-0001 / ADR-0003.
 */
export async function ensureAnonymousSession(
  client: SupabaseClient | null
): Promise<AnonymousSessionResult> {
  if (!client) {
    return {
      session: null,
      createdNew: false,
      error: new Error("Supabase client not initialized (missing environment variables)."),
    };
  }

  try {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();

    if (sessionError) {
      return { session: null, createdNew: false, error: sessionError };
    }

    if (sessionData.session?.user) {
      return {
        session: sessionData.session,
        createdNew: false,
        error: null,
      };
    }

    const { data: signInData, error: signInError } = await client.auth.signInAnonymously();

    if (signInError) {
      return { session: null, createdNew: false, error: signInError };
    }

    const session = signInData.session;
    if (session?.user) {
      const { error: insertError } = await client
        .from("users")
        .insert({ id: session.user.id });

      // Code 23505 is unique violation (user row already exists); safe to ignore if re-inserted.
      if (insertError && insertError.code !== "23505") {
        console.warn("Could not insert user row into public.users:", insertError.message);
      }
    }

    return {
      session,
      createdNew: true,
      error: null,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { session: null, createdNew: false, error };
  }
}
