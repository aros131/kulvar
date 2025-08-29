"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
import SidebarNavUser from "@/components/ui/SidebarNavUser";
import MobileUserBottomNav from "@/components/nav/MobileUserBottomNav";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

type LocalUser = { id: string; name: string; role: string; token?: string };

type Coach = {
  id: string;
  name: string;
  role?: string;
  avatar?: string | null;
};

export default function StartUserChatPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [allCoaches, setAllCoaches] = useState<Coach[]>([]);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;

  // Try to fetch profile from your MongoDB-backed API (real pp), fall back to Firestore data
  async function fetchUserFromAPI(userId: string) {
    const endpoints = [`${API}/users/${userId}`, `${API}/user/${userId}`, `${API}/profiles/${userId}`];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          return {
            name: data?.name || data?.fullName || data?.username,
            profilePicture:
              data?.profilePicture || data?.avatar || data?.image || data?.photoURL || data?.photo,
          };
        }
      } catch {}
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

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const parsed: LocalUser = JSON.parse(stored);
    setUser({ ...parsed, token });

    (async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const list: Coach[] = [];
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data() as any;
          if (data?.role === "coach") {
            // First collect from Firestore
            const fsCoach: Coach = {
              id: docSnap.id,
              name: data.name || "Bilinmeyen",
              role: "coach",
              avatar: data.profilePicture || null,
            };
            // Try to enrich from API (MongoDB)
            const apiUser = await fetchUserFromAPI(docSnap.id);
            list.push({
              ...fsCoach,
              name: apiUser?.name || fsCoach.name,
              avatar: apiUser?.profilePicture ?? fsCoach.avatar ?? null,
            });
          }
        }
        setCoaches(list);
        setAllCoaches(list);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return coaches;
    return coaches.filter((c) => c.name.toLowerCase().includes(term));
  }, [search, coaches]);

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
    <div className="relative flex">
      {/* Sidebar on md+ only */}
      <div className="hidden md:block">
        <SidebarNavUser unreadCount={0} />
      </div>

      <main className="w-full min-h-screen md:ml-16 pb-16 md:pb-0">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 md:py-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">👤 Yeni Mesaj</h1>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Koç ara…"
              className="w-full h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring border-border"
            />
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse h-16 rounded-xl bg-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center">Uygun koç bulunamadı.</p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((coach) => (
                <li key={coach.id}>
                  <button
                    onClick={() => startChat(coach.id)}
                    className="w-full rounded-xl border border-border p-4 hover:bg-muted/50 transition flex items-center gap-3 text-left"
                  >
                    {/* Avatar */}
                    <div className="relative w-10 h-10 shrink-0">
                      {coach.avatar ? (
                        <Image
                          src={coach.avatar}
                          alt={coach.name}
                          fill
                          sizes="40px"
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600 text-zinc-800 dark:text-zinc-100 flex items-center justify-center text-xs font-semibold">
                          {initials(coach.name)}
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground truncate">{coach.name}</div>
                      <div className="text-sm text-muted-foreground">Koç</div>
                    </div>

                    {/* CTA */}
                    <span className="shrink-0 text-sm text-primary font-medium">Sohbete başla →</span>
                  </button>
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

