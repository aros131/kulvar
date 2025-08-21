import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import UserNavbar from "@/components/nav/UserNavbar";
import CoachProfileClient from "@/components/CoachProfileClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";
  return raw.replace(/\/+$/, "");
}

export default async function Page({ params }: { params: { coachId: string } }) {
  const API = apiBase();
  const token = (await cookies()).get("token")?.value || "";
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const [coachRes, progsRes, revsRes] = await Promise.all([
    fetch(`${API}/coaches/${params.coachId}`, { cache: "no-store", headers }),
    fetch(`${API}/coaches/${params.coachId}/programs?limit=12`, { cache: "no-store", headers }),
    fetch(`${API}/coaches/${params.coachId}/reviews?limit=50`, { cache: "no-store", headers }),
  ]);

  if (!coachRes.ok) {
    if (coachRes.status === 404) notFound();
    throw new Error(`Coach fetch failed (${coachRes.status})`);
  }

  const coach = await coachRes.json().catch(() => null);
  const programs = (await progsRes.json().catch(() => ({}))).items ?? [];
  const reviewItems = (await revsRes.json().catch(() => ({}))).items ?? [];

  // summarize reviews (kept minimal)
  const dist = {1:0,2:0,3:0,4:0,5:0} as Record<1|2|3|4|5, number>;
  let sum = 0, count = 0;
  for (const r of reviewItems) {
    const n = Number(r?.rating);
    if (!Number.isFinite(n)) continue;
    const k = Math.min(5, Math.max(1, Math.round(n))) as 1|2|3|4|5;
    dist[k] += 1; sum += n; count += 1;
  }
  const reviews = { average: count ? Math.round((sum / count) * 10) / 10 : null, count, distribution: dist };

  return (
    <div className="min-h-screen">
      <UserNavbar />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <CoachProfileClient coach={coach} programs={programs} reviews={reviews as any} locale="tr" />
      </div>
    </div>
  );
}
