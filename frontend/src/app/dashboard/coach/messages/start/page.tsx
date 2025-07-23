"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllUsersByRole } from "@/utils/firestore/getAllUsersByRole";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  
  serverTimestamp,
} from "firebase/firestore";

export default function StartCoachChatPage() {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      getAllUsersByRole("client").then(setClients);
    }
  }, []);

  const startChat = async (clientId: string) => {
    if (!user) return;

    const participants = [user.id, clientId].sort();
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
      <h1 className="text-2xl font-bold mb-4">👤 Yeni Mesaj</h1>
      <ul className="space-y-2">
        {clients.map((client) => (
          <li key={client.id}>
            <button
              onClick={() => startChat(client.id)}
              className="w-full text-left p-3 rounded border hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {client.name}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
