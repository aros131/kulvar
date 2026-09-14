"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// The same marketing-site top navbar used on the homepage — shared here so
// public pages (like /koc for a signed-out visitor) stay visually consistent
// with it instead of drifting into their own copy.
export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("publicNav");

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-[60] px-6 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/60 to-transparent" />
        <div className="relative flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-foreground tracking-tight">PerSe.</Link>
          <ul className="hidden md:flex items-center gap-6 text-sm text-foreground/80">
            <li><Link href="/koc" className="hover:text-white transition-colors">{t("coaches")}</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">{t("contact")}</Link></li>
            <li><Link href="/login" className="hover:text-foreground transition-colors">{t("login")}</Link></li>
            <li>
              <Link href="/signup" className="rounded-full border border-border px-4 py-1.5 hover:bg-muted transition-colors">
                {t("signup")}
              </Link>
            </li>
            <li><LanguageSwitcher /></li>
          </ul>
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <button
              aria-label={t("menuAriaLabel")}
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border text-foreground shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                {menuOpen
                  ? <path fillRule="evenodd" d="M18.3 5.7a1 1 0 0 1 0 1.4L13.4 12l4.9 4.9a1 1 0 1 1-1.4 1.4L12 13.4l-4.9 4.9a1 1 0 1 1-1.4-1.4L10.6 12 5.7 7.1A1 1 0 0 1 7.1 5.7L12 10.6l4.9-4.9a1 1 0 0 1 1.4 0z" clipRule="evenodd"/>
                  : <><path d="M4 6h16v2H4z"/><path d="M4 11h16v2H4z"/><path d="M4 16h16v2H4z"/></>
                }
              </svg>
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border bg-card/95 backdrop-blur p-4 text-foreground text-sm">
              <Link href="/koc" className="block px-3 py-2.5 rounded-lg hover:bg-muted" onClick={() => setMenuOpen(false)}>{t("coaches")}</Link>
              <Link href="/contact" className="block px-3 py-2.5 rounded-lg hover:bg-muted" onClick={() => setMenuOpen(false)}>{t("contact")}</Link>
              <div className="mt-2 pt-2 border-t border-border flex gap-2">
                <Link href="/login" className="flex-1 text-center rounded-xl border border-border px-3 py-2 hover:bg-muted" onClick={() => setMenuOpen(false)}>{t("login")}</Link>
                <Link href="/signup" className="flex-1 text-center rounded-xl bg-primary text-primary-foreground px-3 py-2 font-medium" onClick={() => setMenuOpen(false)}>{t("signup")}</Link>
              </div>
            </div>
          )}
        </div>
      </nav>
      <div className="hidden md:block h-16" />
    </>
  );
}
