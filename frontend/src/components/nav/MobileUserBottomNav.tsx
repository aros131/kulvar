"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageSquare, Bell, Settings } from "lucide-react";

type Props = { unreadCount?: number };

export default function MobileUserBottomNav({ unreadCount = 0 }: Props) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard/user", label: "Panel", Icon: Home, key: "home" },
    { href: "/dashboard/user/koclarimiz", label: "Koçlar", Icon: Users, key: "coaches" },
    // ⬇️ Notifications with unread badge; deep-link to unread
    { href: "/dashboard/user/notifications?tab=unread", label: "Bildirim", Icon: Bell, key: "notifications", badge: unreadCount },
    { href: "/dashboard/user/messages", label: "Mesajlar", Icon: MessageSquare, key: "messages" },
    { href: "/dashboard/user/settings", label: "Ayarlar", Icon: Settings, key: "settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-background/95 backdrop-blur border-t md:hidden">
      <ul className="h-full grid grid-cols-5">
        {items.map(({ href, label, Icon, key, badge }) => {
          // active path match ignoring query string
          const baseHref = href.split("?")[0];
          const active = pathname === baseHref || pathname.startsWith(baseHref + "/");

          return (
            <li key={href} className="flex items-center justify-center">
              <Link
                href={href}
                className={`relative flex flex-col items-center text-[11px] ${active ? "text-foreground" : "text-muted-foreground"}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {key === "notifications" && (badge ?? 0) > 0 && (
                    <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold leading-4 text-white">
                      {badge! > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
