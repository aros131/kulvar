"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
}

export default function CoachChatDetailPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", String(chatId), "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, "id">),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    await addDoc(collection(db, "chats", String(chatId), "messages"), {
      text: newMessage,
      senderId: user.id,
      timestamp: serverTimestamp(),
      read: false,
    });

    setNewMessage("");

    // Auto scroll
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <main className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Sohbet</h1>

      <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg h-[65vh] overflow-y-auto flex flex-col gap-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[80%] p-2 rounded-md ${
              msg.senderId === user?.id
                ? "bg-blue-500 text-white self-end"
                : "bg-white dark:bg-zinc-700 self-start"
            }`}
          >
            <p>{msg.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Mesajınızı yazın..."
          className="flex-1 p-2 rounded border dark:bg-zinc-900 dark:text-white"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Gönder
        </button>
      </div>
    </main>
  );
}
