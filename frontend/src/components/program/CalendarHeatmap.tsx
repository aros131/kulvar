// src/components/program/CalendarHeatmap.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://kulvar-qb7t.onrender.com').replace(/\/+$/, '');

type Status = 'completed' | 'missed' | 'planned' | 'none';
type Day = { date: string; status: Status };
type CalEvent = {
  start: string;
  end?: string;
  status?: 'planned' | 'completed' | 'missed';
  programId?: string;
  assignmentId?: string;
};

function token() {
  if (typeof window === 'undefined') return null;
  const t = localStorage.getItem('token');
  return t ? t.replace(/^"+|"+$/g, '').replace(/^Bearer\s+/i, '') : null;
}

function ymd(d: Date) {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

function toLocalISOFloor(d: Date) {
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  return new Date(dd.getTime() - dd.getTimezoneOffset() * 60000).toISOString();
}

function mergeDayStatus(a: Status, b: Status): Status {
  const order: Record<Status, number> = { completed: 3, missed: 2, planned: 1, none: 0 };
  return order[a] >= order[b] ? a : b;
}

export default function CalendarHeatmap({
  programId,
  assignmentId,
}: {
  programId: string | 'all';
  assignmentId?: string;
}) {
  const [days, setDays] = useState<Day[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // last 30 days, inclusive of today (to = tomorrow 00:00 local)
  const { fromISO, toISO, rangeDates } = useMemo(() => {
    const now = new Date();
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - 29);

    const to = new Date(now);
    to.setHours(24, 0, 0, 0); // tomorrow local midnight

    const arr: Date[] = [];
    const cur = new Date(from);
    for (let i = 0; i < 30; i++) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return { fromISO: toLocalISOFloor(from), toISO: toLocalISOFloor(to), rangeDates: arr };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const t = token();
        const q = new URLSearchParams();
        q.set('from', fromISO);
        q.set('to', toISO);
        if (programId && programId !== 'all') q.set('programId', String(programId));
        if (assignmentId) q.set('assignmentId', String(assignmentId));

        const res = await fetch(`${API}/events?${q.toString()}`, {
          headers: { Accept: 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
          cache: 'no-store',
          credentials: 'include',
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
        const json = text ? JSON.parse(text) : {};
        const evs: CalEvent[] = Array.isArray(json?.events) ? json.events : [];

        const map = new Map<string, Status>();
        const now = new Date();
        // init
        for (const d of rangeDates) map.set(ymd(d), 'none');

        for (const e of evs) {
          const st = new Date(e.start);
          const en = new Date(e.end || e.start);
          const key = ymd(st);
          let s: Status = 'planned';
          if (e.status === 'completed') s = 'completed';
          else if (en < now) s = 'missed';
          map.set(key, mergeDayStatus(map.get(key) || 'none', s));
        }

        const out: Day[] = rangeDates.map((d) => ({ date: ymd(d), status: map.get(ymd(d)) || 'none' }));
        if (!cancelled) setDays(out);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API, programId, assignmentId, fromISO, toISO, rangeDates]);

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
            <span className="h-3 w-3 rounded bg-sky-400 inline-block" /> Planlı
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
                : status === 'planned'
                ? 'bg-sky-400'
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
