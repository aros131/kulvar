// src/app/dashboard/user/messages/page.tsx
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
import { useTranslations, useLocale } from "next-intl";
import { db } from "@/lib/firebase";
import UserPageShell from "@/components/user/UserPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCirclePlus, MessageSquare, Search } from "lucide-react";

const LOCALE_TAG: Record<string, string> = { tr: "tr-TR", en: "en-US", fr: "fr-FR" };

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

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
  const t = useTranslations("messagesList");
  const locale = useLocale();
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [allChats, setAllChats] = useState<ChatItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // counts for badges
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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
    return h;
  }, [token]);

  // Fetch the REAL current user from /profile
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

  // Helper: fetch other participant from Firestore
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
          if (!otherId) return { ...chat, otherUserName: t("unknownUser") };

          const fsUser = await fetchOtherFromFirestore(otherId);
          return {
            ...chat,
            otherUserId: otherId,
            otherUserName: fsUser?.name || t("unknownUser"),
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

  // fetch unread notifications for badges on this page too
  useEffect(() => {
    if (!token) return;
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch(`${API}/dashboard/notifications/user`, {
          headers: authHeaders,
          cache: "no-store",
        });
        const data = res.ok ? await res.json().catch(() => ({})) : {};
        const list = Array.isArray(data?.notifications) ? data.notifications : [];
        if (alive) setUnreadNotifications(list.filter((n: any) => !n?.isRead).length);
      } catch {
        if (alive) setUnreadNotifications(0);
      }
    };

    load();

    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);
    const id = window.setInterval(load, 30000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(id);
      alive = false;
    };
  }, [token, authHeaders]);

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

  const unreadMessagesTotal = useMemo(
    () => chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [chats]
  );

  // Loading / unauth states
  if (token === undefined || loading) {
    return (
      <UserPageShell>
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
          <p className="text-center text-muted-foreground">{t("loading")}</p>
        </div>
      </UserPageShell>
    );
  }

  if (!token) {
    return (
      <UserPageShell>
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
          <p className="text-center text-muted-foreground">{t("pleaseLogin")}</p>
        </div>
      </UserPageShell>
    );
  }

  return (
    <UserPageShell unreadCount={unreadNotifications} unreadMessages={unreadMessagesTotal}>
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title").replace(/^📨\s*/, '')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("conversationsCount", { count: chats.length })}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={markAllAsRead}
              className="text-sm text-muted-foreground hover:text-foreground transition whitespace-nowrap"
            >
              {t("markAllRead")}
            </button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/dashboard/user/messages/start">
                <MessageCirclePlus className="h-4 w-4" />
                {t("newMessage").replace(/^➕\s*/, '')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>

        {/* List */}
        {chats.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center space-y-2">
            <div className="mx-auto h-12 w-12 grid place-items-center rounded-2xl bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">{t("noMessages")}</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {chats.map((chat) => (
              <li key={chat.id}>
                <Link
                  href={`/dashboard/${user?.role || "user"}/messages/${chat.id}`}
                  className="flex items-center gap-3 rounded-2xl border bg-card p-4 hover:shadow-sm hover:border-primary/40 transition-all"
                >
                  {/* Avatar */}
                  <div className="relative w-11 h-11 shrink-0">
                    {chat.otherUserAvatar ? (
                      <Image
                        src={chat.otherUserAvatar}
                        alt={chat.otherUserName || "profil"}
                        fill
                        sizes="44px"
                        className="rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600 text-foreground dark:text-zinc-100 flex items-center justify-center text-sm font-semibold">
                        {initials(chat.otherUserName)}
                      </div>
                    )}
                  </div>

                  {/* Texts */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {chat.otherUserName}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {chat.updatedAt.toDate().toLocaleString(LOCALE_TAG[locale] || "tr-TR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.lastMessage || t("noMessagePreview")}
                      </p>
                      {chat.unreadCount && chat.unreadCount > 0 && (
                        <span className="shrink-0 bg-primary text-primary-foreground text-xs font-semibold min-w-5 h-5 px-1.5 rounded-full grid place-items-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </UserPageShell>
  );
}
