// hooks/useProgramProgress.ts
import { useEffect, useState } from "react";

type ProgressState = {
  loading: boolean;
  error: string | null;
  completed: number;
  total: number;
  percent: number;
};

export function useProgramProgress(programId?: string): ProgressState {
  const [state, setState] = useState<ProgressState>({
    loading: true,
    error: null,
    completed: 0,
    total: 0,
    percent: 0,
  });

  useEffect(() => {
    if (!programId) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/progress/user/${programId}`, {
      headers: { Authorization: `Bearer ${token ?? ""}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        const completed = Number(d.completedSessions ?? 0);
        const total = Number(d.totalSessions ?? 0);
        const percent =
          d.progressPercentage != null
            ? Math.round(parseFloat(d.progressPercentage))
            : Math.round((completed / Math.max(1, total)) * 100);

        setState({ loading: false, error: null, completed, total, percent });
      })
      .catch((e) => setState((s) => ({ ...s, loading: false, error: e.message })));
  }, [programId]);

  return state;
}
