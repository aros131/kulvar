// app/koc/[coachId]/page.tsx

import CoachProfileClient from "@/components/CoachProfileClient";
export default async function CoachPage({ params }: { params: { coachId: string } }) {
  // fetch your data here from Render API
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coaches/${params.coachId}`, { cache: "no-store" });
  const coach = await res.json();
  const programs = coach.programs ?? [];
  const reviews = coach.reviewsSummary ?? { average: 4.9, count: 128, distribution: {5:100,4:20,3:6,2:1,1:1} };
  const availability = coach.availability ?? []; // [{date:'2025-08-21', timezone:'Europe/Istanbul', slots:[{time:'10:00',available:true}, ...]}]

  return (
    <CoachProfileClient
      coach={coach}
      programs={programs}
      reviews={reviews}
      availability={availability}
      locale="tr"
      isFollowing={coach.isFollowing}
      onFollowToggle={async (next) => { await fetch(`/api/follow`, { method: next ? "POST" : "DELETE", body: JSON.stringify({ coachId: coach.id }) }); }}
      onBook={async ({ day, time }) => { await fetch(`/api/book`, { method: "POST", body: JSON.stringify({ coachId: coach.id, day, time }) }); }}
      onMessage={() => { window.location.href = `/messages?to=${coach.id}`; }}
    />
  );
}
