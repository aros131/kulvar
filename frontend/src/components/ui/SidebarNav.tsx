// components/ui/SidebarNav.tsx
"use client";

import { Home, User, MessageSquare, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", icon: <Home size={24} />, label: "Home" },
  { href: "/dashboard/profile", icon: <User size={24} />, label: "Profile" },
  { href: "/dashboard/messages", icon: <MessageSquare size={24} />, label: "Messages" },
  { href: "/dashboard/settings", icon: <Settings size={24} />, label: "Settings" },
];

export default function SidebarNav() {
  const pathname = usePathname();

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
          >
            {item.icon}
          </Link>
        ))}
      </div>
    </aside>
  );
}
