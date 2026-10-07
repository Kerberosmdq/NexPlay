"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(orientation: landscape)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** Whether the screen is wider than tall right now (a phone turned on its
 * side, or a desktop window). Battleship uses it to switch between its
 * portrait radar layout and its side-by-side console layout (TASK-0048).
 * Portrait on the server: phones are what the app is designed for. */
export function useIsLandscape(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(QUERY).matches : false),
    () => false
  );
}

/** Asks the browser to go fullscreen and lock the screen in landscape —
 * supported by Android browsers; iOS Safari can't lock orientation from a
 * web page. Resolves `true` if the lock took, `false` otherwise, so the
 * caller can fall back to asking the player to turn the phone. */
export async function requestLandscape(): Promise<boolean> {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    if (!orientation?.lock) return false;
    await orientation.lock("landscape");
    return true;
  } catch {
    return false;
  }
}
