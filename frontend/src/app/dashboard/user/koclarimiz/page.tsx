// app/dashboard/user/koclarimiz/page.tsx
import { Suspense } from "react";
import CoachesPageBody from "@/components/CoachesPageBody";
import UserNavbar from "@/components/nav/UserNavbar";
import SidebarNavUser from "@/components/ui/SidebarNavUser";
import MobileUserBottomNav from "@/components/nav/MobileUserBottomNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DashboardKoclarimizPage() {
  return (
    <div className="relative flex min-h-screen">
      {/* Sidebar only on md+ to avoid overlay on mobile */}
      <div className="hidden md:block">
        <SidebarNavUser unreadCount={0} />
      </div>

      {/* Spacer matching sidebar width on md+ */}
      <div className="hidden md:block w-16 shrink-0" aria-hidden />

      {/* Main content */}
      <main className="w-full min-h-screen isolate">
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
          <UserNavbar />
        </div>

        {/* Extra bottom padding so mobile bottom bar never covers content */}
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 pb-16 md:pb-8">
          <Suspense fallback={<div>Yükleniyor…</div>}>
            <CoachesPageBody
              basePath="/dashboard/user/koclarimiz"
              profilePrefix="/dashboard/user/koclarimiz"
            />
          </Suspense>
        </div>

        {/* Mobile-only bottom navigation */}
        <MobileUserBottomNav />
      </main>
    </div>
  );
}
