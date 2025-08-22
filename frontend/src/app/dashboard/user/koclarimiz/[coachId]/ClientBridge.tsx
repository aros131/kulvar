"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CoachProfileClient, { Coach, Program, Review } from "@/components/CoachProfileClient";

type Props = {
  coach: Coach & { id: string; isFollowing?: boolean };
  programs: Program[];
  reviews: Review[]; // array
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

export default function ClientBridge({ coach, programs, reviews }: Props) {
  const router = useRouter();
  const API = apiBase();

  const [isFollowing, setIsFollowing] = useState<boolean>(!!coach.isFollowing);

  // If SSR didn’t include follow state (e.g., no cookie), fetch it client-side with localStorage token
  useEffect(() => {
    let mounted = true;
    const token = cleanToken();
    if (!token) return;
    // Only fetch if SSR didn’t already set it
    if (typeof coach.isFollowing === "boolean") return;

    (async () => {
      try {
        const r = await fetch(`${API}/coaches/${coach.id}/follow`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!mounted) return;
        if (r.ok) {
          const j = await r.json().catch(() => ({}));
          if (typeof j?.isFollowing === "boolean") setIsFollowing(j.isFollowing);
        }
      } catch {
        // ignore
      }
    })();

    return () => { mounted = false; };
  }, [API, coach.id, coach.isFollowing]);

  const handleFollowToggle = async (next: boolean) => {
    const token = cleanToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    // optimistic
    const prev = isFollowing;
    setIsFollowing(next);
    const method = next ? "PUT" : "DELETE";
    try {
      const res = await fetch(`${API}/coaches/${coach.id}/follow`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(String(res.status));
      // refresh to reflect server state if needed (reviewCount etc.)
      router.refresh();
    } catch (e) {
      // revert on error
      setIsFollowing(prev);
      throw e;
    }
  };

  return (
    <CoachProfileClient
      coach={coach}
      programs={programs}
      reviews={reviews}
      locale="tr"
      isFollowing={isFollowing}
      onFollowToggle={handleFollowToggle}
      onMessage={(id) => { window.location.href = `/messages?to=${id}`; }}
    />
  );
}
