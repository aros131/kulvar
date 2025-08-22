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

export default function FollowersDialog({ coachId, initialCount, locale = "tr", className }: Props) {
  const API = useMemo(apiBase, []);
  const t = STR[locale] ?? STR.tr;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [count, setCount] = useState<number | undefined>(initialCount);
  const [error, setError] = useState<string | null>(null);

  // fetch on first open
  useEffect(() => {
    if (!open) return;
    if (followers.length > 0) return; // already loaded

    let aborted = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = cleanToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" };

        // Try /me first if token exists, then public /coaches
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
              credentials: "omit", // CORS-friendly with Bearer
              mode: "cors",
            });
            if (!r.ok) continue;

            const j = await r.json().catch(() => ({}));
            if (aborted) return;

            // Accept several possible shapes
            const rawItems =
              (Array.isArray(j.items) && j.items) ||
              (Array.isArray(j.followers) && j.followers) ||
              (Array.isArray(j.rows) && j.rows) ||
              (Array.isArray(j.data) && j.data) ||
              [];

            const mapped: Follower[] = rawItems
              .map((u: any) => {
                // support nested user objects (e.g., Follow doc with userId populated)
                const user = u.user || u.userId || u;
                const id = String(user?.id || user?._id || u?.id || u?._id || "");
                const name = String(user?.name || u?.name || "Kullanıcı");
                const avatarUrl =
                  user?.avatarUrl || user?.avatar || user?.profilePicture || u?.avatarUrl || "";
                return { id, name, avatarUrl };
              })
              .filter((x: Follower) => x.id);

            setFollowers(mapped);
            // count: prefer explicit total; else count; else length
            const total =
              (typeof j.total === "number" && j.total) ||
              (typeof j.count === "number" && j.count) ||
              (typeof j.totalCount === "number" && j.totalCount) ||
              undefined;
            setCount(typeof total === "number" ? total : mapped.length);
            ok = true;
            break;
          } catch {
            // try next URL
          }
        }

        if (!ok) {
          setFollowers([]);
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
          {loading ? "…" : computedCount} {t.followersLower}
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
