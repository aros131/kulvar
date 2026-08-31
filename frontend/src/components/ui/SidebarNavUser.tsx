"use client";

import { Home, User, MessageSquare, Settings, Bell, LayoutGrid, CreditCard, Users, LogOut, Camera, Target, ClipboardList } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { ReactNode } from "react";

interface SidebarNavUserProps {
  unreadCount?: number;       // notifications
  unreadMessages?: number;    // NEW: messages
}

export default function SidebarNavUser({
  unreadCount = 0,
  unreadMessages = 0,
}: SidebarNavUserProps) {
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
    { href: "/dashboard/user", icon: <Home size={24} />, label: "Ana Sayfa" },
    { href: "/dashboard/user/profile", icon: <User size={24} />, label: "Profil" },
    { href: "/dashboard/user/programs", icon: <LayoutGrid size={24} />, label: "Programlarım" },
    { href: "/dashboard/user/koclarimiz", icon: <Users size={24} />, label: "Koçlarım" },
    { href: "/dashboard/user/ilerleme", icon: <Camera size={24} />, label: "İlerleme" },
    { href: "/dashboard/user/aliskanliklar", icon: <Target size={24} />, label: "Alışkanlıklar" },
    { href: "/dashboard/user/check-in", icon: <ClipboardList size={24} />, label: "Check-in" },
    { href: "/dashboard/user/payments", icon: <CreditCard size={24} />, label: "Ödemelerim" },
    {
      href: "/dashboard/user/messages",
      icon: (
        <BadgeIcon count={unreadMessages}>
          <MessageSquare size={24} />
        </BadgeIcon>
      ),
      label: "Mesajlar",
    },
    {
      href: "/dashboard/user/notifications",
      icon: (
        <BadgeIcon count={unreadCount}>
          <Bell size={24} />
        </BadgeIcon>
      ),
      label: "Bildirimler",
    },
    { href: "/dashboard/user/settings", icon: <Settings size={24} />, label: "Ayarlar" },
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
      <button
        onClick={handleLogout}
        title="Çıkış Yap"
        aria-label="Çıkış Yap"
        className="flex items-center justify-center w-12 h-12 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
      >
        <LogOut size={24} />
      </button>
    </aside>
  );
}
