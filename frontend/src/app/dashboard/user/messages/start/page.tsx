"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function StartUserChatPage() {
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([]);
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);

      const fetchCoaches = async () => {
        const querySnapshot = await getDocs(collection(db, "users"));
        const coachUsers: { id: string; name: string }[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.role === "coach") {
            coachUsers.push({ id: docSnap.id, name: data.name });
          }
        });
        setCoaches(coachUsers);
        setLoading(false);
      };

      fetchCoaches();
    }
  }, []);

  const startChat = async (coachId: string) => {
    if (!user) return;

    const participants = [user.id, coachId].sort();
    const chatId = participants.join("_");

    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participants,
        lastMessage: "",
        updatedAt: serverTimestamp(),
        [`unread_${coachId}`]: 0,
        [`unread_${user.id}`]: 0,
      });
    }

    router.push(`/dashboard/user/messages/${chatId}`);
  };

  return (
    <main className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-zinc-800 dark:text-zinc-100">👤 Yeni Mesaj</h1>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-16 bg-zinc-200 dark:bg-zinc-700 rounded-xl"
            />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {coaches.map((coach) => (
            <li key={coach.id}>
              <button
                onClick={() => startChat(coach.id)}
                className="w-full text-left p-4 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-blue-50 dark:hover:bg-zinc-800 transition"
              >
                <div className="font-medium text-zinc-800 dark:text-zinc-100">
                  {coach.name}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Koç</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}