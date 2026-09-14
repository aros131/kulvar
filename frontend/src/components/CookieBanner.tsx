"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function CookieBanner() {
  const t = useTranslations("cookieBanner");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cookie_consent")) setVisible(true);
    } catch {}
  }, []);

  const accept = () => {
    try { localStorage.setItem("cookie_consent", "accepted"); } catch {}
    setVisible(false);
  };

  const decline = () => {
    try { localStorage.setItem("cookie_consent", "declined"); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-background border-t border-border shadow-lg md:bottom-4 md:left-4 md:right-auto md:max-w-sm md:rounded-xl md:pb-4">
      <p className="text-sm text-foreground mb-3">
        {t("text")}{" "}
        <Link href="/privacy" className="underline text-primary">{t("privacyLink")}</Link>
      </p>
      <div className="flex gap-2">
        <button
          onClick={accept}
          className="flex-1 rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2 hover:opacity-90 transition-opacity"
        >
          {t("accept")}
        </button>
        <button
          onClick={decline}
          className="flex-1 rounded-lg border border-border text-sm font-semibold py-2 hover:bg-muted transition-colors"
        >
          {t("decline")}
        </button>
      </div>
    </div>
  );
}
