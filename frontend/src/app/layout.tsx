import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import CookieBanner from "@/components/CookieBanner";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import Script from "next/script";

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
        <Script id="remove-aifx-badge" strategy="afterInteractive">{`
          (function removeBadge() {
            function kill() {
              document.querySelectorAll('a, div, span, iframe').forEach(function(el) {
                var href = el.getAttribute && el.getAttribute('href');
                var src = el.getAttribute && el.getAttribute('src');
                var text = el.textContent || '';
                if (
                  (href && href.includes('aidesigner')) ||
                  (src && src.includes('aidesigner')) ||
                  text.toLowerCase().includes('made with ai designer') ||
                  text.toLowerCase().includes('ai designer')
                ) { el.style.display = 'none'; }
              });
            }
            kill();
            setTimeout(kill, 500);
            setTimeout(kill, 1500);
            new MutationObserver(kill).observe(document.body, { childList: true, subtree: true });
          })();
        `}</Script>
      </body>
    </html>
  );
}
