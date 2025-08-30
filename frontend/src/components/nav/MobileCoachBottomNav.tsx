// components/nav/MobileCoachBottomNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Users, Bell, User } from "lucide-react";

type Props = { unreadCount?: number };

const items = [
  { href: "/dashboard/coach", label: "Panel", Icon: Home, key: "home" },
  { href: "/dashboard/coach/programs", label: "Programlar", Icon: Dumbbell, key: "programs" },
  { href: "/dashboard/coach/clients", label: "Danışanlar", Icon: Users, key: "clients" },
  { href: "/dashboard/coach/notifications", label: "Bildirim", Icon: Bell, key: "notifications" },
  { href: "/dashboard/coach/profile", label: "Profil", Icon: User, key: "profile" },
];

export default function MobileCoachBottomNav({ unreadCount = 0 }: Props) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-background/95 backdrop-blur border-t md:hidden">
      <ul className="h-full grid grid-cols-5">
        {items.map(({ href, label, Icon, key }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex items-center justify-center">
              <Link
                href={href}
                className={`relative flex flex-col items-center text-[11px] ${active ? "text-foreground" : "text-muted-foreground"}`}
                aria-current={active ? "page" : undefined}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {key === "notifications" && unreadCount > 0 && (
                    <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold leading-4 text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

