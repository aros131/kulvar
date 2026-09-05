import { Suspense } from "react";
import CoachesPageBody from "@/components/CoachesPageBody";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PublicKocPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CoachesPageBody />
    </Suspense>
  );
}
