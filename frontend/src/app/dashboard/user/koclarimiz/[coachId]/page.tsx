import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import UserNavbar from "@/components/nav/UserNavbar";
import ClientBridge from "./ClientBridge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";
  return raw.replace(/\/+$/, "");
}

export default async function Page({ params }: { params: { coachId: string } }) {
  const API = apiBase();
  const token = (await cookies()).get("token")?.value || "";
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // Try private bundle first (coach+programs+reviews+isFollowing+followerCount)
  let coach: any = null;
  let programs: any[] = [];
  let reviewItems: any[] = [];

  if (token) {
    const r = await fetch(`${API}/me/coaches/${params.coachId}`, { cache: "no-store", headers: authHeaders });
    if (r.ok) {
      const j = await r.json();
      coach = j.coach ?? null;
      programs = Array.isArray(j.programs) ? j.programs : [];
      reviewItems = Array.isArray(j.reviews) ? j.reviews : [];
    }
  }

  // Fallback to public endpoints if needed
  if (!coach) {
    const [coachRes, progsRes, revsRes] = await Promise.all([
      fetch(`${API}/coaches/${params.coachId}`, { cache: "no-store" }),
      fetch(`${API}/coaches/${params.coachId}/programs?limit=12`, { cache: "no-store" }),
      fetch(`${API}/coaches/${params.coachId}/reviews?limit=50`, { cache: "no-store" }),
    ]);

    if (!coachRes.ok) {
      if (coachRes.status === 404) notFound();
      throw new Error(`Coach fetch failed (${coachRes.status})`);
    }

    coach = await coachRes.json().catch(() => null);
    programs = (await progsRes.json().catch(() => ({}))).items ?? [];
    reviewItems = (await revsRes.json().catch(() => ({}))).items ?? [];

    // derive rating/reviewCount if not present
    let sum = 0, count = 0;
    for (const r of reviewItems) {
      const n = Number(r?.rating);
      if (Number.isFinite(n)) { sum += n; count += 1; }
    }
    const average = count ? Math.round((sum / count) * 10) / 10 : null;
    coach = {
      ...coach,
      rating: typeof coach?.rating === "number" ? coach.rating : average,
      reviewCount: typeof coach?.reviewCount === "number" ? coach.reviewCount : count,
    };
  }

  return (
    <div className="min-h-screen">
      <UserNavbar />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ClientBridge
          coach={coach}
          programs={programs}
          reviews={reviewItems}
        />
      </div>
    </div>
  );
}
