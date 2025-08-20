// app/koc/[coachId]/page.tsx  (Server Component)
import ClientSection from "./ClientSection";

export default async function CoachPage({ params }: { params: { coachId: string } }) {
  const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");
  const res = await fetch(`${API}/coaches/${params.coachId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load coach"); // helps surface real error in dev
  const coach = await res.json();

  const programs = coach.programs ?? [];
  const reviews = coach.reviewsSummary ?? { average: 4.9, count: 128, distribution: {5:100,4:20,3:6,2:1,1:1} };
  const availability = coach.availability ?? [];

  return (
    <ClientSection
      coach={coach}
      programs={programs}
      reviews={reviews}
      availability={availability}
    />
  );
}
