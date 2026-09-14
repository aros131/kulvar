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
import { useTranslations, useLocale } from "next-intl";
import { db } from "@/lib/firebase";
import CoachPageShell from "@/components/coach/CoachPageShell";
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
    return h; // type: Headers (valid HeadersInit)
  }, [token]);

  // Fetch the REAL current user from /profile (same path/logic as your profile page)
  useEffect(() => {
    if (token === undefined) return; // still resolving token
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

        // fallbacks from localStorage "user" if backend omits fields
        const storedRaw = localStorage.getItem("user");
        const stored = storedRaw ? JSON.parse(storedRaw) : {};
        const id = data?._id || data?.id || stored?.id;
        const role = data?.role || stored?.role || "user";

        if (!id) {
          console.warn("No user id from /profile and storage.");
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

  // Helper: fetch any user's public profile from backend first, then Firestore as fallback
  async function fetchUserById(
    userId: string
  ): Promise<{ name?: string; profilePicture?: string } | null> {
    const endpoints = [`${API}/users/${userId}`];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, { headers: authHeaders, cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // /users/:id returns { user: {...}, programs: [...] }
          const u = data?.user ?? data;
          return {
            name: u?.name || u?.fullName || u?.username,
            profilePicture: u?.profilePicture || u?.avatar || u?.image || u?.photoURL || u?.photo,
          };
        }
      } catch {
        // try next
      }
    }
    // Firestore fallback
    try {
      const fsDoc = await getDoc(doc(db, "users", userId));
      if (fsDoc.exists()) {
        const d = fsDoc.data() as any;
        return { name: d?.name, profilePicture: d?.profilePicture };
      }
    } catch {
      // ignore
    }
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
              : (data.updatedAt?.seconds && data.updatedAt?.nanoseconds
                  ? new Timestamp(data.updatedAt.seconds, data.updatedAt.nanoseconds)
                  : Timestamp.now());

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

          const apiUser = await fetchUserById(otherId);
          return {
            ...chat,
            otherUserId: otherId,
            otherUserName: apiUser?.name || t("unknownUser"),
            otherUserAvatar: apiUser?.profilePicture || undefined,
          };
        })
      );

      setChats(enriched);
      setAllChats(enriched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]); // authHeaders captured for fetchUserById

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

  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const unreadTotal = useMemo(
    () => chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [chats]
  );

  // Loading / unauth states
  if (token === undefined || loading) {
    return (
      <CoachPageShell>
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
          <p className="text-center text-muted-foreground">{t("loading")}</p>
        </div>
      </CoachPageShell>
    );
  }

  if (!token) {
    return (
      <CoachPageShell>
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
          <p className="text-center text-muted-foreground">{t("pleaseLogin")}</p>
        </div>
      </CoachPageShell>
    );
  }

  return (
    <CoachPageShell unreadCount={unreadTotal}>
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
              <Link href="/dashboard/coach/messages/start">
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
                  href={`/dashboard/coach/messages/${chat.id}`}
                  className="flex items-center gap-3 rounded-2xl border bg-card p-4 hover:shadow-sm hover:border-primary/40 transition-all"
                >
                  {/* Avatar */}
                  <div className="relative w-11 h-11 shrink-0">
                    {chat.otherUserAvatar && /^https?:\/\//.test(chat.otherUserAvatar) && !imgErrors.has(chat.id) ? (
                      <Image
                        src={chat.otherUserAvatar}
                        alt={chat.otherUserName || "profil"}
                        fill
                        sizes="44px"
                        className="rounded-xl object-cover"
                        unoptimized
                        onError={() => setImgErrors(prev => new Set([...prev, chat.id]))}
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
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
    </CoachPageShell>
  );
}
