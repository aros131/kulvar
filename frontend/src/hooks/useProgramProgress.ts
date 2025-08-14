"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/api";

type ProgressResp = {
  progressPercentage?: number;
  completedSessions?: { sessionId: string }[];
  totalSessions?: number;
};

export function useProgramProgress(programId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const data = await fetchJSON<ProgressResp>(`progress/user/${programId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });

        if (cancelled) return;

        const comp = Array.isArray(data.completedSessions) ? data.completedSessions.length : 0;
        const tot = Number(data.totalSessions || 0);
        const pct = typeof data.progressPercentage === "number"
          ? Math.max(0, Math.min(100, Math.round(data.progressPercentage)))
          : tot > 0 ? Math.round((comp / tot) * 100) : 0;

        setCompleted(comp);
        setTotal(tot);
        setPercent(pct);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        // Graceful fallback
        setCompleted(0);
        setTotal(0);
        setPercent(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [programId]);

  return { loading, error, completed, total, percent };
}
