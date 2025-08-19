import { Suspense } from "react";
import CoachesPageBody from "./CoachesPageBody";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        Koçlar yükleniyor…
      </div>
    }>
      <CoachesPageBody />
    </Suspense>
  );
}
