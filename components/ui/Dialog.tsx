"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export interface DialogProps {
  title: string;
  /** Called on Escape, a backdrop click, or whatever the caller wires to
   * its own close/cancel button. */
  onClose: () => void;
  /** `alertdialog` for a question that needs an answer (ConfirmDialog),
   * plain `dialog` for information. */
  role?: "dialog" | "alertdialog";
  children: ReactNode;
}

/** ADR-0004 §2: the one modal shell — scrim, focus trap, Escape and
 * backdrop-to-close, drawn as a white plastic panel (BDR-0002).
 * `ConfirmDialog` and the how-to-play dialog are both
 * built on it, so every modal in the app behaves the same way. Focus moves
 * to the first button inside on open. */
export function Dialog({ title, onClose, role = "dialog", children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Callers usually pass an inline arrow; reading it through a ref keeps the
  // effect below mount-only, so a re-render never steals focus back to the
  // first button.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button");
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "color-mix(in srgb, var(--color-ink) 60%, transparent)" }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        className="motion-deal bg-surface-raised rounded-[1.75rem] p-6 w-full max-w-sm space-y-4 shadow-[0_var(--edge-lg)_0_var(--color-edge-raised)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-2xl text-ink leading-tight">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
