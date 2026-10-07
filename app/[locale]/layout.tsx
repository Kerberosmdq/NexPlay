import type { Metadata, Viewport } from "next";
import { Baloo_2, Space_Mono, Titan_One } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

import { AuthProvider } from "@/components/platform/AuthProvider";

// BDR-0002 §7: Titan One for titles, buttons and big numbers (chunky,
// rounded, reads like molded lettering), Baloo 2 for everything read or
// typed, and a monospace face kept for digits only (timers, scores). All
// self-hosted via next/font.
const titanOne = Titan_One({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
});

const baloo = Baloo_2({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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

// Mobile browser chrome matches the baseplate (BDR-0002 §1);
// app/manifest.ts covers the installed-app half.
export const viewport: Viewport = {
  themeColor: "#2a66e0",
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
      className={`${titanOne.variable} ${baloo.variable} ${spaceMono.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col text-ink selection:bg-action-secondary selection:text-on-secondary">
        <NextIntlClientProvider>
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
