"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("notFound");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setRole(JSON.parse(stored)?.role || null);
    } catch {}
  }, []);

  const dashLink =
    role === "coach" ? "/dashboard/coach" : role === "user" ? "/dashboard/user" : "/";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-background">
      <div className="space-y-6 max-w-md">
        <p className="text-8xl font-black text-primary">404</p>
        <h1 className="text-2xl font-bold text-foreground">{t("heading")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={dashLink}
            className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
          >
            {t("backHome")}
          </Link>
          <Link
            href="/koc"
            className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 font-semibold hover:bg-muted transition-colors"
          >
            {t("browseCoaches")}
          </Link>
        </div>
      </div>
    </div>
  );
}
