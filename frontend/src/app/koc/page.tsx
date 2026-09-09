import { Suspense } from "react";
import KocPageClient from "./KocPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PublicKocPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <KocPageClient />
    </Suspense>
  );
}
