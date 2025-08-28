// components/nav/MobileUserBottomNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageSquare, Settings } from "lucide-react";

const items = [
  { href: "/dashboard/user", label: "Panel", Icon: Home },
  { href: "/dashboard/user/koclarimiz", label: "Koçlar", Icon: Users },
  { href: "/dashboard/user/messages", label: "Mesajlar", Icon: MessageSquare },
  { href: "/dashboard/user/settings", label: "Ayarlar", Icon: Settings },
];

export default function MobileUserBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-background/95 backdrop-blur border-t md:hidden">
      <ul className="h-full grid grid-cols-4">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex items-center justify-center">
              <Link
                href={href}
                className={`flex flex-col items-center text-[11px] ${active ? "text-foreground" : "text-muted-foreground"}`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
