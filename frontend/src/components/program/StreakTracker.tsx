// src/components/program/StreakTracker.tsx
"use client";
import { useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/,"");

function sanitizeToken(raw: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/^"+|"+$/g, "").replace(/^Bearer\s+/i, "");
}

function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return payload.id || payload.userId || payload._id || payload.sub || null;
  } catch { return null; }
}

type Streak = { currentStreak: number; longestStreak: number };
type HeatItem = { date: string; count: number };

// util: YYYY-MM-DD
const ymd = (d: Date) => {
  const z = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
};

function calcStreaksFromCalendar(items: HeatItem[]): Streak {
  // consider days with count > 0 as “completed”
  const completed = new Set(
    (items ?? [])
      .filter(x => x && typeof x.date === "string" && Number(x.count) > 0)
      .map(x => x.date.slice(0,10))
  );

  // current streak: from today backwards until a gap
  let current = 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  const d = new Date(today);
  while (completed.has(ymd(d))) {
    current++;
    d.setDate(d.getDate() - 1);
  }

  // longest streak: walk the calendar quickly
  const all = Array.from(completed).sort(); // ascending
  let longest = 0, run = 0;
  let prev: string | null = null;
  for (const dateStr of all) {
    if (prev) {
      // is dateStr exactly one day after prev?
      const p = new Date(prev); p.setDate(p.getDate() + 1);
      if (ymd(p) === dateStr) {
        run += 1;
      } else {
        run = 1;
      }
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = dateStr;
  }

  return { currentStreak: current, longestStreak: longest };
}

export default function StreakTracker({ programId }: { programId: string }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);

      const raw = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const token = sanitizeToken(raw);
      const userId = getUserIdFromToken(token);

      if (!userId) { setErr("Giriş yapın: token yok/geçersiz."); setLoading(false); return; }

      const commonInit: RequestInit = {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        mode: "cors",
        cache: "no-store",
      };

      try {
        // 1) try native streak endpoint (by userId)
        const res = await fetch(`${API}/progress/streaks/${userId}`, { ...commonInit, method: "GET" });
        if (res.ok) {
          // ensure JSON
          const ct = (res.headers.get("content-type") || "").toLowerCase();
          if (ct.includes("application/json")) {
            const data = (await res.json()) as Streak;
            if (!cancelled) { setStreak(data); setLoading(false); return; }
          } else {
            throw new Error("Streak endpoint returned non-JSON");
          }
        } else {
          // if 4xx/5xx, fall back
          // (optional) read error text for debugging:
          // const txt = await res.text(); console.warn("streak error", res.status, txt);
        }

        // 2) fallback: use calendar endpoint (by programId) and compute streaks
        const cal = await fetch(`${API}/progress/calendar/${programId}`, { ...commonInit, method: "GET" });
        if (!cal.ok) {
          throw new Error(`Calendar ${cal.status}: ${await cal.text()}`);
        }
        const ct2 = (cal.headers.get("content-type") || "").toLowerCase();
        if (!ct2.includes("application/json")) throw new Error("Calendar returned non-JSON");
        const items = (await cal.json()) as HeatItem[];

        const computed = calcStreaksFromCalendar(Array.isArray(items) ? items : []);
        if (!cancelled) setStreak(computed);
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
