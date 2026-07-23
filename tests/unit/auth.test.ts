import { describe, expect, it, vi } from "vitest";
import { ensureAnonymousSession } from "@/lib/auth/session";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

function createMockSupabaseClient(options: {
  existingSession?: Session | null;
  signInSession?: Session | null;
  signInError?: Error | null;
  insertError?: { code: string; message: string } | null;
}) {
  const insertFn = vi.fn().mockResolvedValue({
    error: options.insertError ?? null,
  });

  const fromFn = vi.fn().mockReturnValue({
    insert: insertFn,
  });

  const getSessionFn = vi.fn().mockResolvedValue({
    data: { session: options.existingSession ?? null },
    error: null,
  });

  const signInAnonymouslyFn = vi.fn().mockResolvedValue({
    data: { session: options.signInSession ?? null },
    error: options.signInError ?? null,
  });

  const client = {
    auth: {
      getSession: getSessionFn,
      signInAnonymously: signInAnonymouslyFn,
    },
    from: fromFn,
  } as unknown as SupabaseClient;

  return { client, getSessionFn, signInAnonymouslyFn, fromFn, insertFn };
}

describe("ensureAnonymousSession", () => {
  it("reuses an existing active session without signing in again", async () => {
    const mockSession = {
      user: { id: "user-123" },
      access_token: "token-123",
    } as unknown as Session;

    const { client, getSessionFn, signInAnonymouslyFn, fromFn } = createMockSupabaseClient({
      existingSession: mockSession,
    });

    const result = await ensureAnonymousSession(client);

    expect(getSessionFn).toHaveBeenCalledTimes(1);
    expect(signInAnonymouslyFn).not.toHaveBeenCalled();
    expect(fromFn).not.toHaveBeenCalled();
    expect(result).toEqual({
      session: mockSession,
      createdNew: false,
      error: null,
    });
  });

  it("signs in anonymously and creates user row when no active session exists", async () => {
    const newSession = {
      user: { id: "user-new-789" },
      access_token: "token-new-789",
    } as unknown as Session;

    const { client, getSessionFn, signInAnonymouslyFn, fromFn, insertFn } = createMockSupabaseClient({
      existingSession: null,
      signInSession: newSession,
    });

    const result = await ensureAnonymousSession(client);

    expect(getSessionFn).toHaveBeenCalledTimes(1);
    expect(signInAnonymouslyFn).toHaveBeenCalledTimes(1);
    expect(fromFn).toHaveBeenCalledWith("users");
    expect(insertFn).toHaveBeenCalledWith({ id: "user-new-789" });
    expect(result).toEqual({
      session: newSession,
      createdNew: true,
      error: null,
    });
  });

  it("handles duplicate key insertion gracefully when user row already exists", async () => {
    const newSession = {
      user: { id: "user-existing-row" },
    } as unknown as Session;

    const { client, insertFn } = createMockSupabaseClient({
      existingSession: null,
      signInSession: newSession,
      insertError: { code: "23505", message: "duplicate key value violates unique constraint" },
    });

    const result = await ensureAnonymousSession(client);

    expect(insertFn).toHaveBeenCalledWith({ id: "user-existing-row" });
    expect(result.error).toBeNull();
    expect(result.createdNew).toBe(true);
  });

  it("returns error when signInAnonymously fails", async () => {
    const authError = new Error("Auth service unavailable");

    const { client, signInAnonymouslyFn, fromFn } = createMockSupabaseClient({
      existingSession: null,
      signInError: authError,
    });

    const result = await ensureAnonymousSession(client);

    expect(signInAnonymouslyFn).toHaveBeenCalledTimes(1);
    expect(fromFn).not.toHaveBeenCalled();
    expect(result.session).toBeNull();
    expect(result.createdNew).toBe(false);
    expect(result.error).toBe(authError);
  });
});
