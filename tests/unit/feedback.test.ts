import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  HAPTICS,
  SOUNDS,
  isFeedbackEnabled,
  playCue,
  resetFeedbackCacheForTests,
  setFeedbackEnabled,
  subscribeFeedback,
  type FeedbackCue,
} from "@/lib/feedback";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe("feedback settings", () => {
  beforeEach(() => {
    globalThis.localStorage = createMemoryStorage();
    resetFeedbackCacheForTests();
  });

  it("starts off on a first visit", () => {
    expect(isFeedbackEnabled()).toBe(false);
  });

  it("remembers the switch on this device", () => {
    setFeedbackEnabled(true);
    resetFeedbackCacheForTests();
    expect(isFeedbackEnabled()).toBe(true);
    setFeedbackEnabled(false);
    resetFeedbackCacheForTests();
    expect(isFeedbackEnabled()).toBe(false);
  });

  it("notifies subscribers so every toggle on screen stays in sync", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeFeedback(listener);
    setFeedbackEnabled(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    setFeedbackEnabled(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("survives storage being unavailable", () => {
    globalThis.localStorage = {
      ...createMemoryStorage(),
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    resetFeedbackCacheForTests();
    expect(isFeedbackEnabled()).toBe(false);
    expect(() => setFeedbackEnabled(true)).not.toThrow();
    expect(isFeedbackEnabled()).toBe(true);
  });
});

describe("playCue", () => {
  beforeEach(() => {
    globalThis.localStorage = createMemoryStorage();
    resetFeedbackCacheForTests();
  });

  it("does nothing while feedback is off", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    playCue("win");
    expect(vibrate).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("vibrates with the cue's pattern when on, and never throws without Web Audio", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    setFeedbackEnabled(true);
    expect(() => playCue("hit")).not.toThrow();
    expect(vibrate).toHaveBeenCalledWith(HAPTICS.hit);
    vi.unstubAllGlobals();
  });

  it("has a sound for every cue, each short enough to feel like a toy, not music", () => {
    for (const [cue, notes] of Object.entries(SOUNDS) as [FeedbackCue, (typeof SOUNDS)[FeedbackCue]][]) {
      expect(notes.length, cue).toBeGreaterThan(0);
      const total = Math.max(...notes.map((n) => (n.delay ?? 0) + n.ms));
      expect(total, cue).toBeLessThanOrEqual(800);
    }
  });
});
