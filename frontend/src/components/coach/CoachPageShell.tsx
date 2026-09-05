"use client";

import SidebarNavCoach from "@/components/ui/SidebarNavCoach";
import MobileCoachBottomNav from "@/components/nav/MobileCoachBottomNav";

interface Props {
  children: React.ReactNode;
  unreadCount?: number;
}

export default function CoachPageShell({ children, unreadCount = 0 }: Props) {
  return (
    <div className="relative flex min-h-screen">
      <div className="hidden md:block">
        <SidebarNavCoach unreadCount={unreadCount} />
      </div>

      <main className="ml-0 md:ml-16 w-full min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 pb-20 md:pb-0">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[260px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(0,0,0,0.03),rgba(0,0,0,0)_60%)]"
        />
        {children}
      </main>

      <MobileCoachBottomNav unreadNotifications={unreadCount} />
    </div>
  );
}
