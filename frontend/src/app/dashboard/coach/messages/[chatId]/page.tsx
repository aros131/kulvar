"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import SidebarNavCoach from "@/components/ui/SidebarNavCoach";
import MobileCoachBottomNav from "@/components/nav/MobileCoachBottomNav";
import ChatWindow from "@/components/chat/ChatWindow";

export default function CoachChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  if (!chatId) return null;
  return (
    <div className="relative h-[calc(100dvh-env(safe-area-inset-top))] overflow-hidden">
      <div className="hidden md:block">
        <SidebarNavCoach unreadCount={0} />
      </div>
      <main
        className={`h-full flex flex-col overflow-hidden ml-0 md:ml-16 md:pb-0 ${
          keyboardOpen ? "pb-0" : "pb-[calc(3.5rem+env(safe-area-inset-bottom))]"
        }`}
      >
        <ChatWindow
          chatId={chatId}
          myRole="coach"
          backHref="/dashboard/coach/messages"
          onComposerFocusChange={setKeyboardOpen}
        />
      </main>
      {!keyboardOpen && <MobileCoachBottomNav />}
    </div>
  );
}
