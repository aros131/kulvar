"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import CoachPageShell from "@/components/coach/CoachPageShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

type Client = {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string | null;
};

const initials = (name?: string) =>
  (name || "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function StartCoachChatPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    const userId = stored ? (JSON.parse(stored) as { id?: string }).id ?? null : null;
    setCoachId(userId);

    fetch(`${API}/auth/users?role=user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
    );
  }, [search, clients]);

  const startChat = async (clientId: string) => {
    if (!coachId) return;
    const participants = [coachId, clientId].sort();
    const chatId = participants.join("_");

    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participants,
        lastMessage: "",
        updatedAt: serverTimestamp(),
        [`unread_${clientId}`]: 0,
        [`unread_${coachId}`]: 0,
      });
    }

    router.push(`/dashboard/coach/messages/${chatId}`);
  };

  return (
    <CoachPageShell>
      <section className="max-w-3xl mx-auto px-4 py-8 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Yeni Mesaj</h1>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Danışan ara…"
            className="w-full h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring border-border"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse h-16 rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-10">
            {clients.length === 0 ? "Sistemde kayıtlı danışan yok." : "Arama sonucu bulunamadı."}
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((client) => (
              <li key={client._id}>
                <button
                  onClick={() => startChat(client._id)}
                  className="w-full rounded-xl border border-border p-4 hover:bg-muted/50 transition flex items-center gap-3 text-left"
                >
                  <div className="relative w-10 h-10 shrink-0">
                    {client.profilePicture ? (
                      <Image
                        src={client.profilePicture}
                        alt={client.name}
                        fill
                        sizes="40px"
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600 text-foreground dark:text-zinc-100 flex items-center justify-center text-xs font-semibold">
                        {initials(client.name)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">{client.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{client.email}</div>
                  </div>
                  <span className="shrink-0 text-sm text-primary font-medium">Sohbete başla →</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </CoachPageShell>
  );
}
