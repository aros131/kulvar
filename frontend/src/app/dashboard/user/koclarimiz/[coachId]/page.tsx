// app/dashboard/user/koclarimiz/[coachId]/page.tsx
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import UserNavbar from "@/components/nav/UserNavbar";
import SidebarNavUserLoader from "@/components/SidebarNavUserLoader";
import MobileUserBottomNav from "@/components/nav/MobileUserBottomNav";
import ClientBridge from "./ClientBridge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";
  return raw.replace(/\/+$/, "");
}

function makeAuthHeadersFromCookieToken(token: string | undefined | null): HeadersInit {
  const h: Record<string, string> = {};
  if (!token) return h;
  const trimmed = token.replace(/^"+|"+$/g, "").trim();
  const bare = trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
  if (bare) h.Authorization = `Bearer ${bare}`;
  return h;
}

export default async function Page({ params }: { params: { coachId: string } }) {
  const API = apiBase();
  const token = (await cookies()).get("token")?.value || "";
  const isAuthed = Boolean(token);
  const authHeaders = makeAuthHeadersFromCookieToken(token);

  // unread count (server)
  let unreadCount = 0;
  if (isAuthed) {
    try {
      const r = await fetch(`${API}/dashboard/notifications/user`, {
        headers: authHeaders,
        cache: "no-store",
      });
      if (r.ok) {
        const data = await r.json().catch(() => ({} as any));
        const list: any[] = Array.isArray(data?.notifications) ? data.notifications : [];
        unreadCount = list.filter((n) => !n?.isRead).length;
      }
    } catch {}
  }

  // private bundle first
  let coach: any = null;
  let programs: any[] = [];
  let reviewItems: any[] = [];

  if (isAuthed) {
    try {
      const r = await fetch(`${API}/me/coaches/${params.coachId}`, {
        cache: "no-store",
        headers: authHeaders,
      });
      if (r.ok) {
        const j = await r.json();
        coach = j.coach ?? null;
        programs = Array.isArray(j.programs) ? j.programs : [];
        reviewItems = Array.isArray(j.reviews) ? j.reviews : [];
      }
    } catch {}
  }

  // fallback public
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
    programs = (await progsRes.json().catch(() => ({})))?.items ?? [];
    reviewItems = (await revsRes.json().catch(() => ({})))?.items ?? [];

    // derive rating/reviewCount if missing
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
    <div className="relative flex min-h-screen">
      {/* Sidebar visible only on md+ to avoid overlay on mobile */}
      <div className="hidden md:block">
        <SidebarNavUserLoader />
      </div>

      {/* Spacer that matches sidebar width on md+ */}
      <div className="hidden md:block w-16 shrink-0" aria-hidden />

      {/* Main content */}
      <main className="w-full min-h-screen isolate">
        {/* Sticky navbar with higher z-index */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
          <UserNavbar unreadCount={unreadCount} />
        </div>

        {/* content (extra bottom padding so the mobile bottom bar never covers it) */}
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 pb-16 md:pb-8">
          <ClientBridge
            coach={coach}
            programs={programs}
            reviews={reviewItems}
            isAuthed={isAuthed}
          />
        </div>

        {/* mobile-only bottom nav */}
        <MobileUserBottomNav />
      </main>
    </div>
  );
}
