"use client";

import { useEffect } from "react";
import { ensureAnonymousSession, getSupabaseBrowserClient } from "@/lib/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    ensureAnonymousSession(client);
  }, []);

  return <>{children}</>;
}
