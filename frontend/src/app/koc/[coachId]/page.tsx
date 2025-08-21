import { notFound } from "next/navigation";
import ClientSection from "./ClientSection";

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
    console.error("Coach fetch failed", coachRes.status, await coachRes.text().catch(() => ""));
    if (coachRes.status === 404) notFound();
    throw new Error(`Failed to load coach (${coachRes.status})`);
  }

  const coach = await coachRes.json();

  let programs: any[] = [];
  try { const pj = await progsRes.json(); programs = Array.isArray(pj?.items) ? pj.items : []; } catch {}
  let reviews: any[] = [];
  try { const rj = await revsRes.json(); reviews = Array.isArray(rj?.items) ? rj.items : []; } catch {}

  return <ClientSection coach={coach} programs={programs} reviews={reviews} />;
}
