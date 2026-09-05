import { Suspense } from "react";
import CoachesPageBody from "@/components/CoachesPageBody";
import UserPageShell from "@/components/user/UserPageShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DashboardKoclarimizPage() {
  return (
    <UserPageShell>
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Yükleniyor…</div>}>
          <CoachesPageBody
            basePath="/dashboard/user/koclarimiz"
            profilePrefix="/dashboard/user/koclarimiz"
          />
        </Suspense>
      </div>
    </UserPageShell>
  );
}
