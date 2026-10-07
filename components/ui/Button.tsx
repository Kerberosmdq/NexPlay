"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Toggle-style rendering (e.g. a segmented mode switch), not a size. */
  active?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

// Each variant is a molded plastic piece: its own color, its "on" text
// color, and a solid darker bottom edge (BDR-0002 §3). Pressing pushes the
// piece down by the edge height and the edge disappears (§4).
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-action-primary hover:bg-action-primary-hover text-on-primary shadow-[0_var(--edge-md)_0_var(--color-edge-primary)]",
  secondary:
    "bg-action-secondary hover:bg-action-secondary-hover text-on-secondary shadow-[0_var(--edge-md)_0_var(--color-edge-secondary)]",
  success:
    "bg-success hover:bg-success-hover text-on-success shadow-[0_var(--edge-md)_0_var(--color-edge-success)]",
  danger:
    "bg-action-danger hover:bg-action-danger-hover text-on-danger shadow-[0_var(--edge-md)_0_var(--color-edge-danger)]",
  ghost:
    "bg-surface-raised hover:bg-surface-sunken text-ink border-2 border-line shadow-[0_var(--edge-md)_0_var(--color-edge-raised)]",
};

/**
 * ADR-0004 §2: the one Button primitive every screen uses instead of a
 * bespoke `<button className="...">`. A real tap target (56px minimum) is
 * the default, not an opt-in.
 *
 * BDR-0002: a chunky plastic button. It sits on a molded edge and sinks
 * by that edge when pressed; a disabled button loses its edge entirely so
 * it never looks pressable; an inactive toggle is flat and sunken.
 *
 * Forwards its ref (e.g. a dialog focusing a button on open) — a plain
 * function component would make React reject the ref.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", active, fullWidth = true, className = "", children, ...rest },
  ref
) {
  const variantClasses =
    active === false
      ? "bg-surface-sunken text-ink-muted hover:text-ink shadow-[inset_0_3px_0_var(--color-edge-sunken)]"
      : `${VARIANT_CLASSES[variant]} active:translate-y-[var(--edge-md)] active:shadow-none`;

  return (
    <button
      ref={ref}
      className={`min-h-14 rounded-2xl px-6 py-3 mb-[var(--edge-md)] font-display text-lg leading-tight transition-[transform,box-shadow,background-color] duration-75 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus disabled:opacity-45 disabled:shadow-none disabled:translate-y-[var(--edge-md)] disabled:pointer-events-none ${variantClasses} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      aria-pressed={typeof active === "boolean" ? active : undefined}
      {...rest}
    >
      {children}
    </button>
  );
});
