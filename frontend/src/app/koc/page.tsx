// src/app/koclarimiz/page.tsx
import { cookies } from "next/headers";
import CoachesList, { CoachListItem } from "@/components/coach/CoachesList";

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";
  return raw.replace(/\/+$/, "");
}

function mapPublicToItems(coaches: any[]): CoachListItem[] {
  return (coaches || []).map((d: any) => ({
    id: String(d.id || d._id),
    name: d.name,
    avatarUrl: d.avatarUrl || d.avatar || d.profilePicture || "",
    city: d.city || "",
    rating: typeof d.rating === "number" ? d.rating : null,
    tagline: d.tagline || "",
    specialties: Array.isArray(d.specialization)
      ? d.specialization
      : (typeof d.specialization === "string" ? d.specialization.split(",").map((s: string) => s.trim()).filter(Boolean) : []),
    programsCount: d.programsCount ?? undefined,
  }));
}

export default async function PublicKoclarimizPage() {
  const API = apiBase();
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? null;

  // If logged in, prefer the private discover (with isFollowing)
  let items: CoachListItem[] = [];
  if (token) {
    const r = await fetch(`${API}/me/coaches/discover?limit=50`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      const j = await r.json();
      items = Array.isArray(j.items) ? j.items : [];
    }
  }

  // Fallback to public list
  if (!items.length) {
    const r = await fetch(`${API}/coaches?limit=50`, { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      items = mapPublicToItems(j.coaches);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">Koçlarımız</h1>
      <CoachesList
        items={items}
        linkPrefix={token ? "/uye/koc" : "/koc"}  // same look; private link if logged in
        showFollowBadge={!!token}
      />
    </div>
  );
}
