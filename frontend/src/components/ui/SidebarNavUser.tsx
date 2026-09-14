"use client";

import { Home, User, MessageSquare, Settings, Bell, LayoutGrid, CreditCard, Users, LogOut, Camera, Target, ClipboardList, Apple } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { ReactNode } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface SidebarNavUserProps {
  unreadCount?: number;       // notifications
  unreadMessages?: number;    // NEW: messages
}

export default function SidebarNavUser({
  unreadCount = 0,
  unreadMessages = 0,
}: SidebarNavUserProps) {
  const t = useTranslations("navUser");
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    router.push("/login");
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const BadgeIcon = ({
    children,
    count,
  }: {
    children: ReactNode;
    count: number;
  }) => (
    <div className="relative">
      {children}
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );

  const navItems = [
    { href: "/dashboard/user", icon: <Home size={24} />, label: t("home") },
    { href: "/dashboard/user/profile", icon: <User size={24} />, label: t("profile") },
    { href: "/dashboard/user/programs", icon: <LayoutGrid size={24} />, label: t("programs") },
    { href: "/dashboard/user/koclarimiz", icon: <Users size={24} />, label: t("coaches") },
    { href: "/dashboard/user/ilerleme", icon: <Camera size={24} />, label: t("progress") },
    { href: "/dashboard/user/aliskanliklar", icon: <Target size={24} />, label: t("habits") },
    { href: "/dashboard/user/check-in", icon: <ClipboardList size={24} />, label: t("checkin") },
    { href: "/dashboard/user/nutrition", icon: <Apple size={24} />, label: t("nutrition") },
    { href: "/dashboard/user/payments", icon: <CreditCard size={24} />, label: t("payments") },
    {
      href: "/dashboard/user/messages",
      icon: (
        <BadgeIcon count={unreadMessages}>
          <MessageSquare size={24} />
        </BadgeIcon>
      ),
      label: t("messages"),
    },
    {
      href: "/dashboard/user/notifications",
      icon: (
        <BadgeIcon count={unreadCount}>
          <Bell size={24} />
        </BadgeIcon>
      ),
      label: t("notifications"),
    },
    { href: "/dashboard/user/settings", icon: <Settings size={24} />, label: t("settings") },
  ];

  return (
    <aside className="fixed top-0 left-0 h-screen w-16 bg-background border-r border-gray-200 flex flex-col items-center justify-between py-4 z-40">
      <div className="space-y-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={clsx(
              "flex items-center justify-center w-12 h-12 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all",
              isActive(item.href) && "bg-muted text-primary"
            )}
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
          aria-label={t("logout")}
          className="flex items-center justify-center w-12 h-12 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
        >
          <LogOut size={24} />
        </button>
      </div>
    </aside>
  );
}
