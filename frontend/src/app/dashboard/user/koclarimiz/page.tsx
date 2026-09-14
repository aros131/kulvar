import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import CoachesPageBody from "@/components/CoachesPageBody";
import UserPageShell from "@/components/user/UserPageShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardKoclarimizPage() {
  const t = await getTranslations("common");
  return (
    <UserPageShell>
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <Suspense fallback={<div className="text-sm text-muted-foreground">{t("loading")}</div>}>
          <CoachesPageBody />
        </Suspense>
      </div>
    </UserPageShell>
  );
}
