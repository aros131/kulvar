// src/hooks/useCoachReviews.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string; // ISO
  comment: string;
  keywords?: string[];
  verified?: boolean;
};

type Options = {
  pageSize?: number;          // default 8
  initial?: Review[];         // optional SSR/prop seed
};

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";
  return raw.replace(/\/+$/, "");
}

const cleanToken = (): string | null => {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const trimmed = raw.replace(/^"+|"+$/g, "").trim();
    return trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
  } catch {
    return null;
  }
};

export function useCoachReviews(coachId?: string, opts: Options = {}) {
  const API = useMemo(apiBase, []);
  const pageSize = opts.pageSize ?? 8;

  const [reviews, setReviews] = useState<Review[]>(() => opts.initial ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [average, setAverage] = useState<number | null>(null);

  // pagination supports both cursor and offset styles
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // avoid duplicate page fetches
  const fetchingRef = useRef(false);

  const parseArray = (j: any): any[] =>
    (Array.isArray(j.items) && j.items) ||
    (Array.isArray(j.reviews) && j.reviews) ||
    (Array.isArray(j.rows) && j.rows) ||
    (Array.isArray(j.data) && j.data) ||
    [];

  const parseTotal = (j: any): number | undefined =>
    (typeof j.total === "number" && j.total) ||
    (typeof j.count === "number" && j.count) ||
    (typeof j.totalCount === "number" && j.totalCount) ||
    (typeof j.meta?.total === "number" && j.meta.total) ||
    undefined;

  const parseNext = (j: any): string | null =>
    j.nextCursor || j.cursor?.next || j.next || null;

  const mapReview = (r: any): Review | null => {
    const src = r.review || r; // support nested {review: {...}}
    const id = String(src.id || src._id || "");
    if (!id) return null;
    const author =
      String(src.author?.name || src.author || src.user?.name || src.user || "Kullanıcı");
    const ratingRaw = src.rating ?? src.stars ?? src.score;
    const rating = typeof ratingRaw === "number" ? ratingRaw : parseFloat(ratingRaw);
    const date = String(src.date || src.createdAt || src.updatedAt || new Date().toISOString());
    const comment = String(src.comment || src.text || src.content || "");
    const keywords = Array.isArray(src.keywords) ? src.keywords : [];
    const verified = Boolean(src.verified || src.isVerified || src.badges?.includes?.("verified"));
    return { id, author, rating: Number.isFinite(rating) ? rating : 0, date, comment, keywords, verified };
  };

  async function fetchPage(initial = false) {
    if (!coachId) return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setLoading(true);
    setError(null);

    const token = cleanToken();
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };

    // Try a few likely endpoints; first that works wins
    const params = new URLSearchParams();
    params.set("limit", String(pageSize));
    if (cursor) params.set("cursor", cursor);
    else params.set("skip", String(initial ? 0 : reviews.length)); // offset fallback

    const urls = token
      ? [
          `${API}/me/coaches/${coachId}/reviews?${params.toString()}`,
          `${API}/coaches/${coachId}/reviews?${params.toString()}`,
          `${API}/feedback?coachId=${coachId}&${params.toString()}`,
        ]
      : [
          `${API}/coaches/${coachId}/reviews?${params.toString()}`,
          `${API}/feedback?coachId=${coachId}&${params.toString()}`,
        ];

    try {
      let ok = false;
      for (const url of urls) {
        try {
          const res = await fetch(url, {
            headers,
            cache: "no-store",
            credentials: "omit",
            mode: "cors",
          });
          if (!res.ok) continue;

          const j = await res.json().catch(() => ({}));
          const arr = parseArray(j).map(mapReview).filter(Boolean) as Review[];

          // Merge uniquely by id
          setReviews((prev) => {
            const map = new Map(prev.map((x) => [x.id, x]));
            for (const item of arr) map.set(item.id, item);
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
          });

          // totals & next
          const tot =
            parseTotal(j) ||
            Number(res.headers.get("x-total-count")) ||
            Number(res.headers.get("x-total")) ||
            (() => {
              // fallback: if server doesn't expose totals, infer "maybe more" by pageSize
              return undefined;
            })();

          if (typeof tot === "number") setTotalCount(tot);

          const next = parseNext(j);
          setCursor(next ?? null);

          // hasMore:
          if (next != null) setHasMore(true);
          else if (typeof tot === "number") setHasMore((prev) => (prev ? reviews.length + arr.length < tot : false));
          else setHasMore(arr.length === pageSize); // naive guess

          ok = true;
          break;
        } catch {
          // try next URL
        }
      }
      if (!ok) {
        if (!initial) setHasMore(false);
        if (reviews.length === 0) setError("Yorumlar yüklenemedi");
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
      // compute average whenever reviews change
      setAverage((prev) => {
        const list = reviews.length ? reviews : opts.initial ?? [];
        const arr = list.length ? list : [];
        if (!arr.length) return null;
        const sum = arr.reduce((s, r) => s + (Number.isFinite(r.rating) ? r.rating : 0), 0);
        return Math.round((sum / arr.length) * 10) / 10;
      });
    }
  }

  // first page on mount / id change
  useEffect(() => {
    setReviews(opts.initial ?? []);
    setCursor(null);
    setHasMore(true);
    setTotalCount(null);
    setAverage(null);
    if (coachId) fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachId]);

  const loadMore = () => fetchPage(false);

  return { reviews, loading, error, loadMore, hasMore, totalCount, average };
}
