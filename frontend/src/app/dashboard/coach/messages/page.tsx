"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    if (!stored) return;
    const parsed = JSON.parse(stored);
    setUser(parsed);

    const q = query(collection(db, "chats"), orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const raw = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          if (!Array.isArray(data.participants)) return null;

          return {
            id: doc.id,
            participants: data.participants,
            lastMessage: data.lastMessage || "",
            updatedAt: data.updatedAt || { seconds: 0 },
          };
        })
        .filter((chat) => chat && chat.participants.includes(parsed.id)) as ChatItem[];

      const enriched = await Promise.all(
        raw.map(async (chat) => {
          const otherId = chat.participants.find((id) => id !== parsed.id);
          const userDoc = await getDoc(doc(db, "users", otherId!));
          const otherUser = userDoc.data();
          return {
            ...chat,
            otherUserName: otherUser?.name || "Bilinmeyen",
          };
        })
      );

      setChats(enriched);
    });

    return () => unsubscribe();
  }, []);

  if (!user) return <div className="p-4">Yükleniyor...</div>;

  return (
    <main className="p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📨 Mesajlar</h1>
        <Link
          href="/dashboard/coach/messages/start"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition"
        >
          ➕ Yeni Mesaj <ArrowRight size={16} />
        </Link>
      </div>

      {chats.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center">Hiç mesaj yok.</p>
      ) : (
        <ul className="space-y-3">
          {chats.map((chat) => (
            <li key={chat.id}>
              <Link
                href={`/dashboard/${user.role}/messages/${chat.id}`}
                className="block border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {chat.otherUserName}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                  {chat.lastMessage || "Henüz mesaj yok."}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  {new Date(chat.updatedAt?.seconds * 1000).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
