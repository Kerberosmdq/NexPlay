"use client";

import { useId } from "react";
import type { InputHTMLAttributes } from "react";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/** ADR-0004 §2: a labeled text input, tokens only. Every text entry in the
 * app (display name, player names, ...) goes through this instead of a
 * one-off `<input className="...">`. */
export function Field({ label, id, className = "", ...rest }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-xs font-black uppercase tracking-widest text-ink-muted">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-5 py-4 bg-surface-sunken border-2 border-line rounded-2xl text-ink placeholder-ink-muted font-extrabold text-base outline-none focus-visible:border-focus ${className}`}
        {...rest}
      />
    </div>
  );
}
