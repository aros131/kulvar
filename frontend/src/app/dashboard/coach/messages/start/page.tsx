"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllUsers } from "@/utils/firestore/getAllUsers";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function StartCoachChatPage() {
  const [users, setUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      getAllUsers().then((allUsers) => {
        const filtered = allUsers.filter((u) => u.id !== parsed.id);
        setUsers(filtered);
      });
    }
  }, []);

  const startChat = async (otherUserId: string) => {
    if (!user) return;

    const participants = [user.id, otherUserId].sort();
    const chatId = participants.join("_");

    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participants,
        lastMessage: "",
        updatedAt: serverTimestamp(),
      });
    }

    router.push(`/dashboard/coach/messages/${chatId}`);
  };

  return (
    <main className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">👥 Tüm Kullanıcılar</h1>
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id}>
            <button
              onClick={() => startChat(u.id)}
              className="w-full text-left p-3 rounded border hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {u.name} <span className="text-xs text-zinc-500">({u.role})</span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
