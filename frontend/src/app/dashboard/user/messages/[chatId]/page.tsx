"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import SidebarNavUser from "@/components/ui/SidebarNavUser";
import MobileUserBottomNav from "@/components/nav/MobileUserBottomNav";
import ChatWindow from "@/components/chat/ChatWindow";

export default function UserChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  if (!chatId) return null;
  return (
    <div className="relative h-[calc(100dvh-env(safe-area-inset-top))] overflow-hidden">
      <div className="hidden md:block">
        <SidebarNavUser unreadCount={0} />
      </div>
      <main
        className={`h-full flex flex-col overflow-hidden ml-0 md:ml-16 md:pb-0 ${
          keyboardOpen ? "pb-0" : "pb-[calc(3.5rem+env(safe-area-inset-bottom))]"
        }`}
      >
        <ChatWindow
          chatId={chatId}
          myRole="user"
          backHref="/dashboard/user/messages"
          onComposerFocusChange={setKeyboardOpen}
        />
      </main>
      {!keyboardOpen && <MobileUserBottomNav />}
    </div>
  );
}
