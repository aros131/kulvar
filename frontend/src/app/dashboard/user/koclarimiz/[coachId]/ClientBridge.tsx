"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Follow failed: ${res.status} ${text}`);
        }

        // Optional: use server truth (if you changed backend to return JSON)
        const json = await res.json().catch(() => null);
        if (json && typeof json.isFollowing === "boolean") {
          // You can force a refresh to keep SSR data aligned (nice on back/forward)
          router.refresh();
        }
      }}
      onMessage={(id) => (window.location.href = `/messages?to=${id}`)}
    />
  );
}
