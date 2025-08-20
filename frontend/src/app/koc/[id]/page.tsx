import { notFound } from "next/navigation";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");
export const revalidate = 0; // always fresh while iterating

type Coach = {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  profilePicture?: string;
  specialization?: string | string[];
  city?: string;
  rating?: number;
  bio?: string;
  programsCount?: number;
};

async function getCoach(id: string): Promise<Coach | null> {
  try {
    const res = await fetch(`${API}/coaches/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    // expect { coach: {...} }
    const coach: Coach | undefined = json?.coach ?? (Array.isArray(json) ? json[0] : undefined);
    return coach ?? null;
  } catch {
    return null;
  }
}

export default async function CoachPage({ params }: { params: { id: string } }) {
  const coach = await getCoach(params.id);
  if (!coach) notFound();

  return (
    <div className="mx-auto max-w-xl md:max-w-2xl px-4 md:px-6 py-8">
      <a href="/koc" className="text-sm text-muted-foreground hover:underline">← Geri</a>
      {/* Client UI */}
      <CoachProfileClient coach={coach} />
    </div>
  );
}

import CoachProfileClient from "@/components/CoachProfileClient"; 