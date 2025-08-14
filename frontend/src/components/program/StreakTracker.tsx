"use client";
import { useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/,"");

function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return payload.id || payload.userId || payload._id || payload.sub || null;
  } catch {
    return null;
  }
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
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const userId = getUserIdFromToken(token);

        if (!userId) {
          setStreak(null);
          setErr("Kullanıcı kimliği bulunamadı.");
          return;
        }

        const res = await fetch(`${API}/progress/streaks/${userId}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          cache: "no-store",
        });

        if (res.status === 404) {
          if (!cancelled) setStreak(null);
          return;
        }
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Streak ${res.status}: ${body.slice(0,160)}…`);
        }

        const data = (await res.json()) as { currentStreak: number; longestStreak: number };
        if (!cancelled) setStreak(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [programId]); // programId unused for the call but keeps effect tied to the page

  if (loading) return <div className="text-sm text-zinc-500">Seri yükleniyor…</div>;
  if (err) return <div className="text-sm text-zinc-500">Seri bilgisi yok.</div>;
  if (!streak) return <div className="text-sm text-zinc-500">Seri bulunamadı.</div>;

  return (
    <div className="rounded-xl border p-4 bg-white dark:bg-zinc-900">
      <div>Mevcut seri: <b>{streak.currentStreak}</b> gün</div>
      <div>En uzun seri: <b>{streak.longestStreak}</b> gün</div>
    </div>
  );
}
