"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isFeedbackEnabled, playCue, subscribeFeedback, type FeedbackCue } from "./index";

/** Whether sound + vibration are on, kept in sync across every toggle on
 * screen. Renders as off on the server (the setting lives in localStorage). */
export function useFeedbackEnabled(): boolean {
  return useSyncExternalStore(subscribeFeedback, isFeedbackEnabled, () => false);
}

/** Plays a cue once, when the component first appears — for results and
 * reveals that arrive as a new screen rather than from a tap. */
export function useCueOnMount(cue: FeedbackCue | null): void {
  useEffect(() => {
    if (cue) playCue(cue);
    // Mount-only on purpose: a re-render must not replay the fanfare.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
