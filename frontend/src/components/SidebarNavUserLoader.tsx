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
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

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
        const [notifRes, msgRes] = await Promise.all([
          fetch(`${API}/dashboard/notifications/user`, { headers, cache: "no-store" }),
          fetch(`${API}/messages/unread-count`, { headers, cache: "no-store" }), // ← adjust if your route differs
        ]);

        // Notifications
        let notifCount = 0;
        if (notifRes.ok) {
          const data = await notifRes.json();
          const list = Array.isArray(data?.notifications) ? data.notifications : [];
          notifCount = list.filter((n: any) => !n.isRead).length;
        }

        // Messages
        let msgCount = 0;
        if (msgRes.ok) {
          const data = await msgRes.json();
          msgCount =
            typeof data?.unreadCount === "number"
              ? data.unreadCount
              : Array.isArray(data?.threads)
              ? data.threads.filter((t: any) => !t.isRead).length
              : 0;
        }

        if (alive) {
          setUnreadNotifications(notifCount);
          setUnreadMessages(msgCount);
        }
      } catch {
        if (alive) {
          setUnreadNotifications(0);
          setUnreadMessages(0);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [headers]);

  // React to cross-tab login/logout
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") window.location.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return <SidebarNavUser unreadCount={unreadNotifications} unreadMessages={unreadMessages} />;
}
