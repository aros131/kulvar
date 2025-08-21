// src/app/dashboard/user/koclarimiz/page.tsx
import { cookies } from "next/headers";
import CoachesList, { CoachListItem } from "@/components/coach/CoachesList";
import UserNavbar from "@/components/nav/UserNavbar";

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";
  return raw.replace(/\/+$/, "");
}

export default async function DashboardKoclarimizPage() {
  const API = apiBase();
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? null;

  // Always go through private discover here (dashboard is authenticated area)
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

  return (
    <div className="min-h-screen">
      <UserNavbar />
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-semibold">Koçlarımız</h1>
        <CoachesList items={items} linkPrefix="/uye/koc" showFollowBadge />
      </div>
    </div>
  );
}
