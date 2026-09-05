"use client";
import { useParams } from "next/navigation";
import SidebarNavCoach from "@/components/ui/SidebarNavCoach";
import MobileCoachBottomNav from "@/components/nav/MobileCoachBottomNav";
import ChatWindow from "@/components/chat/ChatWindow";

export default function CoachChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  if (!chatId) return null;
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex shrink-0">
        <SidebarNavCoach unreadCount={0} />
      </div>
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <ChatWindow chatId={chatId} myRole="coach" backHref="/dashboard/coach/messages" />
      </main>
      <MobileCoachBottomNav />
    </div>
  );
}
