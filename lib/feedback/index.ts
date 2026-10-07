/**
 * Sound + haptic feedback (M6.5 phase 3, BDR-0002 §10): the plastic-toy
 * clicks, clacks and fanfares, and a short vibration on Android.
 *
 * Every sound is synthesized with the Web Audio API — no audio files to
 * download, license or keep in sync with the look. Vibration uses
 * `navigator.vibrate`, which Android browsers support and iOS Safari
 * ignores (there is no web haptics API on iPhone).
 *
 * One switch controls both, stored on this device only. It starts **off**
 * on a first visit: a family app that suddenly beeps in a waiting room is
 * worse than one you have to turn up.
 */

export type FeedbackCue =
  | "press" // any button
  | "select" // choosing a key in a row of options
  | "pop" // the secret capsule opening, a neutral reveal
  | "drop" // a disc landing
  | "flip" // a card turned down or up
  | "correct"
  | "wrong"
  | "hit"
  | "miss"
  | "sunk"
  | "win"
  | "lose"
  | "tick"; // the last seconds of a clock

const STORAGE_KEY = "nexplay:feedback:v1";

// ---------------------------------------------------------------- settings

type Listener = () => void;
const listeners = new Set<Listener>();
let enabledCache: boolean | null = null;

/** Whether sound + vibration are on. Defaults to off. */
export function isFeedbackEnabled(): boolean {
  if (enabledCache !== null) return enabledCache;
  try {
    enabledCache = localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    enabledCache = false;
  }
  return enabledCache;
}

export function setFeedbackEnabled(enabled: boolean): void {
  enabledCache = enabled;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Storage can be unavailable; the switch still works for this visit.
  }
  listeners.forEach((listener) => listener());
}

/** For `useSyncExternalStore`. */
export function subscribeFeedback(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test seam: forget the cached setting so the next read hits storage. */
export function resetFeedbackCacheForTests(): void {
  enabledCache = null;
}

// ---------------------------------------------------------------- haptics

/** Vibration patterns, in ms (vibrate, pause, vibrate…). Short on purpose:
 * a buzz per tap should feel like a click, not an alarm. */
export const HAPTICS: Partial<Record<FeedbackCue, number | number[]>> = {
  press: 8,
  select: 8,
  pop: 15,
  drop: 18,
  flip: 10,
  correct: [15, 40, 15],
  wrong: 60,
  hit: [30, 40, 30],
  sunk: [40, 50, 40, 50, 80],
  win: [20, 60, 20, 60, 40],
  lose: 120,
};

// ------------------------------------------------------------------- sound

type Note = {
  /** Oscillator shape, or "noise" for a short burst of white noise. */
  wave: OscillatorType | "noise";
  from: number; // Hz at the start (ignored for noise)
  to?: number; // Hz at the end (a quick slide makes it sound plastic)
  ms: number;
  delay?: number; // ms after the cue starts
  gain?: number; // 0–1, before the master volume
};

export const SOUNDS: Record<FeedbackCue, Note[]> = {
  press: [{ wave: "triangle", from: 620, to: 320, ms: 35, gain: 0.35 }],
  select: [{ wave: "triangle", from: 520, to: 760, ms: 55, gain: 0.35 }],
  pop: [
    { wave: "sine", from: 300, to: 980, ms: 110, gain: 0.5 },
    { wave: "noise", from: 0, ms: 25, gain: 0.08 },
  ],
  drop: [
    { wave: "triangle", from: 520, to: 160, ms: 110, gain: 0.5 },
    { wave: "triangle", from: 300, to: 140, ms: 60, delay: 130, gain: 0.3 },
    { wave: "triangle", from: 220, to: 130, ms: 40, delay: 210, gain: 0.15 },
  ],
  flip: [{ wave: "square", from: 900, to: 480, ms: 55, gain: 0.12 }],
  correct: [
    { wave: "triangle", from: 660, ms: 90, gain: 0.45 },
    { wave: "triangle", from: 880, ms: 140, delay: 95, gain: 0.45 },
  ],
  wrong: [{ wave: "sawtooth", from: 220, to: 140, ms: 220, gain: 0.18 }],
  hit: [
    { wave: "noise", from: 0, ms: 140, gain: 0.35 },
    { wave: "sine", from: 140, to: 55, ms: 220, gain: 0.6 },
  ],
  miss: [{ wave: "sine", from: 900, to: 260, ms: 240, gain: 0.35 }],
  sunk: [
    { wave: "noise", from: 0, ms: 200, gain: 0.35 },
    { wave: "sawtooth", from: 420, to: 70, ms: 600, gain: 0.25 },
  ],
  win: [
    { wave: "triangle", from: 523, ms: 90, gain: 0.45 },
    { wave: "triangle", from: 659, ms: 90, delay: 95, gain: 0.45 },
    { wave: "triangle", from: 784, ms: 90, delay: 190, gain: 0.45 },
    { wave: "triangle", from: 1047, ms: 260, delay: 285, gain: 0.5 },
  ],
  lose: [
    { wave: "triangle", from: 392, ms: 150, gain: 0.4 },
    { wave: "triangle", from: 330, ms: 150, delay: 160, gain: 0.4 },
    { wave: "triangle", from: 262, ms: 320, delay: 320, gain: 0.4 },
  ],
  tick: [{ wave: "square", from: 1200, ms: 25, gain: 0.1 }],
};

const MASTER_VOLUME = 0.5;
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (audioContext) return audioContext;
  const Ctor =
    typeof window !== "undefined"
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;
  if (!Ctor) return null;
  try {
    audioContext = new Ctor();
  } catch {
    return null;
  }
  return audioContext;
}

function playNote(ctx: AudioContext, note: Note): void {
  const start = ctx.currentTime + (note.delay ?? 0) / 1000;
  const end = start + note.ms / 1000;
  const gain = ctx.createGain();
  const peak = (note.gain ?? 0.4) * MASTER_VOLUME;
  // A fast attack and an exponential decay: the "clack" of a hard plastic
  // piece rather than a held tone.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  gain.connect(ctx.destination);

  if (note.wave === "noise") {
    const length = Math.max(1, Math.floor(ctx.sampleRate * (note.ms / 1000)));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start(start);
    source.stop(end);
    return;
  }

  const osc = ctx.createOscillator();
  osc.type = note.wave;
  osc.frequency.setValueAtTime(note.from, start);
  if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, end);
  osc.connect(gain);
  osc.start(start);
  osc.stop(end + 0.02);
}

/** Plays a cue's sound and vibration, if feedback is on. Safe to call
 * anywhere: without Web Audio or `navigator.vibrate` (a server render, an
 * old browser, iOS for vibration) it quietly does nothing. Browsers only
 * start audio after a user gesture; cues fired from a tap unlock it. */
export function playCue(cue: FeedbackCue): void {
  if (!isFeedbackEnabled()) return;

  const pattern = HAPTICS[cue];
  if (pattern !== undefined && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Some browsers throw when vibration isn't allowed right now.
    }
  }

  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  for (const note of SOUNDS[cue]) {
    try {
      playNote(ctx, note);
    } catch {
      // A failed note must never break the game.
    }
  }
}
