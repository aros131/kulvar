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
  unreadCount?: number;
}

export default function CoachMessagesPage() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [allChats, setAllChats] = useState<ChatItem[]>([]);
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const parsed = JSON.parse(stored);
    setUser(parsed);

    const q = query(collection(db, "chats"), orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawChats = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          if (!Array.isArray(data.participants)) return null;
          if (!data.participants.includes(parsed.id)) return null;

          return {
            id: doc.id,
            participants: data.participants,
            lastMessage: data.lastMessage || "",
            updatedAt: data.updatedAt || { seconds: 0 },
            unreadCount: data.unreadCount || 0,
          };
        })
        .filter(Boolean) as ChatItem[];

      const enrichedChats = await Promise.all(
        rawChats.map(async (chat) => {
          const otherId = chat.participants.find((id) => id !== parsed.id);
          if (!otherId) return { ...chat, otherUserName: "Bilinmeyen" };

          const userDoc = await getDoc(doc(db, "users", otherId));
          const otherUser = userDoc.data();

          return {
            ...chat,
            otherUserName: otherUser?.name || "Bilinmeyen",
          };
        })
      );

      setChats(enrichedChats);
      setAllChats(enrichedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setChats(
      allChats.filter((c) =>
        c.otherUserName?.toLowerCase().includes(term)
      )
    );
  };

  if (!user) {
    return (
      <main className="p-4 max-w-xl mx-auto">
        <p className="text-center text-zinc-500">Yükleniyor...</p>
      </main>
    );
  }

  return (
    <main className="p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">📨 Mesajlar</h1>
        <Link
          href="/dashboard/coach/messages/start"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition"
        >
          ➕ Yeni Mesaj <ArrowRight size={16} />
        </Link>
      </div>

      <input
        type="text"
        placeholder="Kullanıcı ara..."
        value={searchTerm}
        onChange={handleSearch}
        className="w-full mb-4 p-2 rounded border border-zinc-300 dark:border-zinc-600"
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-20 bg-zinc-200 dark:bg-zinc-700 rounded-xl"
            />
          ))}
        </div>
      ) : chats.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center">Hiç mesaj yok.</p>
      ) : (
        <ul className="space-y-3">
          {chats.map((chat) => (
            <li key={chat.id}>
              <Link
                href={`/dashboard/${user.role}/messages/${chat.id}`}
                className="flex items-center gap-3 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 hover:bg-blue-50 dark:hover:bg-zinc-700 transition"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-semibold">
                  {chat.otherUserName?.split(" ").map(w => w[0]).join("")}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-zinc-800 dark:text-zinc-100 flex items-center justify-between">
                    <span>{chat.otherUserName}</span>
                    {chat.unreadCount && chat.unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                    {chat.lastMessage || "Henüz mesaj yok."}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    {new Date(chat.updatedAt?.seconds * 1000).toLocaleString("tr-TR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
