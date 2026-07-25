import type { Player } from "@/lib/types/room";

export interface PlayerChipProps {
  player: Player;
  /** Compact pill (discussion/voting roster strip) vs a full row (lobby
   * player list, with an online dot and a HOST badge). */
  variant?: "roster" | "list";
  /** Roster variant only — renders eliminated players struck through. */
  alive?: boolean;
  eliminatedLabel?: string;
  hostLabel?: string;
}

/** ADR-0004 §2: the one place a player's name + status renders, replacing
 * the near-duplicate roster/list markup that used to live separately in
 * Impostor's PlayerRoster and the room lobby's player list. */
export function PlayerChip({
  player,
  variant = "roster",
  alive = true,
  eliminatedLabel,
  hostLabel = "HOST",
}: PlayerChipProps) {
  if (variant === "list") {
    return (
      <div className="flex items-center space-x-3 bg-surface-sunken p-3 rounded-xl">
        <div
          className={`w-3 h-3 rounded-full ${player.isOnline ? "bg-action-primary" : "bg-action-danger"}`}
          style={player.isOnline ? { boxShadow: "0 0 10px color-mix(in srgb, var(--color-action-primary) 80%, transparent)" } : undefined}
        />
        <span className="text-lg text-ink font-semibold flex-1">{player.displayName}</span>
        {player.isHost && (
          <span className="text-xs bg-action-primary text-on-primary px-2 py-1 rounded-full font-bold">
            {hostLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <span
      title={alive ? undefined : eliminatedLabel}
      className={
        alive
          ? "text-sm font-bold text-ink bg-surface-sunken px-2.5 py-1 rounded-full"
          : "text-sm font-bold text-ink-muted bg-surface-sunken/50 px-2.5 py-1 rounded-full line-through"
      }
    >
      {player.displayName}
    </span>
  );
}
