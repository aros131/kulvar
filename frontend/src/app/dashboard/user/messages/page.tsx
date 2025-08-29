"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

/* ------------------------------- Types ------------------------------- */
type CurrentUser = {
  id: string;
  name?: string;
  email?: string;
  role: string;
  profilePicture?: string;
};

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

/* ------------------------------ Utilities --------------------------- */
const cleanToken = (): string | null => {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const trimmed = raw.replace(/^"+|"+$/g, "").trim();
    return trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
  } catch {
    return null;
  }
};

const initials = (name?: string) =>
  (name || "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* -------------------------------- Page ------------------------------ */
export default function UserMessagesPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [allChats, setAllChats] = useState<ChatItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // simple in-memory cache for Firestore user lookups
  const profileCache = useRef<Map<string, { name?: string; profilePicture?: string } | null>>(
    new Map()
  );

  // Resolve token once and keep it in sync
  useEffect(() => {
    setToken(cleanToken() ?? null);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setToken(cleanToken() ?? null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Always return valid HeadersInit
  const authHeaders = useMemo(() => {
    const h = new Headers();
    if (typeof token === "string" && token.trim() !== "") {
      h.set("Authorization", `Bearer ${token}`);
    }
    return h; // Headers = valid HeadersInit
  }, [token]);

  // Fetch the REAL current user from /profile (same logic as your profile page)
  useEffect(() => {
    if (token === undefined) return; // still resolving
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        const res = await fetch(`${API}/profile`, {
          headers: authHeaders,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`status_${res.status}`);
        const data = await res.json();

        const storedRaw = localStorage.getItem("user");
        const stored = storedRaw ? JSON.parse(storedRaw) : {};
        const id = data?._id || data?.id || stored?.id;
        const role = data?.role || stored?.role || "user";

        if (!id) {
          console.warn("No user id from /profile and local storage.");
          setUser(null);
          return;
        }

        setUser({
          id,
          role,
          name: data?.name || data?.fullName || data?.username || stored?.name,
          email: data?.email || stored?.email,
          profilePicture:
            data?.profilePicture ||
            data?.avatar ||
            data?.image ||
            data?.photoURL ||
            stored?.profilePicture,
        });
      } catch (err) {
        console.error("Profile fetch failed:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token, authHeaders]);

  // Helper: fetch other participant from Firestore only (no backend by id)
  async function fetchOtherFromFirestore(
    userId: string
  ): Promise<{ name?: string; profilePicture?: string } | null> {
    if (profileCache.current.has(userId)) {
      return profileCache.current.get(userId) ?? null;
    }
    try {
      const fsDoc = await getDoc(doc(db, "users", userId));
      if (fsDoc.exists()) {
        const d = fsDoc.data() as any;
        const result = {
          name: d?.name || d?.fullName || d?.username || undefined,
          profilePicture:
            d?.profilePicture || d?.avatar || d?.image || d?.photoURL || d?.photo || undefined,
        };
        profileCache.current.set(userId, result);
        return result;
      }
    } catch (e) {
      console.error("fetchOtherFromFirestore error:", e);
    }
    profileCache.current.set(userId, null);
    return null;
  }

  // Subscribe to chats AFTER we have the real user id
  useEffect(() => {
    if (!user?.id) return;

    const q = query(collection(db, "chats"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawChats: ChatItem[] = snapshot.docs
        .map((d) => {
          const data = d.data() as any;
          if (!Array.isArray(data.participants)) return null;
          if (!data.participants.includes(user.id)) return null;

          const updatedAt: Timestamp =
            data.updatedAt instanceof Timestamp
              ? data.updatedAt
              : data.updatedAt?.seconds && data.updatedAt?.nanoseconds
              ? new Timestamp(data.updatedAt.seconds, data.updatedAt.nanoseconds)
              : Timestamp.now();

          return {
            id: d.id,
            participants: data.participants,
            lastMessage: data.lastMessage || "",
            updatedAt,
            unreadCount: data[`unread_${user.id}`] || 0,
          } as ChatItem;
        })
        .filter(Boolean) as ChatItem[];

      const enriched = await Promise.all(
        rawChats.map(async (chat) => {
          const otherId = chat.participants.find((pid) => pid !== user.id);
          if (!otherId) return { ...chat, otherUserName: "Bilinmeyen" };

          const fsUser = await fetchOtherFromFirestore(otherId);
          return {
            ...chat,
            otherUserId: otherId,
            otherUserName: fsUser?.name || "Bilinmeyen",
            otherUserAvatar: fsUser?.profilePicture || undefined,
          };
        })
      );

      setChats(enriched);
      setAllChats(enriched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // --- UI handlers ---
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setChats(allChats.filter((c) => (c.otherUserName || "").toLowerCase().includes(term)));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    for (const chat of chats) {
      try {
        const chatRef = doc(db, "chats", chat.id);
        await updateDoc(chatRef, { [`unread_${user.id}`]: 0 });
      } catch (e) {
        console.error("Failed to mark read:", e);
      }
    }
  };

  const unreadTotal = useMemo(
    () => chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [chats]
  );

  // Loading / unauth states
  if (token === undefined || loading) {
    return (
      <div className="relative flex">
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

  if (!token) {
    return (
      <div className="relative flex">
        <div className="hidden md:block">
          <SidebarNavUser unreadCount={0} />
        </div>
        <main className="w-full min-h-screen md:ml-16 pb-16 md:pb-0">
          <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
            <p className="text-center text-zinc-500">Devam etmek için lütfen giriş yapın.</p>
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
          {chats.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center">Hiç mesaj yok.</p>
          ) : (
            <ul className="space-y-3">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <Link
                    href={`/dashboard/${user?.role || "user"}/messages/${chat.id}`}
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
                        {chat.updatedAt.toDate().toLocaleString("tr-TR", {
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
