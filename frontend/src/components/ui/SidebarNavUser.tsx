"use client";

import { Home, User, MessageSquare, Settings, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

interface SidebarNavUserProps {
  unreadCount: number;
}

export default function SidebarNavUser({ unreadCount }: SidebarNavUserProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard/user", icon: <Home size={24} />, label: "Ana Sayfa" },
    { href: "/dashboard/user/profile", icon: <User size={24} />, label: "Profil" },
    { href: "/dashboard/user/messages", icon: <MessageSquare size={24} />, label: "Mesajlar" },
    
    {
      href: "/dashboard/user/notifications",
      icon: (
        <div className="relative">
          <Bell size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
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
            className={clsx(
              "flex items-center justify-center w-12 h-12 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all",
              pathname === item.href && "bg-muted text-primary"
            )}
            title={item.label}
          >
            {item.icon}
          </Link>
        ))}
      </div>
    </aside>
  );
}
