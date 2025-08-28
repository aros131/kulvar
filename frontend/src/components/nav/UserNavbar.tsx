"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const tabs = [
  { href: "/dashboard/user", label: "Panel" },
  { href: "/dashboard/user/koclarimiz", label: "Koçlarımız" },
  { href: "/dashboard/user/messages", label: "Mesajlar" },   // keep or change
  { href: "/dashboard/user/settings", label: "Ayarlar" },     // keep or change
];

export default function UserNavbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-6">
<Link href="/dashboard/user" className="font-semibold">PerSe</Link>

          <nav className="hidden md:flex items-center gap-3 text-sm">
            {tabs.map(t => {
              const active = pathname === t.href || pathname.startsWith(t.href + "/");
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}
                >
                  {t.label}
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
