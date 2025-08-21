// app/koc/[coachId]/ClientSection.tsx
"use client";

import CoachProfileClient from "@/components/CoachProfileClient";

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  return raw.replace(/\/+$/, "");
}

export default function ClientSection({
  coach,
  programs,
  reviews,
}: {
  coach: any;
  programs: any[];
  reviews: any;
}) {
  const API = apiBase();

  return (
    <CoachProfileClient
      coach={coach}
      programs={programs}
      reviews={reviews}
      locale="tr"
      isFollowing={coach?.isFollowing}
      onFollowToggle={async (next: boolean) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        await fetch(`${API}/coaches/${coach.id}/follow`, {
          method: next ? "PUT" : "DELETE",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
      }}
      onMessage={(id: string) => {
        window.location.href = `/messages?to=${id}`;
      }}
    />
  );
}
