"use client";
import { useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/,"");

type HeatItem = { date: string; count: number };

export default function CalendarHeatmap({ programId }: { programId: string }) {
  const [data, setData] = useState<HeatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${API}/progress/calendar/${programId}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          cache: "no-store",
        });

        if (res.status === 404) { if (!cancelled) setData([]); return; }
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Calendar ${res.status}: ${body.slice(0,160)}…`);
        }

        const json = (await res.json()) as HeatItem[];
        if (!cancelled) setData(Array.isArray(json) ? json : []);
      } catch (e: any) {
        if (!cancelled) { setErr(e?.message || String(e)); setData([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [programId]);

  if (loading) return <div className="text-sm text-zinc-500">Takvim yükleniyor…</div>;
  if (err) return <div className="text-sm text-zinc-500">Takvim verisi alınamadı.</div>;
  if (!data.length) return <div className="text-sm text-zinc-500">Henüz kayıt yok.</div>;

  // Render YOUR heatmap component here; placeholder:
  return (
    <div className="rounded-xl border p-4 bg-white dark:bg-zinc-900">
      <div className="text-sm">({data.length}) kayıt</div>
    </div>
  );
}
