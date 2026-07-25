"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the screen from locking/dimming while `enabled` is true (Screen
 * Wake Lock API). A family playing a party game with the phone passed
 * around shouldn't have to fight their own lock-screen timeout mid-round.
 *
 * Silently no-ops on browsers without support (older iOS Safari, some
 * WebViews) — this is a nicety, never a requirement, so it must never
 * throw or block rendering. The OS releases the lock whenever the tab is
 * hidden (backgrounded, screen off), so this re-acquires it automatically
 * once the tab becomes visible again.
 */
export function useWakeLock(enabled: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        lockRef.current = lock;
      } catch {
        // Permission denied, battery saver, unsupported context, etc. —
        // fail silently rather than surface an error for a convenience
        // feature the user never explicitly requested.
      }
    };

    acquire();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !lockRef.current) {
        acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [enabled]);
}
