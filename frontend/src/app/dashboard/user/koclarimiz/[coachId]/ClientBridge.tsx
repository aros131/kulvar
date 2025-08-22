// src/app/dashboard/user/koclarimiz/[coachId]/ClientBridge.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import CoachProfileClient, { Coach, Program, Review } from "@/components/CoachProfileClient";

type Props = {
  coach: Coach & { isFollowing?: boolean };
  programs: Program[];
  reviews: Review[]; // array from /coaches/:id/reviews
};

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
  const [checking, setChecking] = useState<boolean>(false);

  // DEBUG: show SSR vs CSR token visibility and SSR follow flag
  useEffect(() => {
    // SSR part: page already logged “SSR cookie token present: NO”
    const t = cleanToken();
    // eslint-disable-next-line no-console
    console.log(
      `CSR localStorage token present: ${t ? "YES" : "NO"}${t ? ` (len=${t.length})` : ""}`
    );
    // eslint-disable-next-line no-console
    console.log(`Coach.isFollowing (from SSR): ${!!coach.isFollowing}`);
  }, [coach.isFollowing]);

  // Client-side follow status check (runs only in browser)
  useEffect(() => {
    const token = cleanToken();
    if (!token) {
      // eslint-disable-next-line no-console
      console.log("Client follow check: skipped (no token in localStorage)");
      return;
    }
    setChecking(true);
    fetch(`${API}/coaches/${coach.id}/follow`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`GET follow failed: ${r.status}`);
        const j = await r.json().catch(() => ({}));
        if (typeof j.isFollowing === "boolean") {
          setIsFollowing(j.isFollowing);
          // eslint-disable-next-line no-console
          console.log("Client follow check: success →", j.isFollowing);
        } else {
          // eslint-disable-next-line no-console
          console.warn("Client follow check: malformed response", j);
        }
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn("Client follow check error:", e);
      })
      .finally(() => setChecking(false));
  }, [API, coach.id]);

  const handleFollowToggle = async (next: boolean) => {
    const token = cleanToken();
    if (!token) {
      // not logged in → send to login (or show toast in caller)
      window.location.href = "/login";
      return;
    }
    const method = next ? "PUT" : "DELETE";
    const res = await fetch(`${API}/coaches/${coach.id}/follow`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok && res.status !== 204) {
      const text = await res.text().catch(() => "");
      throw new Error(`Follow toggle failed: ${res.status} ${text}`);
    }
    // If backend returns 204, we trust our optimistic update
    setIsFollowing(next);
  };

  return (
    <CoachProfileClient
      coach={coach}
      programs={programs}
      reviews={reviews}
      locale="tr"
      isFollowing={isFollowing}
      loading={checking && typeof coach.isFollowing === "undefined"}
      onFollowToggle={handleFollowToggle}
      onMessage={(id) => {
        window.location.href = `/messages?to=${id}`;
      }}
    />
  );
}
