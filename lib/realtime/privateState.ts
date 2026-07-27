"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PrivateStateUpdater } from "@/lib/types/room";

/** Exported so its format and the read/write round-trip below can be unit
 * tested directly — this project has no React-hook testing environment set
 * up (no jsdom/@testing-library/react dependency), so `usePrivateState`
 * itself is verified live in-browser (per TASK-0031's manual verification
 * steps) rather than via `renderHook`; these plain-function pieces are what
 * the hook is built from and where the real risk of a bug lives. */
export function storageKeyFor(roomCode: string, gameId: string, playerId: string): string {
  return `nexplay:private:${roomCode}:${gameId}:${playerId}`;
}

export function readStored<TPrivate>(key: string): TPrivate | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as TPrivate) : undefined;
  } catch {
    // Corrupted storage, or unavailable entirely (SSR, private browsing) —
    // treat as empty, same as lib/realtime/session.ts's existing pattern.
    return undefined;
  }
}

/** ADR-0005: a device's private per-player slice — the mechanism, not just
 * the mention in the ADR. Lives in React state on this device only, never
 * folded into `PlatformState`/`TState`, so it can never be broadcast by
 * `useRoomConnection` (which only ever sees the shared state). Mirrored to
 * `localStorage` so a reload or reconnection on the *same* device doesn't
 * lose it — recovering on a genuinely different device is an explicit,
 * documented non-goal (ADR-0005 Consequences). */
export function usePrivateState<TPrivate>(
  roomCode: string,
  gameId: string,
  playerId: string,
  initialize: () => TPrivate
): [TPrivate, PrivateStateUpdater<TPrivate>] {
  const key = storageKeyFor(roomCode, gameId, playerId);
  const [value, setValue] = useState<TPrivate>(() => readStored<TPrivate>(key) ?? initialize());

  const keyRef = useRef(key);
  useEffect(() => {
    if (keyRef.current === key) return;
    keyRef.current = key;
    setValue(readStored<TPrivate>(key) ?? initialize());
    // `initialize` is intentionally not a dependency — it's expected to be
    // a fresh closure every render (it usually reads the latest shared
    // state/config), and re-running this effect on every such change would
    // defeat the point of only re-initializing when the room/game/player
    // identity actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setPrivateState = useCallback<PrivateStateUpdater<TPrivate>>(
    (updaterOrValue) => {
      setValue((prev) => {
        const next =
          typeof updaterOrValue === "function"
            ? (updaterOrValue as (p: TPrivate) => TPrivate)(prev)
            : updaterOrValue;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Storage can be unavailable — the in-memory value still updates,
          // just without surviving a reload.
        }
        return next;
      });
    },
    [key]
  );

  return [value, setPrivateState];
}

/** ADR-0005 §2/§3: runs a game's `answerPending` against this device's
 * private slice whenever the shared state changes, dispatching the result
 * exactly once per distinct pending request — a broadcast echo or an
 * unrelated re-render must not fire it twice. */
export function useAnswerPending<TState, TAction, TPrivate>(
  state: TState,
  privateState: TPrivate,
  playerId: string,
  answerPending: ((state: TState, privateState: TPrivate, playerId: string) => TAction | null) | undefined,
  dispatch: (action: TAction) => void
): void {
  const lastAnsweredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!answerPending) return;
    // Before this device's private slice has been initialized (e.g. the
    // instant a match starts, before `usePrivateState`'s key-change effect
    // has caught up), there is nothing meaningful to answer with yet — not
    // the same as "not my board to answer for" (which is a real `null`),
    // so skip silently rather than let a game's `answerPending` dereference
    // an undefined private slice.
    if (privateState === undefined) return;
    const action = answerPending(state, privateState, playerId);
    if (action === null) {
      lastAnsweredRef.current = null;
      return;
    }
    const signature = JSON.stringify(action);
    if (signature === lastAnsweredRef.current) return;
    lastAnsweredRef.current = signature;
    dispatch(action);
    // dispatch identity isn't guaranteed stable across renders (it's a
    // closure recreated per MultiDeviceRoom render) — depending on it would
    // re-run this effect far more often than the state it actually cares
    // about, without changing its outcome.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, privateState, playerId, answerPending]);
}
