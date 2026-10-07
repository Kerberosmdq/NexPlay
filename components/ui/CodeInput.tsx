"use client";

import { useId, useRef } from "react";

export interface CodeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}

/** ADR-0004 §2: the room-code entry — a real (visually hidden, but
 * labeled and keyboard/screen-reader accessible) text input driving a row
 * of tiles the player actually looks at.
 *
 * BDR-0002 §7: each letter is a plastic keycap. An empty slot is a sunken
 * socket; the next one to fill is outlined; a typed letter pops up as a
 * yellow keycap on its edge. Room codes need no monospace face: their
 * alphabet already excludes ambiguous letters and digits. */
export function CodeInput({ label, value, onChange, length = 4, autoFocus }: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const chars = value.padEnd(length, " ").split("").map((c) => c.trim());

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="block text-center text-base font-bold text-ink-muted">
        {label}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="text"
        maxLength={length}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="peer sr-only"
        autoCapitalize="characters"
        autoFocus={autoFocus}
      />

      <div
        onClick={() => inputRef.current?.focus()}
        className="flex justify-center gap-3 cursor-pointer select-none rounded-2xl peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-focus"
      >
        {Array.from({ length }).map((_, idx) => {
          const char = chars[idx] || "";
          const isCurrent = value.length === idx;
          const filled = Boolean(char);

          return (
            <div
              key={idx}
              className={`w-14 h-16 sm:w-16 sm:h-[4.5rem] rounded-2xl flex items-center justify-center ${
                filled
                  ? "bg-action-secondary text-on-secondary shadow-[0_var(--edge-md)_0_var(--color-edge-secondary)] motion-reveal"
                  : isCurrent
                    ? "bg-surface-sunken border-3 border-focus shadow-[inset_0_3px_0_var(--color-edge-sunken)] motion-pulse"
                    : "bg-surface-sunken shadow-[inset_0_3px_0_var(--color-edge-sunken)]"
              }`}
            >
              <span className="font-display text-3xl sm:text-4xl">{char}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
