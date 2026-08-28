import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import CookieBanner from "@/components/CookieBanner";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";

// Google Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata
export const metadata: Metadata = {
  title: {
    default: "PerSe Coaching — Koçluk Platformu",
    template: "%s | PerSe Coaching",
  },
  description:
    "PerSe Coaching ile koçunu bul, programını takip et, ilerleni hızlandır. Türkiye'nin modern online fitness koçluk platformu.",
  keywords: ["fitness koç", "online koçluk", "antrenman programı", "spor koçu", "PerSe Coaching"],
  authors: [{ name: "PerSe Coaching" }],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "PerSe Coaching",
    title: "PerSe Coaching — Koçluk Platformu",
    description: "Koçunu bul, programını takip et, ilerleni hızlandır.",
  },
};

// ✅ Correct RootLayout with fonts + Toaster
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <EmailVerificationBanner />
        {children}
        <CookieBanner />
        <Toaster richColors position="top-right" />
        <Script src="https://cdn.aidesigner.ai/effects/runtime/v1.js" strategy="afterInteractive" />
        {/* Badge'i kapatan overlay */}
        <div style={{position:"fixed",bottom:0,right:0,width:260,height:64,background:"var(--background)",zIndex:2147483647,pointerEvents:"none"}} />
      </body>
    </html>
  );
}
