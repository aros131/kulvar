// app/dashboard/user/koclarimiz/page.tsx
import { Suspense } from "react";
import CoachesPageBody from "@/components/CoachesPageBody";
import UserNavbar from "@/components/nav/UserNavbar";
import SidebarNavUser from "@/components/ui/SidebarNavUser";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DashboardKoclarimizPage() {
  return (
    <div className="relative flex">
      {/* Sidebar is left-fixed/sticky inside the component; treat it as 64px (ml-16) on md+ */}
      <SidebarNavUser unreadCount={0} />

      {/* Reserve space next to sidebar on md and up; no offset on mobile */}
      <main className="w-full min-h-screen ml-0 md:ml-16">
        <UserNavbar />
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
          <Suspense fallback={<div>Yükleniyor…</div>}>
            <CoachesPageBody
              basePath="/dashboard/user/koclarimiz"
              profilePrefix="/dashboard/user/koclarimiz"
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
