"use client";

import { useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default function EmailVerificationBanner() {
  const [show, setShow] = useState(false);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("emailBannerDismissed") === "1") return;
      const stored = localStorage.getItem("user");
      if (!stored) return;
      const user = JSON.parse(stored);
      // Use cached value first — avoids extra profile fetch on every page
      if (user.emailVerified === false) {
        setShow(true);
        return;
      }
      // If not in localStorage, fall back to a single profile check
      if (user.emailVerified === undefined) {
        const token = localStorage.getItem("token");
        if (!token) return;
        fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(data => {
            if (data.emailVerified === false) setShow(true);
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  const resend = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/auth/resend-verification`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setResent(true);
    } catch {}
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between gap-4 text-sm">
      <span className="text-amber-800 dark:text-amber-200">
        📧 E-posta adresiniz henüz doğrulanmadı. Lütfen gelen kutunuzu kontrol edin.
      </span>
      <div className="flex items-center gap-3 shrink-0">
        {resent ? (
          <span className="text-green-700 dark:text-green-400 font-medium">Gönderildi ✓</span>
        ) : (
          <button
            onClick={resend}
            disabled={loading}
            className="text-amber-700 dark:text-amber-300 underline font-medium hover:no-underline disabled:opacity-50"
          >
            {loading ? "Gönderiliyor..." : "Tekrar Gönder"}
          </button>
        )}
        <button
          onClick={() => { localStorage.setItem("emailBannerDismissed", "1"); setShow(false); }}
          className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
          aria-label="Kapat"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
