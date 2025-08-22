// src/app/dashboard/user/koclarimiz/[coachId]/ClientBridge.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import CoachProfileClient, { Coach, Program, Review } from "@/components/CoachProfileClient";

type Props = {
  coach: Coach & { isFollowing?: boolean };
  programs: Program[];
  reviews: Review[]; // array from /coaches/:id/reviews or /me/coaches/:id
};

type Follower = { id: string; name: string };

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";
  return raw.replace(/\/+$/, "");
}

// read token from localStorage and normalize (handles accidental quotes)
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

export default function ClientBridge({ coach, programs, reviews }: Props) {
  const API = useMemo(apiBase, []);
  const [isFollowing, setIsFollowing] = useState<boolean>(!!coach.isFollowing);
  const [checkingFollow, setCheckingFollow] = useState<boolean>(false);

  // followers
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [followerCount, setFollowerCount] = useState<number | undefined>(
    (coach as any)?.followerCount
  );

  // CSR follow status check (authoritative, uses localStorage token)
  useEffect(() => {
    const token = cleanToken();
    if (!token) return;
    setCheckingFollow(true);
    fetch(`${API}/coaches/${coach.id}/follow`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`GET follow failed: ${r.status}`);
        const j = (await r.json().catch(() => ({}))) as { isFollowing?: boolean };
        if (typeof j.isFollowing === "boolean") setIsFollowing(j.isFollowing);
      })
      .catch(() => {})
      .finally(() => setCheckingFollow(false));
  }, [API, coach.id]);

  // Load followers list (private first, then public)
  useEffect(() => {
    let aborted = false;
    (async () => {
      const token = cleanToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const urls = token
        ? [`${API}/me/coaches/${coach.id}/followers?limit=24`, `${API}/coaches/${coach.id}/followers?limit=24`]
        : [`${API}/coaches/${coach.id}/followers?limit=24`];

      for (const url of urls) {
        try {
          const r = await fetch(url, { cache: "no-store", headers });
          if (!r.ok) continue;
          const j = await r.json().catch(() => ({} as any));
          if (aborted) return;

          const items = Array.isArray(j.items) ? j.items : [];
          const parsed: Follower[] = (items as any[])
            .map((u: any): Follower => ({
              id: String(u?.id ?? u?._id ?? ""),
              name: typeof u?.name === "string" ? u.name : "Kullanıcı",
            }))
            .filter((x: Follower) => !!x.id); // <-- typed param fixes TS7006

          setFollowers(parsed);

          if (typeof j.total === "number") setFollowerCount(j.total);
          else if (typeof (j as any).count === "number") setFollowerCount((j as any).count);
          else if (typeof followerCount !== "number") setFollowerCount(parsed.length);

          return; // success
        } catch {
          // try next url
        }
      }
    })();
    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API, coach.id]);

  const handleFollowToggle = async (next: boolean) => {
    const token = cleanToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const method = next ? "PUT" : "DELETE";
    const res = await fetch(`${API}/coaches/${coach.id}/follow`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok && res.status !== 204) {
      const text = await res.text().catch(() => "");
      throw new Error(`Follow toggle failed: ${res.status} ${text}`);
    }
    setIsFollowing(next);
    setFollowerCount((prev) => (typeof prev === "number" ? Math.max(0, prev + (next ? 1 : -1)) : prev));
  };

  return (
    <CoachProfileClient
  coach={coach}
  programs={programs}
  reviews={reviews}
  locale="tr"
  isFollowing={isFollowing}
  loading={checkingFollow && typeof coach.isFollowing === "undefined"}
  onFollowToggle={handleFollowToggle}
  onMessage={(id) => { window.location.href = `/messages?to=${id}`; }}
  followers={followers}
  followerCount={typeof followerCount === "number" ? followerCount : followers.length}
/>

  );
}
