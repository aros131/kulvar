"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageSquare, Bell, Settings } from "lucide-react";

type Props = {
  unreadNotifications?: number;
  unreadMessages?: number;
};

export default function MobileUserBottomNav({
  unreadNotifications = 0,
  unreadMessages = 0,
}: Props) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard/user", label: "Panel", Icon: Home },
    { href: "/dashboard/user/koclarimiz", label: "Koçlar", Icon: Users },
    { href: "/dashboard/user/notifications?tab=unread", label: "Bildirim", Icon: Bell, badge: unreadNotifications },
    { href: "/dashboard/user/messages", label: "Mesajlar", Icon: MessageSquare, badge: unreadMessages },
    { href: "/dashboard/user/settings", label: "Ayarlar", Icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-background/95 backdrop-blur border-t md:hidden">
      <ul className="h-full grid grid-cols-5">
        {items.map(({ href, label, Icon, badge }) => {
          const baseHref = href.split("?")[0];
          const active = pathname === baseHref || pathname.startsWith(baseHref + "/");
          const badgeNum = Math.max(0, Number(badge || 0));
          const badgeText = badgeNum > 99 ? "99+" : String(badgeNum);
          const aria = badgeNum > 0 ? `${label} (${badgeText} okunmamış)` : label;

          return (
            <li key={href} className="flex items-center justify-center">
              <Link
                href={href}
                className={`relative flex flex-col items-center text-[11px] ${active ? "text-foreground" : "text-muted-foreground"}`}
                aria-current={active ? "page" : undefined}
                aria-label={aria}
                title={label}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {badgeNum > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold leading-4 text-white"
                    >
                      {badgeText}
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
