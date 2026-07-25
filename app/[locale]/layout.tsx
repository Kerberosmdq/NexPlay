import type { Metadata, Viewport } from "next";
import { Bevan, Nunito, Space_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

import { AuthProvider } from "@/components/platform/AuthProvider";

// BDR-0001 §3: a condensed display face, a humanist body/UI face, and a
// monospace face for room codes/timers/scores. All three self-hosted via
// next/font — this retires the audit's font-loading finding (Outfit and
// Geist Mono loaded but unused, Plus Jakarta Sans pulled from an external
// Google Fonts @import and forced with !important).
const bevan = Bevan({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
});

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "NexPlay — Juegos de mesa digitales",
  description: "Juega en familia y amigos en tiempo real.",
};

// BDR-0001 §4: the hexagon is real — this is the browser-chrome half of
// that (mobile Chrome's address bar tint); app/manifest.ts covers the
// installed-app half.
export const viewport: Viewport = {
  themeColor: "#1f6b52",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      className={`${bevan.variable} ${nunito.variable} ${spaceMono.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-surface text-ink selection:bg-action-primary selection:text-on-primary">
        <NextIntlClientProvider>
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
