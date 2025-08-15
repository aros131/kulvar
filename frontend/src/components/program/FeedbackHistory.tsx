"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";

type FeedbackItem = { _id: string; message: string; createdAt: string };

export default function FeedbackHistory({ programId }: { programId: string }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await authFetch(`programs/${programId}/feedback`);
        if (res.status === 404) { if (!cancelled) setItems([]); return; }
        if (!res.ok) throw new Error(`Feedback ${res.status}: ${await res.text()}`);
        const data = await res.json();
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
  if (err) return <div className="text-sm text-zinc-500">{err}</div>;
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
