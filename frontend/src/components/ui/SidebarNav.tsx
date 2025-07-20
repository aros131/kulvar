"use client";

import { Home, User, MessageSquare, Settings, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function SidebarNav() {
  const pathname = usePathname();

  const unreadCount = 3; // Replace with dynamic count if needed

  const navItems = [
    { href: "/dashboard/coach", icon: <Home size={24} />, label: "Home" },
    { href: "/dashboard/coach/profile", icon: <User size={24} />, label: "Profile" },
    { href: "/dashboard/coach/messages", icon: <MessageSquare size={24} />, label: "Messages" },
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
      label: "Notifications",
    },
    { href: "/dashboard/coach/settings", icon: <Settings size={24} />, label: "Settings" },
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
