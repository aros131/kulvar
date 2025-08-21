import { Suspense } from "react";
import UserNavbar from "@/components/nav/UserNavbar";
import CoachesPageBody from "@/components/CoachesPageBody";

export const dynamic = "force-dynamic"; // avoid static prerender
export const revalidate = 0;             // no caching, always fresh

export default function DashboardKoclarimizPage() {
  return (
    <div className="min-h-screen">
      <UserNavbar />
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <Suspense fallback={<div>Yükleniyor…</div>}>
          <CoachesPageBody
            basePath="/dashboard/user/koclarimiz"
            profilePrefix="/uye/koc"
          />
        </Suspense>
      </div>
    </div>
  );
}
