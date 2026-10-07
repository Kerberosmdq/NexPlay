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
 * Impostor's PlayerRoster and the room lobby's player list. BDR-0002: rows
 * sit in a sunken plastic tray; the host badge is a small yellow keycap. */
export function PlayerChip({
  player,
  variant = "roster",
  alive = true,
  eliminatedLabel,
  hostLabel = "HOST",
}: PlayerChipProps) {
  if (variant === "list") {
    return (
      <div className="flex items-center gap-3 bg-surface-sunken px-4 py-3 rounded-2xl">
        <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${player.isOnline ? "bg-success" : "bg-action-danger"}`} />
        <span className="text-lg text-ink font-bold flex-1">{player.displayName}</span>
        {player.isHost && (
          <span className="text-sm font-display bg-action-secondary text-on-secondary px-2.5 py-0.5 rounded-lg shadow-[0_3px_0_var(--color-edge-secondary)]">
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
          ? "text-base font-bold text-ink bg-surface-raised px-3 py-1 rounded-full shadow-[0_var(--edge-sm)_0_var(--color-edge-raised)]"
          : "text-base font-bold text-ink-muted bg-surface-sunken/50 px-3 py-1 rounded-full line-through"
      }
    >
      {player.displayName}
    </span>
  );
}
