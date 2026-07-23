"use client";

import { useEffect } from "react";
import { ensureAnonymousSession, getSupabaseBrowserClient } from "@/lib/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const client = getSupabaseBrowserClient();
      if (client) {
        ensureAnonymousSession(client).catch((err) => {
          console.warn("Anonymous auth initialization failed:", err);
        });
      }
    } catch (err) {
      console.warn("AuthProvider initialized without Supabase client:", err);
    }
  }, []);

  return <>{children}</>;
}
