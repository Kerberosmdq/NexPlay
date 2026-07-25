import type { ReactNode } from "react";

export interface ScoreboardEntry {
  id: string;
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
}

export interface ScoreboardProps {
  title?: string;
  entries: ScoreboardEntry[];
}

/** ADR-0004 §2: the end-of-round score list, shared by both games' host
 * and single-device resolution screens. Each game supplies its own
 * icon/label/value per row (a checkmark, a role, points) — this owns only
 * the shared list chrome. */
export function Scoreboard({ title, entries }: ScoreboardProps) {
  return (
    <div className="w-full space-y-2">
      {title && (
        <h3 className="text-xl font-bold text-ink-muted mb-2 border-b border-line pb-2">{title}</h3>
      )}
      {entries.map((entry) => (
        <div key={entry.id} className="flex justify-between items-center bg-surface-sunken p-3 rounded-xl">
          <div className="flex items-center space-x-3">
            {entry.icon}
            {entry.label}
          </div>
          {entry.value}
        </div>
      ))}
    </div>
  );
}
