"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CoachesPageBody from "./CoachesPageBody";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Koçlar yükleniyor…</span>
        </div>
      }
    >
      <CoachesPageBody />
    </Suspense>
  );
}
