"use client";

import { useEffect, useState } from "react";
import { Home, User, MessageSquare, Settings, Bell, LayoutGrid, BarChart2, CreditCard, Users, LogOut, Copy } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

interface SidebarNavProps {
  unreadCount?: number;
}

export default function SidebarNav({ unreadCount: unreadProp }: SidebarNavProps) {
  const t = useTranslations("navCoach");
  const pathname = usePathname();
  const router = useRouter();
  const [unreadNotif, setUnreadNotif] = useState(unreadProp ?? 0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token")?.replace(/^"+|"+$/g, "").replace(/^Bearer\s+/i, "");
    if (!token) return;
    fetch(`${API}/notifications/user`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        const notifications = Array.isArray(d?.notifications) ? d.notifications : [];
        setUnreadNotif(notifications.filter((n: { isRead: boolean }) => !n.isRead).length);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const userId = (JSON.parse(stored) as { id?: string }).id;
    if (!userId) return;
    const unsub = onSnapshot(query(collection(db, "chats")), (snap) => {
      let total = 0;
      snap.docs.forEach(d => {
        const data = d.data() as any;
        if (Array.isArray(data.participants) && data.participants.includes(userId)) {
          total += Number(data[`unread_${userId}`] || 0);
        }
      });
      setUnreadMsgs(total);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    router.push("/login");
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard/coach" && pathname.startsWith(href + "/"));

  const navItems = [
    { href: "/dashboard/coach", icon: <Home size={24} />, label: t("home") },
    { href: "/dashboard/coach/profile", icon: <User size={24} />, label: t("profile") },
    { href: "/dashboard/coach/programs", icon: <LayoutGrid size={24} />, label: t("programs") },
    { href: "/dashboard/coach/templates", icon: <Copy size={24} />, label: t("templates") },
    { href: "/dashboard/coach/clients", icon: <Users size={24} />, label: t("clients") },
    { href: "/dashboard/coach/analytics", icon: <BarChart2 size={24} />, label: t("analytics") },
    { href: "/dashboard/coach/payments", icon: <CreditCard size={24} />, label: t("payments") },
    {
      href: "/dashboard/coach/messages",
      icon: (
        <div className="relative">
          <MessageSquare size={24} />
          {unreadMsgs > 0 && (
            <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full">
              {unreadMsgs > 9 ? "9+" : unreadMsgs}
            </span>
          )}
        </div>
      ),
      label: t("messages"),
    },
    {
      href: "/dashboard/coach/notifications",
      icon: (
        <div className="relative">
          <Bell size={24} />
          {unreadNotif > 0 && (
            <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full">
              {unreadNotif > 9 ? "9+" : unreadNotif}
            </span>
          )}
        </div>
      ),
      label: t("notifications"),
    },
    { href: "/dashboard/coach/settings", icon: <Settings size={24} />, label: t("settings") },
  ];

  return (
    <aside className="fixed top-0 left-0 h-screen w-16 bg-background border-r border-gray-200 flex flex-col items-center justify-between py-4 z-40">
      <div className="space-y-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center justify-center w-12 h-12 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all",
              isActive(item.href) && "bg-muted text-primary"
            )}
            title={item.label}
          >
            {item.icon}
          </Link>
        ))}
      </div>
      <div className="space-y-1">
        <LanguageSwitcher variant="icon" />
        <button
          onClick={handleLogout}
          title={t("logout")}
          className="flex items-center justify-center w-12 h-12 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
        >
          <LogOut size={24} />
        </button>
      </div>
    </aside>
  );
}
