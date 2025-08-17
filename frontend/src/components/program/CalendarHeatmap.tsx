// src/components/program/CalendarHeatmap.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://kulvar-qb7t.onrender.com').replace(/\/+$/, '');

type Status = 'completed' | 'missed' | 'planned' | 'none';
export type CalEvent = {
  _id?: string;
  title?: string;
  start: string; // ISO
  end?: string;  // ISO
  status?: 'planned' | 'completed' | 'missed';
  programId?: string;
  assignmentId?: string;
};

type DayCell = {
  date: Date;
  ymd: string;
  inMonth: boolean;
  status: Status;
  events: CalEvent[];
};

function token() {
  if (typeof window === 'undefined') return null;
  const t = localStorage.getItem('token');
  return t ? t.replace(/^"+|"+$/g, '').replace(/^Bearer\s+/i, '') : null;
}
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localFloorISO = (d: Date) => {
  const k = new Date(d);
  k.setHours(0, 0, 0, 0);
  return new Date(k.getTime() - k.getTimezoneOffset() * 60000).toISOString();
};

function statusMerge(a: Status, b: Status): Status {
  const rank: Record<Status, number> = { completed: 3, missed: 2, planned: 1, none: 0 };
  return rank[a] >= rank[b] ? a : b;
}

function buildMonthGrid(base: Date) {
  // Monday-first grid
  const firstOfMonth = new Date(base.getFullYear(), base.getMonth(), 1);
  const js = firstOfMonth.getDay();           // 0..6 (Sun..Sat)
  const monIdx = (js + 6) % 7;                // Mon=0..Sun=6

  // start of 6-week grid
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - monIdx);

  const days: { date: Date; ymd: string; inMonth: boolean }[] = [];
  const cur = new Date(gridStart);
  for (let i = 0; i < 42; i++) {
    const d = new Date(cur);
    days.push({ date: d, ymd: ymd(d), inMonth: d.getMonth() === base.getMonth() });
    cur.setDate(cur.getDate() + 1);
  }

  // inclusive upper bound = last cell
  const lastCell = new Date(gridStart);
  lastCell.setDate(gridStart.getDate() + 41);

  return {
    days,
    fromISO: localFloorISO(gridStart),
    toISO:   localFloorISO(lastCell), // inclusive
  };
}

