// app/koc/[coachId]/page.tsx  (Server Component)
import { notFound } from "next/navigation";
import ClientSection from "./ClientSection";

type ReviewItem = { rating?: number };

function summarizeReviews(items: ReviewItem[]) {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1|2|3|4|5, number>;
  let sum = 0, count = 0;
  for (const r of items || []) {
    const n = Number(r?.rating);
    if (!Number.isFinite(n)) continue;
    const clamped = Math.min(5, Math.max(1, Math.round(n))) as 1|2|3|4|5;
    dist[clamped] += 1;
    sum += n;
    count += 1;
  }
  const average = count ? Math.round((sum / count) * 10) / 10 : null;
  return { average, count, distribution: dist };
}

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";
  return raw.replace(/\/+$/, "");
}

export default async function CoachPage({ params }: { params: { coachId: string } }) {
  const API = apiBase();

  const [coachRes, progsRes, revsRes] = await Promise.all([
    fetch(`${API}/coaches/${params.coachId}`, { cache: "no-store" }),
    fetch(`${API}/coaches/${params.coachId}/programs?limit=12`, { cache: "no-store" }),
    fetch(`${API}/coaches/${params.coachId}/reviews?limit=50`, { cache: "no-store" }),
  ]);

  if (!coachRes.ok) {
    console.error("Coach fetch failed", coachRes.status, coachRes.statusText, {
      url: `${API}/coaches/${params.coachId}`,
      body: await coachRes.text().catch(() => "(no body)"),
    });
    if (coachRes.status === 404) notFound();
    throw new Error(`Failed to load coach (${coachRes.status})`);
  }

  const coach = await coachRes.json();

  let programs: any[] = [];
  try {
    const pj = await progsRes.json();
    programs = Array.isArray(pj?.items) ? pj.items : [];
  } catch { programs = []; }

  let reviewItems: ReviewItem[] = [];
  try {
    const rj = await revsRes.json();
    reviewItems = Array.isArray(rj?.items) ? rj.items : [];
  } catch { reviewItems = []; }

  // ✅ pass the ARRAY as `reviews` (many UIs call reviews.slice(...))
  const reviewsList = reviewItems;

  // Optional: if your UI later wants a summary, pass it as a different prop
  // const reviewsSummary = summarizeReviews(reviewItems);

  return (
    <ClientSection
      coach={coach}
      programs={programs}
      reviews={reviewsList}
      // remove `availability` for now; add only if your ClientSection/CoachProfileClient props include it
      // reviewsSummary={reviewsSummary} // (only if your ClientSection supports it)
    />
  );
}
