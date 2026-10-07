"use client";

import { Button } from "./Button";

/** ADR-0004 §2, BDR-0002: a row of toy keys for a small number of choices —
 * the selected one is a raised yellow key, the rest flat sockets. Replaces
 * native `<select>`s, which a 7-year-old can't read at a glance. */
export function KeyRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  options: { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  hint?: string;
}) {
  return (
    <div className="w-full space-y-2" role="group" aria-label={label}>
      <p className="text-base font-bold text-ink-muted">{label}</p>
      <div className="flex gap-2 bg-surface-sunken p-2 rounded-2xl shadow-[inset_0_3px_0_var(--color-edge-sunken)]">
        {options.map((option) => (
          <Button
            key={String(option.value)}
            variant="secondary"
            active={option.value === value}
            disabled={option.disabled}
            sound="select"
            onClick={() => onChange(option.value)}
            className="flex-1 min-w-0 !px-1 text-base !mb-0"
          >
            {option.label}
          </Button>
        ))}
      </div>
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}
