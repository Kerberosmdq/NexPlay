"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Toggle-style rendering (e.g. a segmented mode switch), not a size. */
  active?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-action-primary hover:bg-action-primary-hover text-on-primary",
  secondary:
    "bg-action-secondary hover:bg-action-secondary-hover text-on-secondary",
  danger: "bg-action-danger hover:bg-action-danger-hover text-on-danger",
  ghost: "bg-surface-sunken hover:bg-surface-raised text-ink border border-line",
};

/**
 * ADR-0004 §2: the one Button primitive every screen uses instead of a
 * bespoke `<button className="...">`. A real tap target (56px minimum) is
 * the default, not an opt-in — the audit found a sr-only room-code input
 * mistaken for a visible tap target and a raw 12px "✕" with no minimum
 * size at all; this primitive makes both impossible to reintroduce.
 */
export function Button({
  variant = "primary",
  active,
  fullWidth = true,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const activeClasses =
    active === false
      ? "bg-surface-sunken text-ink-muted hover:text-ink"
      : VARIANT_CLASSES[variant];

  return (
    <button
      className={`min-h-14 rounded-2xl px-6 py-3 font-black tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-40 disabled:pointer-events-none ${activeClasses} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      aria-pressed={typeof active === "boolean" ? active : undefined}
      {...rest}
    >
      {children}
    </button>
  );
}
