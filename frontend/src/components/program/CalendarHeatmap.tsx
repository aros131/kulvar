// src/components/program/CalendarHeatmap.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://kulvar-qb7t.onrender.com').replace(/\/+$/, '');

type Day = { date: string; status: 'completed' | 'missed' | 'none' };

function token() {
  if (typeof window === 'undefined') return null;
  const t = localStorage.getItem('token');
  return t ? t.replace(/^"+|"+$/g, '').replace(/^Bearer\\s+/i, '') : null;
}

function iso(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}

export default function CalendarHeatmap({ programId }: { programId: string | 'all' }) {
  const [days, setDays] = useState<Day[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { fromISO, toISO } = useMemo(() => {
    const to = new Date(); // today
    const from = new Date();
    from.setDate(to.getDate() - 29);
    return { fromISO: iso(from), toISO: iso(to) };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const t = token();
        const url = `${API}/progress/calendar/${encodeURIComponent(programId || 'all')}?from=${encodeURIComponent(
          fromISO
        )}&to=${encodeURIComponent(toISO)}`;
        const res = await fetch(url, {
          headers: { Accept: 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as { days?: Day[] };
        if (!cancelled) setDays(Array.isArray(json?.days) ? json.days : []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API, programId, fromISO, toISO]);

  return (
    <div className="rounded-xl border p-4 bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Son 30 Gün</h3>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-green-500 inline-block" /> Tamamlandı
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-amber-500 inline-block" /> Kaçırıldı
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-zinc-300 dark:bg-zinc-700 inline-block" /> Boş
          </span>
        </div>
      </div>

      {loading && <div className="text-sm text-zinc-500">Yükleniyor…</div>}
      {err && <div className="text-sm text-red-600">Hata: {String(err)}</div>}

      {!loading && !err && (
        <div className="grid grid-cols-10 gap-1">
          {days.map((d, i) => {
            const status = d?.status || 'none';
            const cls =
              status === 'completed'
                ? 'bg-green-500'
                : status === 'missed'
                ? 'bg-amber-500'
                : 'bg-zinc-300 dark:bg-zinc-700';

            return (
              <button
                key={`${d?.date ?? i}`}
                title={`${String(d?.date ?? '')} - ${status}`}
                onClick={() => router.push(`/takvim?date=${encodeURIComponent(d?.date ?? '')}`)}
                className={`h-4 w-4 rounded ${cls} focus:outline-none focus:ring-2 focus:ring-offset-1`}
                aria-label={`${d?.date ?? ''} ${status}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
