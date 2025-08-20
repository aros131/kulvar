import { notFound } from "next/navigation";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");
export const revalidate = 0; // don't cache

async function getCoach(id: string) {
  const res = await fetch(`${API}/coaches/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const coach = json?.coach || (Array.isArray(json) ? json[0] : null);
  return coach ?? null;
}

export default async function CoachPage({ params }: { params: { id: string } }) {
  const coach = await getCoach(params.id);
  if (!coach) notFound();

  const specs: string[] = Array.isArray(coach.specialization)
    ? coach.specialization
    : (coach.specialization ? [coach.specialization] : []);

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
      <a href="/koc" className="text-sm text-muted-foreground hover:underline">← Geri</a>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{coach.name}</h1>
      <p className="text-muted-foreground">{coach.city || ""}</p>

      {specs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {specs.map((s: string) => (
            <span key={s} className="inline-block rounded-full border px-3 py-1 text-xs capitalize">
              {s}
            </span>
          ))}
        </div>
      )}

      {coach.bio && <p className="mt-6 text-muted-foreground">{coach.bio}</p>}
    </div>
  );
}
