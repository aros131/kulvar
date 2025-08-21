"use client";

import CoachProfileClient, { Coach, Program, Review } from "@/components/CoachProfileClient";

type Props = {
  coach: Coach & { isFollowing?: boolean };
  programs: Program[];
  reviews: Review[]; // <- array
};

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";
  return raw.replace(/\/+$/, "");
}

// same helper you used elsewhere
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

  return (
    <CoachProfileClient
      coach={coach}
      programs={programs}
      reviews={reviews}
      locale="tr"
      isFollowing={!!coach.isFollowing}
      onFollowToggle={async (next) => {
        const token = cleanToken();
        if (!token) {
          // not logged in → send them to login (or toast)
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
          // credentials not needed since you auth via Authorization header
        });
        if (!res.ok) {
          // throw to let CoachProfileClient revert optimistic toggle + show toast
          const text = await res.text().catch(() => "");
          throw new Error(`Follow failed: ${res.status} ${text}`);
        }
      }}
      onMessage={(id) => {
        // your existing behavior
        window.location.href = `/messages?to=${id}`;
      }}
    />
  );
}
