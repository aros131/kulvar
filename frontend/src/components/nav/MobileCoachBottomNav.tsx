"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Dumbbell, Users, Bell, MessageSquare, User, LogOut } from "lucide-react";

type Props = {
  unreadNotifications?: number;
  unreadMessages?: number;
};

export default function MobileCoachBottomNav({
  unreadNotifications = 0,
  unreadMessages = 0,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const items = [
    { href: "/dashboard/coach", label: "Panel", Icon: Home, key: "home" },
    { href: "/dashboard/coach/programs", label: "Programlar", Icon: Dumbbell, key: "programs" },
    { href: "/dashboard/coach/clients", label: "Danışanlar", Icon: Users, key: "clients" },
    { href: "/dashboard/coach/messages", label: "Mesajlar", Icon: MessageSquare, key: "messages", badge: unreadMessages },
    { href: "/dashboard/coach/notifications?tab=unread", label: "Bildirim", Icon: Bell, key: "notifications", badge: unreadNotifications },
    { href: "/dashboard/coach/profile", label: "Profil", Icon: User, key: "profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-background/95 backdrop-blur border-t md:hidden">
      <ul className="h-full grid grid-cols-7">
        {items.map(({ href, label, Icon, key, badge }) => {
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
                  {(badge ?? 0) > 0 && (
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
        <li className="flex items-center justify-center">
          <button
            onClick={handleLogout}
            className="relative flex flex-col items-center text-[11px] text-muted-foreground hover:text-red-500"
            aria-label="Çıkış Yap"
          >
            <LogOut className="h-5 w-5" />
            <span>Çıkış</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
