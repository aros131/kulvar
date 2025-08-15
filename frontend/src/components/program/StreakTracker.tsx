"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";

function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const p = JSON.parse(atob(token.split(".")[1] || ""));
    return p.id || p.userId || p._id || p.sub || null;
  } catch { return null; }
}

export default function StreakTracker({ programId }: { programId: string }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [streak, setStreak] = useState<{ currentStreak: number; longestStreak: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const userId = getUserIdFromToken(token);
      if (!userId) { setErr("Giriş yapın: token yok veya geçersiz."); setLoading(false); return; }

      try {
        const res = await authFetch(`progress/streaks/${userId}`);
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
