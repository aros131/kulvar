// app/koc/[coachId]/ClientSection.tsx  (Client Component)
"use client";

import CoachProfileClient from "@/components/CoachProfileClient";

export default function ClientSection({ coach, programs, reviews, availability }: any) {
  return (
    <CoachProfileClient
      coach={coach}
      programs={programs}
      reviews={reviews}
      availability={availability}
      locale="tr"
      isFollowing={coach?.isFollowing}
      onFollowToggle={async (next) => {
        await fetch("/api/follow", {
          method: next ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coachId: coach.id }),
        });
      }}
      onBook={async ({ day, time }) => {
        await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coachId: coach.id, day, time }),
        });
      }}
      onMessage={(id: string) => {
        window.location.href = `/messages?to=${id}`;
      }}
    />
  );
}
