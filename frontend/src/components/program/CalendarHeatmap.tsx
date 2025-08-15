// src/components/program/CalendarHeatmap.tsx
"use client";
import { useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/,"");

type Day = { date: string; status: "completed" | "missed" | "none" };

function token() {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("token");
  return t ? t.replace(/^"+|"+$/g, "").replace(/^Bearer\s+/i, "") : null;
}

export default function CalendarHeatmap({ programId }: { programId: string }) {
  const [days, setDays] = useState<Day[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const t = token();
        const res = await fetch(`${API}/progress/calendar/${programId}`, {
          headers: {
            Accept: "application/json",
            ...(t ? { Authorization: `Bearer ${t}` } : {}),
          },
          cache: "no-store",
          credentials: "include",
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        const json = ct.includes("application/json") ? JSON.parse(text) : {};
        const list = Array.isArray(json?.days) ? (json.days as Day[]) : [];
        if (!cancelled) setDays(list);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [programId]);

  return (
    <div className="rounded-xl border p-4 bg-white dark:bg-zinc-900">
      <h3 className="font-medium mb-2">Son 30 Gün</h3>
      {loading && <div className="text-sm text-zinc-500">Yükleniyor…</div>}
      {err && <div className="text-sm text-red-600">Hata: {String(err)}</div>}
      {!loading && !err && (
        <div className="grid grid-cols-10 gap-1">
          {days.map((d, i) => {
            const status = d?.status || "none";
            // only render strings/booleans/numbers as children; avoid objects
            return (
              <div
                key={`${d?.date ?? i}`}
                title={`${String(d?.date ?? "")} - ${status}`}
                className={[
                  "h-4 w-4 rounded",
                  status === "completed" ? "bg-green-500" :
                  status === "missed"    ? "bg-amber-500" :
                                           "bg-zinc-300 dark:bg-zinc-700"
                ].join(" ")}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
