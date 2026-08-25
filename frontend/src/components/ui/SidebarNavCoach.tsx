"use client";

import { Home, User, MessageSquare, Settings, Bell, LayoutGrid, BarChart2, CreditCard, Users, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

interface SidebarNavProps {
  unreadCount: number;
}

export default function SidebarNav({ unreadCount }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard/coach" && pathname.startsWith(href + "/"));

  const navItems = [
    { href: "/dashboard/coach", icon: <Home size={24} />, label: "Ana Sayfa" },
    { href: "/dashboard/coach/profile", icon: <User size={24} />, label: "Profil" },
    { href: "/dashboard/coach/programs", icon: <LayoutGrid size={24} />, label: "Programlar" },
    { href: "/dashboard/coach/clients", icon: <Users size={24} />, label: "Danışanlar" },
    { href: "/dashboard/coach/analytics", icon: <BarChart2 size={24} />, label: "Analitik" },
    { href: "/dashboard/coach/payments", icon: <CreditCard size={24} />, label: "Ödemeler" },
    { href: "/dashboard/coach/messages", icon: <MessageSquare size={24} />, label: "Mesajlar" },
    {
      href: "/dashboard/coach/notifications",
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
    { href: "/dashboard/coach/settings", icon: <Settings size={24} />, label: "Ayarlar" },
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
      <button
        onClick={handleLogout}
        title="Çıkış Yap"
        className="flex items-center justify-center w-12 h-12 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
      >
        <LogOut size={24} />
      </button>
    </aside>
  );
}
