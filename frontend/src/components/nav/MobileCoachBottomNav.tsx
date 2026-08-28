"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LayoutGrid, Users, MessageSquare, User, Bell } from "lucide-react";

type Props = {
  unreadNotifications?: number;
  unreadMessages?: number;
};

export default function MobileCoachBottomNav({
  unreadNotifications = 0,
  unreadMessages = 0,
}: Props) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard/coach", label: "Panel", Icon: Home },
    { href: "/dashboard/coach/programs", label: "Programlar", Icon: LayoutGrid },
    { href: "/dashboard/coach/clients", label: "Danışanlar", Icon: Users },
    { href: "/dashboard/coach/messages", label: "Mesajlar", Icon: MessageSquare, badge: unreadMessages },
    { href: "/dashboard/coach/notifications?tab=unread", label: "Bildirimler", Icon: Bell, badge: unreadNotifications },
    { href: "/dashboard/coach/profile", label: "Profil", Icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-background/95 backdrop-blur border-t md:hidden">
      <ul className="h-full grid grid-cols-6">
        {items.map(({ href, label, Icon, badge }) => {
          const baseHref = href.split("?")[0];
          const active = pathname === baseHref || pathname.startsWith(baseHref + "/");
          const badgeNum = Math.max(0, Number(badge || 0));
          return (
            <li key={href} className="flex items-center justify-center">
              <Link
                href={href}
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                  active ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
                title={label}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {badgeNum > 0 && (
                    <span className="absolute -right-1.5 -top-1 grid min-w-4 place-items-center rounded-full bg-emerald-500 px-1 text-[9px] font-semibold leading-4 text-white">
                      {badgeNum > 99 ? "99+" : badgeNum}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
