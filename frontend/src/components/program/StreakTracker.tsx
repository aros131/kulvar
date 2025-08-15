// src/components/program/StreakTracker.tsx
"use client";
import { useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/,"");

// pull + sanitize token from localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  let t = localStorage.getItem("token");
  if (!t) return null;
  t = t.replace(/^"+|"+$/g, "");           // strip accidental quotes
  t = t.replace(/^Bearer\s+/i, "");        // strip accidental "Bearer "
  return t;
}

// decode userId from JWT payload: id | userId | _id | sub
function getUserIdFromToken(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const payload = JSON.parse(atob(raw.split(".")[1] || ""));
    return payload.id || payload.userId || payload._id || payload.sub || null;
  } catch { return null; }
}

export default function StreakTracker({ programId }: { programId: string }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [streak, setStreak] = useState<{ currentStreak: number; longestStreak: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);

      const token = getToken();
      const userId = getUserIdFromToken(token);
      if (!userId) { setErr("Giriş yapın: token yok/geçersiz."); setLoading(false); return; }

      try {
        const res = await fetch(`${API}/progress/streaks/${userId}`, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,   // <— header is sent here
          },
          credentials: "include",  // send cookies as well (if backend uses them)
          mode: "cors",
          cache: "no-store",
        });

        if (res.status === 404) { if (!cancelled) setStreak(null); return; }
        if (!res.ok) throw new Error(`Streak ${res.status}: ${await res.text()}`);

        const data = await res.json();
        if (!cancelled) setStreak(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [programId]);

  if (loading) return <div className="text-sm text-zinc-500">Seri yükleniyor…</div>;
  if (err) return <div className="text-sm text-zinc-500">{err}</div>;
  if (!streak) return <div className="text-sm text-zinc-500">Seri bulunamadı.</div>;

  return (
    <div className="rounded-xl border p-4 bg-white dark:bg-zinc-900">
      <div>Mevcut seri: <b>{streak.currentStreak}</b> gün</div>
      <div>En uzun seri: <b>{streak.longestStreak}</b> gün</div>
    </div>
  );
}
