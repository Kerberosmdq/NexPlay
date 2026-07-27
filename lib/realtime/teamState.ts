"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/auth/client";

export function teamChannelTopic(roomCode: string, gameId: string, side: string): string {
  return `room:${roomCode.trim().toUpperCase()}:${gameId}:side:${side}`;
}

/** ADR-0005 §6's pre-approved mitigation for team play: a Realtime channel
 * scoped to one side, so a side's own private data can reach its *teammates*
 * without ever reaching the opposing side (which never subscribes to this
 * topic). This is obscurity, not authorization — the same documented,
 * accepted limit ADR-0005 §6 already states for team play generally, not a
 * new gap this hook introduces.
 *
 * Deliberately kept entirely inside the calling game's own code (used
 * directly by `games/battleship/views/Player.tsx`, not routed through
 * `MultiDeviceRoom`/`usePrivateState`) — those stay exactly as they were
 * before M4c, so the 1-vs-1 path has zero new code paths to regress.
 *
 * One side of a match — the *captain*, `sides[side][0]` — is the only
 * device that ever sends: it broadcasts its own fleet on every change.
 * Every other teammate on that side only ever receives, mirroring the
 * broadcast into local state purely for rendering. They never send
 * anything back, so there's no risk of two devices disagreeing about
 * which fleet is authoritative. */
export function useTeamFleetChannel<TFleet>(
  roomCode: string,
  gameId: string,
  side: string,
  isCaptain: boolean,
  fleet: TFleet,
  onReceive: (fleet: TFleet) => void
): void {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onReceiveRef = useRef(onReceive);
  useEffect(() => {
    onReceiveRef.current = onReceive;
  }, [onReceive]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase.channel(teamChannelTopic(roomCode, gameId, side));
    channelRef.current = channel;

    if (!isCaptain) {
      channel.on("broadcast", { event: "fleet" }, ({ payload }) => {
        if (payload?.fleet !== undefined) onReceiveRef.current(payload.fleet as TFleet);
      });
    }

    channel.subscribe();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomCode, gameId, side, isCaptain]);

  // A separate effect (rather than folding this into the one above) so a
  // fleet edit never has to tear down and recreate the whole subscription —
  // only the captain ever runs this; a teammate's `fleet` never changes by
  // their own hand, so re-sending would be a no-op there anyway, but the
  // guard keeps intent explicit.
  useEffect(() => {
    if (!isCaptain || !channelRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "fleet", payload: { fleet } });
  }, [isCaptain, fleet]);
}
