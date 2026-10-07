"use client";

import { useTranslations } from "next-intl";
import { playCue, setFeedbackEnabled } from "@/lib/feedback";
import { useFeedbackEnabled } from "@/lib/feedback/react";

/** The one switch for sound + vibration (M6.5 phase 3). A plastic key with a
 * speaker that shows its state by shape (sound waves or a cross), not color
 * alone. Turning it on plays a click, so the player hears what they chose. */
export function SoundToggle() {
  const t = useTranslations("Lobby");
  const enabled = useFeedbackEnabled();

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={t("soundToggleLabel")}
      title={enabled ? t("soundOn") : t("soundOff")}
      onClick={() => {
        setFeedbackEnabled(!enabled);
        if (!enabled) playCue("select");
      }}
      className={`min-w-14 min-h-14 mb-[var(--edge-md)] rounded-2xl flex items-center justify-center border-2 transition-[transform,box-shadow] duration-75 active:translate-y-[var(--edge-md)] active:shadow-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus ${
        enabled
          ? "bg-action-secondary text-on-secondary border-transparent shadow-[0_var(--edge-md)_0_var(--color-edge-secondary)]"
          : "bg-surface-raised text-ink-muted border-line shadow-[0_var(--edge-md)_0_var(--color-edge-raised)]"
      }`}
    >
      <svg
        viewBox="0 0 32 32"
        width={28}
        height={28}
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h5l7-6v20l-7-6H5z" fill="currentColor" />
        {enabled ? (
          <path d="M21 11.5a6 6 0 0 1 0 9M24.5 8a11 11 0 0 1 0 16" />
        ) : (
          <path d="M21 12l7 8M28 12l-7 8" />
        )}
      </svg>
    </button>
  );
}
