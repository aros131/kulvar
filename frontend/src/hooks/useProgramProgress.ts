"use client";

import { useEffect, useState } from "react";
import { tryCandidatesJSON } from "@/lib/api";

type ProgressResp = {
  progressPercentage?: number;
  completedSessions?: { sessionId: string }[];
  totalSessions?: number;
};

export function useProgramProgress(programId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal]   = useState(0);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        // Common shapes WITHOUT /api prefix
        const candidates = [
          `progress/user/${programId}`,
          `user/progress/${programId}`,
          `users/me/progress/${programId}`,
          `users/me/programs/${programId}/progress`,
          `progress/${programId}`,
          `programs/${programId}/progress`,
        ];

        const { data } = await tryCandidatesJSON<ProgressResp>(candidates, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          cache: "no-store",
        });

        if (cancelled) return;

        const comp = Array.isArray(data?.completedSessions) ? data!.completedSessions.length : 0;
        const tot  = Number(data?.totalSessions || 0);
        const pct  = typeof data?.progressPercentage === "number"
          ? Math.max(0, Math.min(100, Math.round(data!.progressPercentage!)))
          : tot > 0 ? Math.round((comp / tot) * 100) : 0;

        setCompleted(comp);
        setTotal(tot);
        setPercent(pct);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
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
