"use client";
import { useParams } from "next/navigation";
import SidebarNavUser from "@/components/ui/SidebarNavUser";
import MobileUserBottomNav from "@/components/nav/MobileUserBottomNav";
import ChatWindow from "@/components/chat/ChatWindow";

export default function UserChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  if (!chatId) return null;
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex shrink-0">
        <SidebarNavUser unreadCount={0} />
      </div>
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <ChatWindow chatId={chatId} myRole="user" backHref="/dashboard/user/messages" />
      </main>
      <MobileUserBottomNav />
    </div>
  );
}
