"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const t = useTranslations("auth.verifyEmail");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t("invalidLink"));
      return;
    }
    fetch(`${API}/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || t("defaultSuccess"));
        } else {
          setStatus("error");
          setMessage(data.message || t("defaultError"));
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage(t("connectionError"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-background">
      <div className="space-y-5 max-w-sm">
        {status === "loading" && (
          <>
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">{t("verifying")}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-5xl">✅</div>
            <h1 className="text-xl font-bold">{t("successTitle")}</h1>
            <p className="text-muted-foreground">{message}</p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
            >
              {t("loginCta")}
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-5xl">❌</div>
            <h1 className="text-xl font-bold">{t("errorTitle")}</h1>
            <p className="text-muted-foreground">{message}</p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 font-semibold hover:bg-muted transition-colors"
            >
              {t("backToLoginCta")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
