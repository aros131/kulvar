"use client";
import { useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/,"");

type FeedbackItem = { _id: string; message: string; createdAt: string };

export default function FeedbackHistory({ programId }: { programId: string }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${API}/programs/${programId}/feedback`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          cache: "no-store",
        });

        if (res.status === 404) { if (!cancelled) setItems([]); return; }
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Feedback ${res.status}: ${body.slice(0,160)}…`);
        }

        const data = (await res.json()) as FeedbackItem[];
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) { setErr(e?.message || String(e)); setItems([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [programId]);

  if (loading) return <div className="text-sm text-zinc-500">Geri bildirimler yükleniyor…</div>;
  if (err) return <div className="text-sm text-zinc-500">Geri bildirim alınamadı.</div>;
  if (!items.length) return <div className="text-sm text-zinc-500">Henüz geri bildirim yok.</div>;

  return (
    <div className="rounded-xl border p-4 bg-white dark:bg-zinc-900 space-y-2">
      {items.map((f) => (
        <div key={f._id} className="border-b last:border-0 pb-2">
          <div className="text-sm">{f.message}</div>
          <div className="text-xs text-zinc-500">{new Date(f.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
