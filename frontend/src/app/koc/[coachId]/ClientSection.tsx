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
  reviews: any[];
}) {
  const API = apiBase();
  const safePrograms = Array.isArray(programs) ? programs : [];
  const safeReviews = Array.isArray(reviews) ? reviews : [];

  return (
    <CoachProfileClient
      coach={coach}
      programs={safePrograms}
      reviews={safeReviews}
      locale="tr"
      isFollowing={coach?.isFollowing}
      onFollowToggle={async (next: boolean) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        await fetch(`${API}/coaches/${coach.id}/follow`, {
          method: next ? "PUT" : "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }}
      onMessage={(id: string) => {
        window.location.href = `/dashboard/user/messages/start?to=${id}`;
      }}
    />
  );
}
