// components/SidebarNavUserLoader.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import SidebarNavUser from "@/components/ui/SidebarNavUser";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

const cleanToken = (): string | null => {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const trimmed = raw.replace(/^"+|"+$/g, "").trim();
    return trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
  } catch {
    return null;
  }
};

export default function SidebarNavUserLoader() {
  const [unread, setUnread] = useState(0);
  const headers = useMemo(() => {
    const token = cleanToken();
    const h = new Headers();
    if (token) h.set("Authorization", `Bearer ${token}`);
    return h;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/dashboard/notifications/user`, { headers, cache: "no-store" });
        const data = await res.json();
        const list = Array.isArray(data?.notifications) ? data.notifications : [];
        if (alive) setUnread(list.filter((n: any) => !n.isRead).length);
      } catch {
        if (alive) setUnread(0);
      }
    })();
    return () => { alive = false; };
  }, [headers]);

  // Also react to cross-tab login/logout
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") window.location.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return <SidebarNavUser unreadCount={unread} />;
}

