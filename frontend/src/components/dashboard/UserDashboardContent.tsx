// components/dashboard/UserDashboardContent.tsx

"use client";

import { useSearchParams } from "next/navigation";

export default function UserDashboardContent() {
  const params = useSearchParams();
  const id = params.get("id");

  return (
    <div className="bg-card dark:bg-primary/90 rounded-xl p-6 shadow">
      <h2 className="text-xl font-semibold mb-2">Kullanıcı Paneli</h2>
      <p>Kullanıcı ID: {id}</p>
    </div>
  );
}
