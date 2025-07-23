"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  read?: boolean;
}

export default function ChatIdPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [otherUserName, setOtherUserName] = useState("Bilinmeyen");
  const [typingUser, setTypingUser] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (!chatId || !user) return;

    const q = query(collection(db, `chats/${chatId}/messages`), orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    const otherTypingRef = doc(db, `chats/${chatId}`, `typing_${(chatId as string).split("_").find((id) => id !== user.id)}`);
    const unsubTyping = onSnapshot(otherTypingRef, (snap) => {
      setTypingUser(!!snap.data()?.isTyping);
    });

    const fetchOtherUser = async () => {
      const ids = (chatId as string).split("_");
      const otherId = ids.find((id) => id !== user.id);
      if (!otherId) return;
      const docSnap = await getDoc(doc(db, "users", otherId));
      const data = docSnap.data();
      setOtherUserName(data?.name || "Bilinmeyen");

      await updateDoc(doc(db, "chats", chatId as string), {
        [`unread_${user.id}`]: 0,
      });
    };

    fetchOtherUser();
    return () => {
      unsubscribe();
      unsubTyping();
    };
  }, [chatId, user]);

  const handleSend = async () => {
    if (!text.trim() || !chatId || !user) return;

    const newMessage = {
      senderId: user.id,
      text: text.trim(),
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, `chats/${chatId}/messages`), newMessage);
    setText("");

    const otherId = (chatId as string).split("_").find((id) => id !== user.id);
    await updateDoc(doc(db, "chats", chatId as string), {
      lastMessage: newMessage.text,
      updatedAt: serverTimestamp(),
      [`unread_${otherId}`]: 1,
    });

    await setDoc(doc(db, `chats/${chatId}`, `typing_${user.id}`), {
      isTyping: false,
    });
  };

  const handleTyping = async (val: string) => {
    setText(val);
    if (chatId && user) {
      await setDoc(doc(db, `chats/${chatId}`, `typing_${user.id}`), {
        isTyping: true,
      });
    }
  };

  const stopTyping = async () => {
    if (chatId && user) {
      await setDoc(doc(db, `chats/${chatId}`, `typing_${user.id}`), {
        isTyping: false,
      });
    }
  };

  return (
    <main className="max-w-xl mx-auto p-4 flex flex-col h-screen">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-zinc-900 z-10 pb-2">
        <Link
          href={`/dashboard/${user?.role}/messages`}
          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={18} /> <span className="text-sm">Geri</span>
        </Link>
        <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          {otherUserName}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[75%] px-4 py-2 rounded-xl text-sm whitespace-pre-line break-words flex flex-col ${
              msg.senderId === user?.id
                ? "ml-auto bg-blue-600 text-white"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100"
            }`}
          >
            <span>{msg.text}</span>
            {msg.createdAt?.seconds && (
              <span className="text-[10px] text-right text-zinc-300 dark:text-zinc-400 mt-1">
                {new Date(msg.createdAt.seconds * 1000).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        ))}

        {typingUser && (
          <div className="text-sm text-zinc-400 italic px-2">Yazıyor...</div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t pt-3 mt-3 dark:border-zinc-700">
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          onBlur={stopTyping}
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
          placeholder="Mesaj yaz..."
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2"
        >
          <Send size={18} />
        </button>
      </div>
    </main>
  );
}
