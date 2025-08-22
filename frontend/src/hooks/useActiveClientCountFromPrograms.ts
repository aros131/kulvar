// src/hooks/useActiveClientCountFromPrograms.ts
"use client";

import { useEffect, useMemo, useState } from "react";

type MinimalProgram = { id?: string; _id?: string };
type Client = { _id?: string; id?: string; email?: string; name?: string };

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

export function useActiveClientCountFromPrograms(programs: MinimalProgram[] | undefined) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // only keep non-empty ids to fetch
  const programIds = useMemo(
    () =>
      (programs ?? [])
        .map((p) => p?.id || p?._id)
        .filter((x): x is string => Boolean(x)),
    [programs]
  );

  useEffect(() => {
    if (!programIds.length) {
      setCount(0);
      return;
    }

    const abort = new AbortController();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        // Fetch all program details in parallel; ignore failures for individual programs
        const results = await Promise.allSettled(
          programIds.map(async (pid) => {
            const res = await fetch(`${API}/programs/${pid}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              signal: abort.signal,
              credentials: "include",
            });
            if (!res.ok) throw new Error(`program ${pid} HTTP ${res.status}`);
            const data = await res.json();
            const list: Client[] = data?.program?.assignedClients ?? [];
            return list.map((c) => (c?._id || c?.id || "").toString()).filter(Boolean);
          })
        );

        const uniq = new Set<string>();
        for (const r of results) {
          if (r.status === "fulfilled") {
            for (const cid of r.value) uniq.add(cid);
          }
        }
        setCount(uniq.size);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e as Error);
        setCount(null);
      } finally {
        setLoading(false);
      }
    }

    run();
    return () => abort.abort();
  }, [API, programIds.join("|")]); // stable dep: ids change triggers refetch

  return { count, loading, error };
}
