"use client";

import { useId } from "react";
import type { InputHTMLAttributes } from "react";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/** ADR-0004 §2: a labeled text input, tokens only. Every text entry in the
 * app (display name, player names, ...) goes through this instead of a
 * one-off `<input className="...">`. BDR-0002: a sunken plastic well — the
 * inset edge reads as "something goes in here", the opposite of a button. */
export function Field({ label, id, className = "", ...rest }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-base font-bold text-ink-muted">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-5 py-3.5 bg-surface-sunken border-2 border-transparent rounded-2xl text-ink placeholder:text-ink-muted placeholder:font-semibold font-bold text-xl outline-none shadow-[inset_0_3px_0_var(--color-edge-sunken)] focus-visible:border-focus ${className}`}
        {...rest}
      />
    </div>
  );
}
