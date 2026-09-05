"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Follower = { id: string; name: string; avatarUrl?: string };

type Props = {
  coachId: string;
  /** Optional visible count before fetching. */
  initialCount?: number;
  /** TR by default; supports "en" */
  locale?: "tr" | "en";
  /** Extra classes for trigger */
  className?: string;
  /** If true, prefetch count on mount/coachId change (default: true) */
  prefetch?: boolean;
};

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "";
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

const STR = {
  tr: {
    followers: "Takipçiler",
    followersLower: "takipçi",
    noFollowers: "Henüz takipçi yok.",
    close: "Kapat",
    loadErr: "Yüklenemedi",
  },
  en: {
    followers: "Followers",
    followersLower: "followers",
    noFollowers: "No followers yet.",
    close: "Close",
    loadErr: "Failed to load",
  },
} as const;

export default function FollowersDialog({
  coachId,
  initialCount,
  locale = "tr",
  className,
  prefetch = true,
}: Props) {
  const API = useMemo(apiBase, []);
  const t = STR[locale] ?? STR.tr;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false); // list loading
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [count, setCount] = useState<number | undefined>(initialCount);
  const [error, setError] = useState<string | null>(null);

  // keep count in sync if parent updates initialCount
  useEffect(() => {
    if (typeof initialCount === "number") setCount(initialCount);
  }, [initialCount]);

   // 🔹 PREFETCH COUNT (on mount / coachId change)
useEffect(() => {
  if (!coachId) return;

  let aborted = false;
  (async () => {
    try {
      const token = cleanToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };

      // Use the SAME endpoint shape as the open-fetch (some backends only send totals on paginated list)
      const urls = token
        ? [
            `${API}/me/coaches/${coachId}/followers?limit=50`,
            `${API}/coaches/${coachId}/followers?limit=50`,
          ]
        : [`${API}/coaches/${coachId}/followers?limit=50`];

      for (const url of urls) {
        try {
          const r = await fetch(url, {
            headers,
            cache: "no-store",
            credentials: "omit",
            mode: "cors",
          });
          if (!r.ok) continue;

          // Try total from headers (common patterns)
          const hTotal =
            r.headers.get("x-total-count") ||
            r.headers.get("x-total") ||
            // e.g. "items 0-49/123"
            (r.headers.get("content-range")?.split("/")?.[1] ?? "");

          const j = await r.json().catch(() => ({}));
          if (aborted) return;

          const bodyTotal =
            (typeof j.total === "number" && j.total) ||
            (typeof j.count === "number" && j.count) ||
            (typeof j.totalCount === "number" && j.totalCount) ||
            (typeof j.meta?.total === "number" && j.meta.total) ||
            undefined;

          const rawItems =
            (Array.isArray(j.items) && j.items) ||
            (Array.isArray(j.followers) && j.followers) ||
            (Array.isArray(j.rows) && j.rows) ||
            (Array.isArray(j.data) && j.data) ||
            [];

          // Prefer explicit totals → else at least show what we got
          const inferred = Number(hTotal) || bodyTotal || rawItems.length;

          // Don’t drop an existing non-zero count
          setCount((prev) => (typeof prev === "number" ? Math.max(prev, inferred) : inferred));
          return; // success, stop trying next URL
        } catch {
          // try next
        }
      }
    } catch {
      // swallow; we'll keep whatever we had
    }
  })();

  return () => {
    aborted = true;
  };
}, [API, coachId]);


  // 🔸 Fetch full list on first open
  useEffect(() => {
    if (!open) return;
    if (followers.length > 0) return; // already loaded once

    let aborted = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = cleanToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" };

        const urls = token
          ? [
              `${API}/me/coaches/${coachId}/followers?limit=50`,
              `${API}/coaches/${coachId}/followers?limit=50`,
            ]
          : [`${API}/coaches/${coachId}/followers?limit=50`];

        let ok = false;
        for (const url of urls) {
          try {
            const r = await fetch(url, {
              headers,
              cache: "no-store",
              credentials: "omit",
              mode: "cors",
            });
            if (!r.ok) continue;

            const j = await r.json().catch(() => ({}));
            if (aborted) return;

            const rawItems =
              (Array.isArray(j.items) && j.items) ||
              (Array.isArray(j.followers) && j.followers) ||
              (Array.isArray(j.rows) && j.rows) ||
              (Array.isArray(j.data) && j.data) ||
              [];

            const mapped: Follower[] = rawItems
              .map((u: any) => {
                const user = u.user || u.userId || u;
                const id = String(user?.id || user?._id || u?.id || u?._id || "");
                const name = String(user?.name || u?.name || "Kullanıcı");
                const avatarUrl =
                  user?.avatarUrl || user?.avatar || user?.profilePicture || u?.avatarUrl || "";
                return { id, name, avatarUrl };
              })
              .filter((x: Follower) => x.id);

            setFollowers(mapped);

            const total =
              (typeof j.total === "number" && j.total) ||
              (typeof j.count === "number" && j.count) ||
              (typeof j.totalCount === "number" && j.totalCount) ||
              undefined;

            // prefer server-provided total; else fall back to mapped length
            setCount(typeof total === "number" ? total : mapped.length);
            ok = true;
            break;
          } catch {
            // try next
          }
        }

        if (!ok) {
          setFollowers([]);
          // don't zero-out count if we already have one from prefetch/prop
          if (typeof count !== "number") setCount(0);
        }
      } catch (e: any) {
        if (!aborted) setError(e?.message || t.loadErr);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, API, coachId]);

  const computedCount = typeof count === "number" ? count : followers.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            className ??
            "inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:underline"
          }
          aria-label={t.followers}
        >
          <Users className="h-4 w-4" />
          {computedCount} {t.followersLower}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md" aria-describedby="followers-desc">
        <DialogHeader>
          <DialogTitle>{t.followers}</DialogTitle>
          <DialogDescription id="followers-desc">
            {locale === "tr"
              ? "Bu koçu takip eden kullanıcıların listesi."
              : "People who follow this coach."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : followers.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">{t.noFollowers}</p>
        ) : (
          <ul className="mt-2 divide-y max-h-[60vh] overflow-y-auto">
            {followers.map((f) => (
              <li key={f.id} className="py-3 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  {f.avatarUrl ? (
                    <AvatarImage
                      src={f.avatarUrl}
                      alt={f.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/user.png";
                      }}
                    />
                  ) : null}
                  <AvatarFallback>{initials(f.name)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">{f.name}</div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex justify-end">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function initials(name?: string) {
  if (!name) return "K";
  const parts = name.trim().split(/\s+/);
  const two = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return (two || parts[0]?.[0] || "K").toUpperCase();
}
