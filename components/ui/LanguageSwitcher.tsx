"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** ADR-0004 §2: the app's first real language switcher (M3.5 code task 3b).
 * Retires the bilingual "ES / EN"-style labels that stood in for one —
 * showing both languages at once because there was no way to choose. Stays
 * on the current route/room state; next-intl's navigation re-resolves the
 * same path under the new locale segment. */
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Lobby");

  return (
    <div
      role="group"
      aria-label={t("languageLabel")}
      className="inline-flex rounded-full border-2 border-line bg-surface-sunken p-1 text-xs font-black uppercase tracking-widest"
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          aria-pressed={locale === loc}
          aria-label={loc === "es" ? t("languageSpanish") : t("languageEnglish")}
          onClick={() => router.replace(pathname, { locale: loc })}
          className={`min-w-11 min-h-11 rounded-full px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
            locale === loc ? "bg-action-primary text-on-primary" : "text-ink-muted"
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
