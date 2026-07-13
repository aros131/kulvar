"use client";

import SidebarNavUser from "@/components/ui/SidebarNavUser";
import MobileUserBottomNav from "@/components/nav/MobileUserBottomNav";

interface Props {
  children: React.ReactNode;
  unreadCount?: number;
  unreadMessages?: number;
}

export default function UserPageShell({ children, unreadCount = 0, unreadMessages = 0 }: Props) {
  return (
    <div className="relative flex min-h-screen">
      <div className="hidden md:block">
        <SidebarNavUser unreadCount={unreadCount} unreadMessages={unreadMessages} />
      </div>

      <main className="ml-0 md:ml-16 w-full min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 pb-20 md:pb-0">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[260px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(0,0,0,0.03),rgba(0,0,0,0)_60%)]"
        />
        {children}
      </main>

      <MobileUserBottomNav unreadNotifications={unreadCount} unreadMessages={unreadMessages} />
    </div>
  );
}
