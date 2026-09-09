"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LayoutGrid, MessageSquare, Bell, MoreHorizontal, User, Users, Camera, Target, ClipboardList, CreditCard, Settings, LogOut } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

type Props = {
  unreadNotifications?: number;
  unreadMessages?: number;
};

export default function MobileUserBottomNav({
  unreadNotifications = 0,
  unreadMessages = 0,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const primaryItems = [
    { href: "/dashboard/user", label: "Panel", Icon: Home },
    { href: "/dashboard/user/programs", label: "Programlarım", Icon: LayoutGrid },
    { href: "/dashboard/user/messages", label: "Mesajlar", Icon: MessageSquare, badge: unreadMessages },
    { href: "/dashboard/user/notifications?tab=unread", label: "Bildirimler", Icon: Bell, badge: unreadNotifications },
  ];

  // Everything that doesn't fit in the bottom bar lives in the "Diğer" sheet —
  // same set of destinations the desktop sidebar (SidebarNavUser) exposes directly.
  const moreItems = [
    { href: "/dashboard/user/profile", label: "Profil", Icon: User },
    { href: "/dashboard/user/koclarimiz", label: "Koçlarım", Icon: Users },
    { href: "/dashboard/user/ilerleme", label: "İlerleme", Icon: Camera },
    { href: "/dashboard/user/aliskanliklar", label: "Alışkanlıklar", Icon: Target },
    { href: "/dashboard/user/check-in", label: "Check-in", Icon: ClipboardList },
    { href: "/dashboard/user/payments", label: "Ödemelerim", Icon: CreditCard },
    { href: "/dashboard/user/settings", label: "Ayarlar", Icon: Settings },
  ];

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    return pathname === base || pathname.startsWith(base + "/");
  };

  const moreActive = moreItems.some((i) => isActive(i.href));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    router.push("/login");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-background/95 backdrop-blur border-t md:hidden">
      <ul className="h-full grid grid-cols-5">
        {primaryItems.map(({ href, label, Icon, badge }) => {
          const active = isActive(href);
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

        <li className="flex items-center justify-center">
          <Sheet>
            <SheetTrigger asChild>
              <button
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                  moreActive ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Diğer"
                aria-label="Diğer"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Diğer</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 pb-4">
                {moreItems.map(({ href, label, Icon }) => (
                  <SheetClose asChild key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                        isActive(href) ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="my-2 border-t" />
                <SheetClose asChild>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    Çıkış Yap
                  </button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