export default function CalendarHeatmap({
  programId,
  assignmentId,
  month,           // optional yyyy-mm
  events,          // 👈 if provided, we use these instead of fetching
}: {
  programId: string | 'all';
  assignmentId?: string;
  month?: string;
  events?: CalEvent[];
}) {
  const router = useRouter();
  const [cells, setCells] = useState<DayCell[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // which month to render (defaults to current)
  const baseDate = useMemo(() => {
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yy, mm] = month.split('-').map(Number);
      return new Date(yy, (mm || 1) - 1, 1);
    }
    return new Date();
  }, [month]);

  const { days, fromISO, toISO } = useMemo(() => buildMonthGrid(baseDate), [baseDate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const now = new Date();

        // 1) choose source events
        let source: CalEvent[] = [];
        if (Array.isArray(events)) {
          // filter to the grid window (inclusive)
          const from = new Date(fromISO);
          const to   = new Date(toISO);
          source = events.filter(e => {
            const st = new Date(e.start);
            return st >= from && st <= to;
          });
        } else {
          // fallback: fetch from API
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
          source = Array.isArray(json?.events) ? json.events : [];
        }

        // 2) build cells
        const map = new Map<string, DayCell>();
        for (const d of days) {
          map.set(d.ymd, { date: d.date, ymd: d.ymd, inMonth: d.inMonth, status: 'none', events: [] });
        }

        for (const e of source) {
          const st = new Date(e.start);
          const en = new Date(e.end || e.start);
          const key = ymd(st);
          if (!map.has(key)) continue;
          const cell = map.get(key)!;
          cell.events.push(e);

          let s: Status = 'planned';
          if (e.status === 'completed') s = 'completed';
          else if (e.status === 'missed') s = 'missed';
          else if (en < now) s = 'missed';
          cell.status = statusMerge(cell.status, s);
        }

        const out = days.map((d) => map.get(d.ymd)!);
        if (!cancelled) setCells(out);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [events, API, programId, assignmentId, fromISO, toISO, days]);

  // hover/click dialog
  const [openDay, setOpenDay] = useState<DayCell | null>(null);
  const [hoverDay, setHoverDay] = useState<DayCell | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  const handleEnter = (cell: DayCell, ev: React.MouseEvent) => {
    setHoverDay(cell);
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverPos({ x: r.left + r.width / 2, y: r.top });
  };
  const handleLeave = () => { setHoverDay(null); setPopoverPos(null); };

  const statusColor = (s: Status) =>
    s === 'completed' ? 'bg-green-500'
    : s === 'missed'   ? 'bg-amber-500'
    : s === 'planned'  ? 'bg-sky-400'
    :                    'bg-zinc-300 dark:bg-zinc-700';

  const wk = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

  return (
    <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">
          {baseDate.getFullYear()} / {pad(baseDate.getMonth() + 1)}
        </h3>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-500 inline-block" /> Tamamlandı</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-500 inline-block" /> Kaçırıldı</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-sky-400 inline-block" /> Planlı</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-zinc-300 dark:bg-zinc-700 inline-block" /> Boş</span>
        </div>
      </div>

      <div className="grid grid-cols-7 text-[11px] text-zinc-500 mb-1 px-1">
        {wk.map((w) => <div key={w} className="text-center">{w}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => (
          <button
            key={`${c.ymd}-${i}`}
            onClick={() => setOpenDay(c)}
            onMouseEnter={(ev) => handleEnter(c, ev)}
            onMouseLeave={handleLeave}
            title={c.ymd}
            className={[
              'relative h-8 w-8 rounded-md flex items-center justify-center',
              statusColor(c.status),
              c.inMonth ? '' : 'opacity-40',
              'focus:outline-none focus:ring-2 focus:ring-offset-1'
            ].join(' ')}
            aria-label={`${c.ymd} ${c.status}`}
          >
            <span className="absolute -top-1 -left-1 text-[10px] px-0.5 rounded bg-white/80 dark:bg-black/30 text-zinc-700 dark:text-zinc-200">
              {c.date.getDate()}
            </span>
          </button>
        ))}
      </div>

      {hoverDay && popoverPos && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-xl border bg-white dark:bg-zinc-900 shadow p-3 text-xs w-64"
          style={{
            left: Math.max(120, Math.min((typeof window !== 'undefined' ? window.innerWidth : 9999) - 120, popoverPos.x)),
            top: popoverPos.y - 8
          }}
        >
          <div className="font-medium mb-1">{hoverDay.ymd}</div>
          {hoverDay.events.length === 0 ? (
            <div className="text-zinc-500">Etkinlik yok.</div>
          ) : (
            <ul className="space-y-1">
              {hoverDay.events.map((e, idx) => (
                <li key={e._id || idx} className="flex items-start justify-between gap-2">
                  <div className="text-zinc-800 dark:text-zinc-200">
                    {e.title || 'Seans'}
                  </div>
                  <span className={[
                    'px-1.5 py-0.5 rounded text-[10px]',
                    e.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : new Date(e.end || e.start) < new Date() ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                  ].join(' ')}>
                    {e.status === 'completed' ? 'Tamamlandı' : (new Date(e.end || e.start) < new Date() ? 'Kaçırıldı' : 'Planlı')}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2">
            <a href={`/takvim?date=${encodeURIComponent(hoverDay.ymd)}`} className="underline text-zinc-600 dark:text-zinc-300">
              Günü aç →
            </a>
          </div>
        </div>
      )}

      {openDay && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-2"
          onClick={() => setOpenDay(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-white dark:bg-zinc-900 shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{openDay.ymd}</div>
              <button onClick={() => setOpenDay(null)} className="text-sm px-2 py-1 rounded border">Kapat</button>
            </div>
            {openDay.events.length === 0 ? (
              <div className="text-sm text-zinc-500">Etkinlik yok.</div>
            ) : (
              <ul className="space-y-2">
                {openDay.events.map((e, idx) => (
                  <li key={e._id || idx} className="rounded border p-2">
                    <div className="text-sm font-medium">{e.title || 'Seans'}</div>
                    <div className="text-[12px] text-zinc-500">
                      {new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(e.end || e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="mt-1 text-[11px]">
                      <span className={[
                        'px-1.5 py-0.5 rounded',
                        e.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : new Date(e.end || e.start) < new Date() ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                      ].join(' ')}>
                        {e.status === 'completed' ? 'Tamamlandı' : (new Date(e.end || e.start) < new Date() ? 'Kaçırıldı' : 'Planlı')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 text-right">
              <a
                href={`/takvim?date=${encodeURIComponent(openDay.ymd)}`}
                className="text-sm px-3 py-1.5 rounded-lg border inline-block"
              >
                Günü aç
              </a>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="mt-2 text-sm text-zinc-500">Yükleniyor…</div>}
      {err && <div className="mt-2 text-sm text-red-600">Hata: {String(err)}</div>}
    </div>
  );
}
