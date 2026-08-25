"use client";

import CoachProfileClient from "@/components/CoachProfileClient";

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "";
  return raw.replace(/\/+$/, "");
}

// read token client-side for follow/unfollow calls
function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )token=([^;]+)/);
  if (m?.[1]) return decodeURIComponent(m[1]);
  return localStorage.getItem("token");
}

export default function ClientSection({
  coach,
  programs,
  reviews,
}: {
  coach: any;
  programs: any[];
  reviews: any[];
}) {
  const API = apiBase();

  return (
    <CoachProfileClient
      coach={coach}
      programs={programs}
      reviews={reviews}
      locale="tr"
      isFollowing={coach?.isFollowing}
      onFollowToggle={async (next) => {
        const token = getToken();
        if (!token) throw new Error("no token");
        const resp = await fetch(`${API}/me/coaches/${coach.id}/follow`, {
          method: next ? "PUT" : "DELETE",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!resp.ok && resp.status !== 204) throw new Error("follow toggle failed");
      }}
      onMessage={(id: string) => {
        window.location.href = `/dashboard/user/messages/start?to=${id}`;
      }}
    />
  );
}
