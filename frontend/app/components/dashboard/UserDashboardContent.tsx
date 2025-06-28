// components/dashboard/UserDashboardContent.tsx

"use client";

import { useSearchParams } from "next/navigation";

export default function UserDashboardContent() {
  const params = useSearchParams();
  const id = params.get("id");

  return <div>User ID: {id}</div>;
}
