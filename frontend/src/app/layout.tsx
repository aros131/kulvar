import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import CookieBanner from "@/components/CookieBanner";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import PwaServiceWorker from "@/components/PwaServiceWorker";
import IosSafeAreaFix from "@/components/IosSafeAreaFix";
import NativeSplash from "@/components/NativeSplash";

// Google Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const OG_LOCALE: Record<string, string> = { tr: "tr_TR", en: "en_US", fr: "fr_FR" };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("seo");

  return {
    title: {
      default: t("rootTitle"),
      template: "%s | PerSe Coaching",
    },
    description: t("rootDescription"),
    keywords: t.raw("rootKeywords") as string[],
    authors: [{ name: "PerSe Coaching" }],
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale] || "tr_TR",
      siteName: "PerSe Coaching",
      title: t("rootOgTitle"),
      description: t("rootOgDescription"),
    },
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/icons/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
  // Capacitor's WKWebView draws edge-to-edge under the notch/camera cutout by
  // default; viewport-fit=cover is what makes env(safe-area-inset-*) resolve
  // to real pixel values in CSS instead of 0, so fixed headers can reserve space.
  viewportFit: "cover",
};

// ✅ Correct RootLayout with fonts + Toaster
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased pt-[env(safe-area-inset-top)]`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NativeSplash />
          <IosSafeAreaFix />
          <PwaServiceWorker />
          <EmailVerificationBanner />
          {children}
          <CookieBanner />
          <Toaster richColors position="top-right" />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
