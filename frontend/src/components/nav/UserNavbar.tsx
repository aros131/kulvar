"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type Props = {
  /** Unread messages/notifications shown next to “Mesajlar” */
  unreadCount?: number;
};

const tabs = [
  { href: "/dashboard/user", label: "Panel" },
  { href: "/dashboard/user/koclarimiz", label: "Koçlarımız" },
  { href: "/dashboard/user/messages", label: "Mesajlar" },
  { href: "/dashboard/user/settings", label: "Ayarlar" },
];

export default function UserNavbar({ unreadCount = 0 }: Props) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard/user" className="font-semibold">PerSe</Link>

          <nav className="hidden md:flex items-center gap-3 text-sm">
            {tabs.map((t) => {
              const active = pathname === t.href || pathname.startsWith(t.href + "/");
              const base =
                "inline-flex items-center gap-2 transition-colors";
              const cls = active
                ? `${base} text-foreground font-medium`
                : `${base} text-muted-foreground hover:text-foreground`;

              const isMessages = t.href.includes("/messages");
              const count =
                unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

              return (
                <Link key={t.href} href={t.href} className={cls}>
                  <span>{t.label}</span>
                  {isMessages && count && (
                    <span
                      className="
                        inline-flex items-center justify-center
                        min-w-[1.25rem] h-5 px-1.5 rounded-full
                        bg-primary/15 text-primary text-[11px] font-semibold
                        leading-none"
                      aria-label={`${count} okunmamış`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/images/user.png" alt="Me" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
