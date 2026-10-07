"use client";

import { Button } from "./Button";
import { Dialog } from "./Dialog";

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** ADR-0004 §2: the one confirmation-dialog primitive for any destructive
 * or hard-to-reverse action (leaving a room, returning everyone to the
 * lobby). A plain neutral scrim, not `RevealCard`'s penumbra treatment —
 * that dark-and-glow look is reserved for the secret-reveal moment
 * (BDR-0001), not a generic "are you sure". Escape and a backdrop click
 * count as Cancel, and Cancel is rendered first so it gets initial focus. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog title={title} onClose={onCancel} role="alertdialog">
      <p className="text-sm text-ink-muted">{message}</p>
      <div className="flex flex-col gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
