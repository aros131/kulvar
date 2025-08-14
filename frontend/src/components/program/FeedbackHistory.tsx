"use client";
import { useEffect, useState } from "react";
import { fetchJSONorNull } from "@/lib/api";

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
        const data = await fetchJSONorNull<FeedbackItem[]>(`feedback/program/${programId}`, { cache: "no-store" });
        if (!cancelled) setItems(Array.isArray(data) ? data : []); // null => []
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [programId]);

  if (loading) return <div className="text-sm text-zinc-500">Geri bildirimler yükleniyor…</div>;
  if (err) return <div className="text-sm text-zinc-500">Geri bildirim bulunamadı.</div>;
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
