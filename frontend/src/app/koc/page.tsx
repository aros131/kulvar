import { Suspense } from "react";
import CoachesPageBody from "@/components/CoachesPageBody";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PublicKocPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <Suspense fallback={<div>Yükleniyor…</div>}>
        <CoachesPageBody basePath="/koc" profilePrefix="/koc" />
      </Suspense>
    </div>
  );
}
