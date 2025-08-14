"use client";
import { useEffect, useState } from "react";
import { fetchJSONorNull } from "@/lib/api";

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
        const data = await fetchJSONorNull<{ currentStreak: number; longestStreak: number }>(
          `progress/streak/${programId}`,
          { cache: "no-store" }
        );
        if (!cancelled) setStreak(data); // data === null on 404
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [programId]);

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
