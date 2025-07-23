"use client";

import { useEffect, useState } from "react";
import { getUserChats } from "@/utils/firestore/getUserChats";
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import Link from "next/link";

interface ChatItem {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: Timestamp;
  otherUserName?: string;
}

export default function CoachMessagesPage() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);

      const loadChats = async () => {
        const rawChats = await getUserChats(parsed.id);

        const enrichedChats = await Promise.all(
          rawChats.map(async (chat) => {
            const c = chat as ChatItem;
            const otherUserId = c.participants.find((id: string) => id !== parsed.id);
            const userDoc = await getDoc(doc(db, "users", otherUserId!));
            const otherUser = userDoc.data();

            return {
              ...c,
              otherUserName: otherUser?.name || "Bilinmeyen",
            };
          })
        );

        setChats(enrichedChats);
      };

      loadChats();
    }
  }, []);

  if (!user) return <div className="p-4">Yükleniyor...</div>;

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📨 Mesajlar</h1>

      <ul className="space-y-3">
        {chats.map((chat) => (
          <li key={chat.id}>
            <Link
              href={`/dashboard/${user.role}/messages/${chat.id}`}
              className="block border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <div className="font-medium">{chat.otherUserName}</div>
              <div className="text-sm text-zinc-500 truncate">{chat.lastMessage}</div>
              <div className="text-xs text-zinc-400">
                {new Date(chat.updatedAt?.seconds * 1000).toLocaleString()}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
