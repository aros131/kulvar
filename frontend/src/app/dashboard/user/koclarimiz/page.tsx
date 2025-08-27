import { Suspense } from "react";
import CoachesPageBody from "@/components/CoachesPageBody";
import UserNavbar from "@/components/nav/UserNavbar"; // if you have it
import SidebarNavUser from "@/components/ui/SidebarNavUser";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DashboardKoclarimizPage() {
  return (
    <div className="flex">
      <SidebarNavUser unreadCount={unreadCount} />
      <div className="min-h-screen">
        <UserNavbar />
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
          <Suspense fallback={<div>Yükleniyor…</div>}>
            <CoachesPageBody
              basePath="/dashboard/user/koclarimiz"
              profilePrefix="/dashboard/user/koclarimiz"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
