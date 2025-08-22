// src/app/dashboard/user/koclarimiz/[coachId]/ClientBridge.tsx
"use client";

import { useEffect, useState } from "react";
import CoachProfileClient, { Coach, Program, Review } from "@/components/CoachProfileClient";

type Props = {
  coach: Coach & { isFollowing?: boolean };
  programs: Program[];
  reviews: Review[];
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
  const API = apiBase();
  const [isFollowing, setIsFollowing] = useState<boolean>(!!coach.isFollowing);

  // Reconcile follow state on the client if SSR couldn't personalize
  useEffect(() => {
    const token = cleanToken();
    if (!token) return;
    // only check if SSR didn't already say true
    if (coach.isFollowing) return;

    (async () => {
      try {
        const r = await fetch(`${API}/coaches/${coach.id}/follow`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!r.ok) return;
        const j = await r.json().catch(() => null);
        if (j && typeof j.isFollowing === "boolean") {
          setIsFollowing(!!j.isFollowing);
        }
      } catch { /* ignore */ }
    })();
  }, [API, coach.id, coach.isFollowing]);

  const onFollowToggle = async (next: boolean) => {
    const token = cleanToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    // optimistic
    setIsFollowing(next);
    const res = await fetch(`${API}/coaches/${coach.id}/follow`, {
      method: next ? "PUT" : "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setIsFollowing(!next);
      const text = await res.text().catch(() => "");
      throw new Error(`Follow failed: ${res.status} ${text}`);
    }
  };

  return (
    <CoachProfileClient
      coach={coach}
      programs={programs}
      reviews={reviews}
      locale="tr"
      isFollowing={isFollowing}
      onFollowToggle={onFollowToggle}
      onMessage={(id) => (window.location.href = `/messages?to=${id}`)}
    />
  );
}
