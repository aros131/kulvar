"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import SidebarNavUser from "@/components/ui/SidebarNavUser";
import MobileUserBottomNav from "@/components/nav/MobileUserBottomNav";
import { ArrowRight } from "lucide-react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

type LocalUser = { id: string; name: string; role: string; token?: string };

interface ChatItem {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: Timestamp;
  otherUserId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  unreadCount?: number;
}

export default function UserMessagesPage() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [allChats, setAllChats] = useState<ChatItem[]>([]);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // --- helpers ---
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;

  async function fetchUserFromAPI(userId: string) {
    // Try a couple of likely endpoints; adjust to your backend if different
    const endpoints = [`${API}/users/${userId}`, `${API}/user/${userId}`, `${API}/profiles/${userId}`];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          // be generous with field names
          return {
            name: data?.name || data?.fullName || data?.username,
            profilePicture:
              data?.profilePicture || data?.avatar || data?.image || data?.photoURL || data?.photo,
          };
        }
      } catch {
        // ignore and try next
      }
    }
    return null;
  }

  const initials = (name?: string) =>
    (name || "")
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  // --- bootstrap ---
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const parsed: LocalUser = JSON.parse(stored);
    setUser({ ...parsed, token });

    const q = query(collection(db, "chats"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawChats: ChatItem[] = snapshot.docs
        .map((d) => {
          const data = d.data() as any;
          if (!Array.isArray(data.participants)) return null;
          if (!parsed.id || !data.participants.includes(parsed.id)) return null;
          return {
            id: d.id,
            participants: data.participants,
            lastMessage: data.lastMessage || "",
            updatedAt: data.updatedAt || { seconds: 0 },
            unreadCount: data[`unread_${parsed.id}`] || 0,
          } as ChatItem;
        })
        .filter(Boolean) as ChatItem[];

      // Enrich each chat with other participant's name + avatar
      const enriched = await Promise.all(
        rawChats.map(async (chat) => {
          const otherId = chat.participants.find((pid) => pid !== parsed.id);
          if (!otherId) return { ...chat, otherUserName: "Bilinmeyen" };

          // Firestore "users" doc (name fallback)
          const fsDoc = await getDoc(doc(db, "users", otherId)).catch(() => null);
          const fsData = fsDoc?.exists() ? (fsDoc.data() as any) : null;

          // MongoDB API (real profile picture)
          const apiUser = await fetchUserFromAPI(otherId);

          return {
            ...chat,
            otherUserId: otherId,
            otherUserName: apiUser?.name || fsData?.name || "Bilinmeyen",
            otherUserAvatar: apiUser?.profilePicture || fsData?.profilePicture || undefined,
          };
        })
      );

      setChats(enriched);
      setAllChats(enriched);
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setChats(allChats.filter((c) => (c.otherUserName || "").toLowerCase().includes(term)));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    for (const chat of chats) {
      const chatRef = doc(db, "chats", chat.id);
      await updateDoc(chatRef, { [`unread_${user.id}`]: 0 });
    }
  };

  const unreadTotal = useMemo(
    () => chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [chats]
  );

  if (!user) {
    return (
      <div className="relative flex">
        {/* Sidebar hidden on small screens */}
        <div className="hidden md:block">
          <SidebarNavUser unreadCount={0} />
        </div>
        <main className="w-full min-h-screen md:ml-16 pb-16 md:pb-0">
          <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
            <p className="text-center text-zinc-500">Yükleniyor...</p>
          </div>
        </main>
        <MobileUserBottomNav />
      </div>
    );
  }

  return (
    <div className="relative flex">
      {/* Sidebar on md+ only */}
      <div className="hidden md:block">
        <SidebarNavUser unreadCount={unreadTotal} />
      </div>

      {/* Content */}
      <main className="w-full min-h-screen md:ml-16 pb-16 md:pb-0">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 md:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">📨 Mesajlar</h1>
            <div className="flex gap-2">
              <button
                onClick={markAllAsRead}
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                Tümünü okundu yap
              </button>
              <Link
                href="/dashboard/user/messages/start"
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 px-3 py-2 rounded-md text-sm transition"
              >
                ➕ Yeni Mesaj <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring border-border"
            />
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse h-20 rounded-xl bg-muted" />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center">Hiç mesaj yok.</p>
          ) : (
            <ul className="space-y-3">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <Link
                    href={`/dashboard/${user.role}/messages/${chat.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border p-4 hover:bg-muted/50 transition"
                  >
                    {/* Avatar */}
                    <div className="relative w-10 h-10 shrink-0">
                      {chat.otherUserAvatar ? (
                        <Image
                          src={chat.otherUserAvatar}
                          alt={chat.otherUserName || "profil"}
                          fill
                          sizes="40px"
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600 text-zinc-800 dark:text-zinc-100 flex items-center justify-center text-xs font-semibold">
                          {initials(chat.otherUserName)}
                        </div>
                      )}
                    </div>

                    {/* Texts */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground truncate">
                          {chat.otherUserName}
                        </span>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <span className="ml-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {chat.lastMessage || "Henüz mesaj yok."}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
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
        </div>
      </main>

      {/* Bottom nav on mobile */}
      <MobileUserBottomNav />
    </div>
  );
}
