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
 * of tiles the player actually looks at. */
export function CodeInput({ label, value, onChange, length = 4, autoFocus }: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const chars = value.padEnd(length, " ").split("").map((c) => c.trim());

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="block text-center text-xs font-black uppercase tracking-widest text-ink-muted">
        {label}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="text"
        maxLength={length}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="sr-only"
        autoCapitalize="characters"
        autoFocus={autoFocus}
      />

      <div
        onClick={() => inputRef.current?.focus()}
        className="flex justify-center gap-3 sm:gap-4 cursor-pointer select-none"
      >
        {Array.from({ length }).map((_, idx) => {
          const char = chars[idx] || "";
          const isCurrent = value.length === idx;
          const filled = Boolean(char);

          return (
            <div
              key={idx}
              className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl flex items-center justify-center bg-surface-well border-4 ${
                filled
                  ? "border-accent-mint scale-105"
                  : isCurrent
                    ? "border-focus motion-pulse"
                    : "border-line"
              }`}
              style={
                filled
                  ? { boxShadow: "0 0 20px color-mix(in srgb, var(--color-accent-mint) 65%, transparent)" }
                  : isCurrent
                    ? { boxShadow: "0 0 20px color-mix(in srgb, var(--color-focus) 65%, transparent)" }
                    : undefined
              }
            >
              <span className="text-3xl sm:text-4xl font-black text-accent-mint tracking-widest">{char}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
