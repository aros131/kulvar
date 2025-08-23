// src/hooks/useActiveClientCountFromPrograms.ts
"use client";

import { useEffect, useMemo, useState } from "react";

type ProgramLite = { id?: string; _id?: string };

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";
  return raw.replace(/\/+$/, "");
}

export function useActiveClientCountFromPrograms(
  programs: ProgramLite[] = [],
  coachId?: string
) {
  const API = useMemo(apiBase, []);
  const [count, setCount] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let aborted = false;

    (async () => {
      setLoading(true);
      try {
        // 1) Try public coach aggregate
        if (coachId) {
          try {
            const r = await fetch(`${API}/coaches/${coachId}/active-clients`, {
              cache: "no-store",
              credentials: "omit",
              mode: "cors",
            });
            if (r.ok) {
              const j = await r.json().catch(() => ({}));
              if (!aborted && typeof j.count === "number") {
                setCount(j.count);
                return;
              }
            }
          } catch {
            // fall through
          }
        }

        // 2) Fallback: sum unique across each program (public)
        const ids = Array.from(
          new Set(
            programs
              .map((p) => String(p.id ?? p._id ?? ""))
              .filter((x) => x && x !== "undefined")
          )
        );

        if (ids.length === 0) {
          if (!aborted) setCount(0);
          return;
        }

        const results = await Promise.allSettled(
          ids.map(async (pid) => {
            // Prefer the public count endpoint if you added it
            const tryPublic = async () => {
              const r1 = await fetch(`${API}/programs/${pid}/assigned-count`, {
                cache: "no-store",
                credentials: "omit",
                mode: "cors",
              });
              if (r1.ok) {
                const j = await r1.json().catch(() => ({}));
                if (typeof j.count === "number") return { ids: new Set<string>(), count: j.count, raw: null };
              }
              return null;
            };

            const viaCount = await tryPublic();
            if (viaCount) return viaCount;

            // Last resort: read full program and derive unique client ids
            const r = await fetch(`${API}/programs/${pid}`, {
              cache: "no-store",
              credentials: "omit",
              mode: "cors",
            });
            if (!r.ok) throw new Error("program fetch failed");
            const j = await r.json();

            const arr: any[] =
              j?.program?.assignedClients ??
              j?.assignedClients ??
              [];

            const set = new Set<string>(
              arr
                .map((c: any) => String(c?._id ?? c?.id ?? c))
                .filter((s: string) => !!s && s !== "undefined")
            );
            return { ids: set, count: set.size, raw: arr };
          })
        );

        // Merge unique ids if we had to read full program docs
        const mergedIds = new Set<string>();
        let fastSum = 0;

        for (const item of results) {
          if (item.status !== "fulfilled" || !item.value) continue;
          if (item.value.ids && item.value.ids.size) {
            item.value.ids.forEach((x: string) => mergedIds.add(x));
          } else if (typeof item.value.count === "number") {
            // from /assigned-count — can’t dedupe, but better than nothing
            fastSum += item.value.count;
          }
        }

        const final =
          mergedIds.size > 0
            ? mergedIds.size
            : fastSum; // if only per-program counts were available

        if (!aborted) setCount(final);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [API, programs, coachId]);

  return { count, loading };
}
