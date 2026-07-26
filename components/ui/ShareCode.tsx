"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "./Button";

export interface ShareCodeProps {
  roomCode: string;
}

/** ADR-0004 §2: room-code copy/share (M3.5 code task 3b). Feature-detects
 * the Web Share API (mobile) and falls back to clipboard copy everywhere
 * else — replaces "read the code out loud or type it by hand" with one tap. */
export function ShareCode({ roomCode }: ShareCodeProps) {
  const t = useTranslations("Lobby");
  const [copied, setCopied] = useState(false);

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (permissions, insecure context) —
      // there's nothing more to do than leave the code visible to copy by hand.
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ text: t("shareMessage", { code: roomCode }) });
    } catch {
      // AbortError when the user cancels the native share sheet, or the API
      // rejects — either way, silently do nothing rather than surface an error
      // for what is a deliberate cancel in the common case.
    }
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="ghost"
        fullWidth={false}
        onClick={handleCopy}
        className="px-5 text-sm"
        aria-label={t("copyCodeButton")}
      >
        {copied ? t("copiedFeedback") : t("copyCodeButton")}
      </Button>
      {canShare && (
        <Button
          variant="ghost"
          fullWidth={false}
          onClick={handleShare}
          className="px-5 text-sm"
          aria-label={t("shareButton")}
        >
          {t("shareButton")}
        </Button>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? t("copiedFeedback") : ""}
      </span>
    </div>
  );
}
