"use client";

import { useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

type ProgressResp = {
  progressPercentage?: number;
  completedSessions?: { sessionId: string }[];
  totalSessions?: number;
};

export function useProgramProgress(programId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal]     = useState(0);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${API}/progress/user/${programId}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          cache: "no-store",
        });

        if (res.status === 404) { // veri yok → 0
          if (!cancelled) { setCompleted(0); setTotal(0); setPercent(0); }
          return;
        }
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Progress ${res.status}: ${body.slice(0,160)}…`);
        }

        const data = (await res.json()) as ProgressResp;
        const comp = Array.isArray(data.completedSessions) ? data.completedSessions.length : 0;
        const tot  = Number(data.totalSessions || 0);
        const pct  = typeof data.progressPercentage === "number"
          ? Math.max(0, Math.min(100, Math.round(data.progressPercentage)))
          : (tot > 0 ? Math.round((comp / tot) * 100) : 0);

        if (!cancelled) {
          setCompleted(comp);
          setTotal(tot);
          setPercent(pct);
        }
      } catch (e: any) {
        if (!cancelled) { setError(e?.message || String(e)); setCompleted(0); setTotal(0); setPercent(0); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [programId]);

  return { loading, error, completed, total, percent };
}
