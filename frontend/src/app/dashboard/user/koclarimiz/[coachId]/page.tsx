import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import ClientSection from "./ClientSection";

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";
  return raw.replace(/\/+$/, "");
}

export default async function CoachPage({ params }: { params: { coachId: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? null;
  if (!token) redirect(`/login?next=/dashboard/user/koclarimiz/${params.coachId}`);

  const API = apiBase();
  const res = await fetch(`${API}/me/coaches/${params.coachId}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load coach (${res.status})`);

  const { coach, programs, reviews } = await res.json();

  return (
    <ClientSection
      coach={coach}
      programs={Array.isArray(programs) ? programs : []}
      reviews={Array.isArray(reviews) ? reviews : []}
    />
  );
}
