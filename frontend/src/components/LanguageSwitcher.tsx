"use client";

import { Globe, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { locales, localeLabels, localeCookieName, type Locale } from "@/i18n/config";

type Variant = "pill" | "icon" | "inline";

interface Props {
  className?: string;
  /**
   * "pill" — text+icon button with a dropdown, for navbars and standalone auth pages.
   * "icon" — 48x48 icon-only button matching the desktop sidebar's other nav buttons;
   *          its dropdown flies out to the right since the sidebar rail is narrow.
   * "inline" — a labeled row with an inline TR/EN/FR segmented control, for the
   *            mobile bottom-nav's "More" sheet.
   */
  variant?: Variant;
}

export default function LanguageSwitcher({ className = "", variant = "pill" }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant === "inline") return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [variant]);

  function changeLocale(next: Locale) {
    if (next === locale) {
      setOpen(false);
      return;
    }
    document.cookie = `${localeCookieName}=${next}; path=/; max-age=31536000`;
    setOpen(false);
    router.refresh();
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${className}`}>
        <span className="flex items-center gap-3 text-sm text-muted-foreground">
          <Globe className="h-5 w-5" />
          {t("language")}
        </span>
        <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => changeLocale(l)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
                l === locale
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const isIcon = variant === "icon";

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("language")}
        title={isIcon ? t("language") : undefined}
        className={
          isIcon
            ? "flex items-center justify-center w-12 h-12 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            : "flex items-center gap-1.5 rounded-lg border border-border bg-card/90 backdrop-blur px-2.5 py-1.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground"
        }
      >
        <Globe className={isIcon ? "h-6 w-6" : "h-4 w-4"} />
        {!isIcon && <span>{locale.toUpperCase()}</span>}
      </button>
      {open && (
        <div
          className={`absolute z-50 w-36 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg ${
            isIcon ? "left-full top-0 ml-2" : "right-0 mt-1"
          }`}
        >
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => changeLocale(l)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-accent hover:text-accent-foreground ${
                l === locale ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {localeLabels[l]}
              {l === locale && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
