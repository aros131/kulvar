// src/app/dashboard/user/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

import SidebarNavUser from "@/components/ui/SidebarNavUser";
import MobileUserBottomNav from "@/components/nav/MobileUserBottomNav";
import OnboardingModal from "@/components/OnboardingModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Dumbbell, ChevronRight, CheckCircle2, Calendar } from "lucide-react";
import { toast } from "sonner";

import { storage, db } from "@/lib/firebase";
import { getDownloadURL, ref as sRef } from "firebase/storage";
import { collection, onSnapshot, query, where } from "firebase/firestore";

/* --------------------------------- Config --------------------------------- */

const avatarStorage = storage;
const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");
const SIGNUP_URL = (process.env.NEXT_PUBLIC_SIGNUP_URL || "/signup").replace(/\/+$/, "");

/* ------------------------------ Helper Utils ------------------------------ */

async function resolveAvatarUrl(input?: string): Promise<string> {
  const FALLBACK = "/images/user.png";
  if (!input) return FALLBACK;
  if (/^https?:\/\//i.test(input)) return input;

  try {
    if (/^gs:\/\//i.test(input)) {
      const ref = sRef(avatarStorage, input);
      return await getDownloadURL(ref);
    }
    const path = input.replace(/^\/+/, "");
    const ref = sRef(avatarStorage, path);
    return await getDownloadURL(ref);
  } catch (err) {
    console.warn("resolveAvatarUrl failed:", input, err);
    return FALLBACK;
  }
}

const cleanToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  const trimmed = raw.replace(/^"+|"+$/g, "").trim();
  return trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
};

const makeAuthHeaders = (token: string | null): Headers => {
  const h = new Headers();
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
};

const roundPct = (n: unknown) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)));

/* --------------------------------- Types ---------------------------------- */

interface UserProgram {
  programId: string;
  name: string;
  description: string;
  duration?: number | string;
  image?: string;
  progressPercentage: number;
}
interface UserProgress {
  totalCompletedSessions: number;
  assignedPrograms: number;
  goalTracking: { programId: string; progressPercentage: number }[];
}
interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
interface UserProfile {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  profilePicture: string;
  onboardingCompleted?: boolean;
}

type CoachLite = { id: string; name: string; avatarUrl?: string; role?: string };

/* ------------------------------- UI Pieces -------------------------------- */

function ProgressBar({ value, label = "İlerleme" }: { value: number; label?: string }) {
  const pct = roundPct(value);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div
        className="w-full h-2 rounded-full bg-zinc-200 dark:bg-primary/90 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
      >
        <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-1 rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={`${n} yıldız`}
        >
          <Star className="h-5 w-5" fill={n <= value ? "currentColor" : "none"} stroke="currentColor" />
        </button>
      ))}
    </div>
  );
}

function ReviewDialog({ coach, onSubmitted }: { coach: CoachLite; onSubmitted?: () => void }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const token = cleanToken();
    if (!token) {
      toast.message("Devam etmek için lütfen kayıt olun.");
      const back = encodeURIComponent(location.pathname + location.search);
      window.location.href = `${SIGNUP_URL}?redirect=${back}`;
      return;
    }
    if (!rating) {
      toast.message("Lütfen bir puan seçin.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/coaches/${coach.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment }),
      });
      if (res.ok) {
        toast.success("Yorum gönderildi!");
        setOpen(false);
        setComment("");
        setRating(5);
        onSubmitted?.();
      } else {
        const j = await res.json().catch(() => ({}));
        toast.error(j?.message || "Yorum gönderilemedi.");
      }
    } catch {
      toast.error("Sunucu hatası.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Değerlendir
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{coach.name} için Değerlendirme</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="text-sm mb-1">Puan</div>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
              <div className="text-sm mb-1">Yorum</div>
              <Textarea
                placeholder="Koç hakkındaki deneyimini yaz…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              İptal
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? "Gönderiliyor..." : "Gönder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


const PROGRAM_PHOTOS: { keywords: string[]; url: string }[] = [
  { keywords: ["koşu","run","kardiyo","cardio","kondisyon"], url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["yoga","meditasyon","nefes","pilates","esneklik"], url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["kilo verme","yağ yakma","zayıflama","fat","weight loss"], url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["kas","güç","strength","bulk","hacim"], url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["hiit","interval","circuit","tabata"], url: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["fonksiyonel","functional","crossfit","kettlebell"], url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=338&fit=crop&auto=format" },
];
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=338&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=338&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=338&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=338&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=338&fit=crop&auto=format",
];
function getProgramPhoto(name: string, index = 0) {
  const h = name.toLowerCase();
  for (const e of PROGRAM_PHOTOS) if (e.keywords.some((k) => h.includes(k))) return e.url;
  return FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length];
}

function ProgramThumb({ name, index }: { name?: string; index?: number }) {
  const pct = 0;
  const url = getProgramPhoto(name || "", index ?? 0);
  return (
    <div className="aspect-[16/9] relative overflow-hidden rounded-t-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={name || ""} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
    </div>
  );
}

/* ------------------------------ Main Component ---------------------------- */

export default function UserDashboardPage() {
  const [programs, setPrograms] = useState<UserProgram[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);

  const [unreadCount, setUnreadCount] = useState(0);        // notifications via REST
  const [unreadMessages, setUnreadMessages] = useState(0);  // messages via Firestore

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  const [myCoaches, setMyCoaches] = useState<CoachLite[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);

  const [todayEvents, setTodayEvents] = useState<{ _id: string; title: string; start: string; end: string; status: string }[]>([]);

  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(cleanToken());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setToken(cleanToken());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const headers = useMemo(() => makeAuthHeaders(token), [token]);

  // fetch profile (to get userId) + analytics + notifications + programs
  useEffect(() => {
    if (!token) return;

    let alive = true;
    const ac = new AbortController();

    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch(`${API}/profile`, { headers, cache: "no-store", signal: ac.signal });
        const data: any = res.ok ? await res.json().catch(() => ({})) : {};
        if (alive) {
          setProfile(data && typeof data === "object" ? data : null);
          const id = data?._id || data?.id || null;
          setUserId(id);
        }
      } catch {
        if (alive) {
          setProfile(null);
          setUserId(null);
        }
      } finally {
        if (alive) setLoadingProfile(false);
      }
    };

    const fetchProgress = async () => {
      setLoadingProgress(true);
      try {
        const res = await fetch(`${API}/dashboard/analytics/user`, { headers, cache: "no-store", signal: ac.signal });
        const data: any = res.ok ? await res.json().catch(() => ({})) : {};
        if (alive) {
          setProgress({
            totalCompletedSessions: Number(data.totalCompletedSessions) || 0,
            assignedPrograms: Number(data.assignedPrograms) || 0,
            goalTracking: Array.isArray(data.goalTracking) ? data.goalTracking : [],
          });
        }
      } catch {
        if (alive) setProgress({ totalCompletedSessions: 0, assignedPrograms: 0, goalTracking: [] });
      } finally {
        if (alive) setLoadingProgress(false);
      }
    };

    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const res = await fetch(`${API}/progress/all-program-progress`, { headers, cache: "no-store", signal: ac.signal });
        const data = res.ok ? await res.json().catch(() => ({})) : {};
        const list: UserProgram[] = Array.isArray((data as any).programProgress) ? (data as any).programProgress : [];
        const enriched = await Promise.all(
          list.map(async (p) => {
            try {
              const r = await fetch(`${API}/progress/user/${p.programId}`, { headers, cache: "no-store", signal: ac.signal });
              if (r.ok && (r.headers.get("content-type") || "").includes("application/json")) {
                const j = await r.json();
                return { ...p, progressPercentage: roundPct(j.progressPercentage) };
              }
            } catch {}
            return { ...p, progressPercentage: roundPct(p.progressPercentage) };
          })
        );
        if (alive) setPrograms(enriched);
      } catch {
        if (alive) setPrograms([]);
      } finally {
        if (alive) setLoadingPrograms(false);
      }
    };

    const fetchUnreadNotifications = async () => {
      try {
        const res = await fetch(`${API}/dashboard/notifications/user`, { headers, cache: "no-store", signal: ac.signal });
        const data: any = res.ok ? await res.json().catch(() => ({})) : {};
        const list: Notification[] = Array.isArray(data.notifications) ? data.notifications : [];
        if (alive) setUnreadCount(list.filter((n) => !n.isRead).length);
      } catch {
        if (alive) setUnreadCount(0);
      }
    };

    const fetchTodayEvents = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const from = encodeURIComponent(`${today}T00:00:00.000Z`);
        const to = encodeURIComponent(`${today}T23:59:59.999Z`);
        const res = await fetch(`${API}/events?from=${from}&to=${to}`, { headers, cache: "no-store", signal: ac.signal });
        const data: any = res.ok ? await res.json().catch(() => ({})) : {};
        if (alive) setTodayEvents(Array.isArray(data.events) ? data.events : []);
      } catch {
        if (alive) setTodayEvents([]);
      }
    };

    fetchProfile();
    fetchProgress();
    fetchPrograms();
    fetchUnreadNotifications();
    fetchTodayEvents();

    const interval = window.setInterval(fetchUnreadNotifications, 30000);
    const onVis = () => {
      if (document.visibilityState === "visible") fetchUnreadNotifications();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      ac.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [headers, token]);

  // real-time unread messages (Firestore)
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", userId));
    const unsub = onSnapshot(q, (snap) => {
      let total = 0;
      snap.forEach((doc) => {
        const d: any = doc.data();
        total += Number(d?.[`unread_${userId}`]) || 0;
      });
      setUnreadMessages(total);
    });
    return () => unsub();
  }, [userId]);

  // resolve profile photo
  useEffect(() => {
    let alive = true;
    (async () => {
      const input = profile?.profilePicture;
      if (!input) {
        if (alive) setProfilePhotoUrl(null);
        return;
      }
      const url = await resolveAvatarUrl(input);
      if (alive) setProfilePhotoUrl(url);
    })();
    return () => { alive = false; };
  }, [profile?.profilePicture]);

  // Koçlarım listesi
  useEffect(() => {
    if (!token) return;
    let alive = true;
    const ac = new AbortController();

    const run = async () => {
      setLoadingCoaches(true);
      try {
        const r = await fetch(`${API}/dashboard/user/coaches?limit=12`, { headers, cache: "no-store", signal: ac.signal });
        if (r.ok) {
          const j = await r.json().catch(() => ({}));
          if (Array.isArray(j.items)) {
            const rawItems: CoachLite[] = j.items.map((c: any) => ({
              id: String(c.id || c._id),
              name: String(c.name || "Koç"),
              avatarUrl: c.avatarUrl || c.avatar || c.profilePicture || "",
              role: c.role || "Coach",
            }));
            const items = await Promise.all(
              rawItems.map(async (c) => ({ ...c, avatarUrl: await resolveAvatarUrl(c.avatarUrl) }))
            );
            if (alive) {
              setMyCoaches(items);
              setLoadingCoaches(false);
              return;
            }
          }
        }
      } catch { /* ignore */ }
      if (alive) setLoadingCoaches(false);
    };

    run();
    return () => {
      alive = false;
      ac.abort();
    };
  }, [headers, token]);

  /* ---------------------------- Render: Page Shell --------------------------- */

  return (
    <div className="relative flex min-h-screen">
      <OnboardingModal role="user" name={profile?.name} onboardingCompleted={profile?.onboardingCompleted} />

      {/* Sidebar only on md+ */}
      <div className="hidden md:block">
        <SidebarNavUser unreadCount={unreadCount} unreadMessages={unreadMessages} />
      </div>

      {/* Add bottom padding on mobile so content doesn't sit under the fixed nav */}
      <main className="ml-0 md:ml-16 w-full min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 pb-20 md:pb-0">
        {/* Decorative gradient blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[260px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.22),rgba(16,185,129,0)_60%)]"
        />

        <section className="max-w-6xl mx-auto px-4 pb-12 pt-8 md:pt-12">
          {/* Hero / Greeting */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="mb-8">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-400/40 to-green-600/40 blur-md" />
                <div className="relative w-[84px] h-[84px] rounded-2xl overflow-hidden border border-border dark:border-zinc-800">
                  {profilePhotoUrl ? (
                    <Image
                      src={profilePhotoUrl}
                      alt="Profil Fotoğrafı"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold select-none">
                        {profile?.name?.trim().split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Hoş Geldin, {profile?.name || "Kullanıcı"}!</h1>
                <p className="text-sm md:text-base text-muted-foreground">Bugün de hedeflerine ulaşmak için harika bir gün. Hazırsan başlayalım. 💪</p>
              </div>
            </div>
          </motion.div>

          {/* Today's Workout */}
          <TodayWorkoutWidget events={todayEvents} />

          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatCard loading={loadingProgress} title="Tamamlanan Seans" value={progress?.totalCompletedSessions ?? 0} hint="Son 30 gün" />
            <StatCard loading={loadingProgress} title="Atanmış Program" value={progress?.assignedPrograms ?? 0} hint="Aktif" />
            <StatCard loading={false} title="Bildirim" value={unreadCount} hint="Okunmamış" />
          </div>

          {/* Programs */}
          <section className="mb-12">
            <SectionHeader title="Programların" subtitle="Takip ettiğin programlar ve ilerlemen" />
            {loadingPrograms ? (
              <ProgramGridSkeleton />
            ) : programs.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {programs.map((program, i) => (
                  <motion.div key={program.programId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                    <Card className="group overflow-hidden border-border/70 dark:border-zinc-800/70 hover:shadow-lg hover:border-emerald-500/40 transition-all rounded-2xl">
                      <ProgramThumb name={program.name} index={i} />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base md:text-lg line-clamp-1">{program.name}</CardTitle>
                        {program.description ? <p className="text-sm text-muted-foreground line-clamp-2">{program.description}</p> : null}
                      </CardHeader>
                      <CardContent className="pt-0 space-y-4">
                        <ProgressBar value={program.progressPercentage} />
                        <Button asChild className="w-full">
                          <Link href={`/dashboard/user/programs/${program.programId}`}>Programa Git</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Atanmış programın yok"
                action={
                  <Button asChild>
                    <Link href="/koc">Koç Bul</Link>
                  </Button>
                }
              >
                Hedeflerine uygun bir programla başlamak için bir koçla eşleş.
              </EmptyState>
            )}
          </section>

          {/* Coaches */}
          <section className="mb-12">
            <SectionHeader
              title="Koçlarım"
              subtitle="İletişimde olduğun koçlar"
              right={!loadingCoaches && myCoaches.length ? <span className="text-sm text-muted-foreground">{myCoaches.length} koç</span> : null}
            />
            {loadingCoaches ? (
              <CoachGridSkeleton />
            ) : myCoaches.length === 0 ? (
              <EmptyState
                title="Henüz koç bulunamadı"
                action={
                  <Button asChild variant="secondary">
                    <Link href="/koc">Koçları Keşfet</Link>
                  </Button>
                }
              >
                Programlarından koç bilgisi otomatik eklenecektir.
              </EmptyState>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myCoaches.map((c) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Card className="hover:shadow-lg transition-shadow rounded-2xl">
                      <CardHeader className="flex flex-row items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-emerald-500/20 rounded-xl">
                          <AvatarImage src={c.avatarUrl || "/images/user.png"} alt={c.name} />
                          <AvatarFallback>{(c.name?.[0] || "K").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{c.name}</CardTitle>
                          <div className="text-xs text-muted-foreground">{c.role || "Coach"}</div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex items-center gap-2">
                        <ReviewDialog coach={c} />
                        <div className="ml-auto">
                          <Button variant="ghost" asChild>
                            <Link href={`/dashboard/user/koclarimiz/${c.id}`}>Profili Gör</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Goal Tracking */}
          <section>
            <SectionHeader title="Hedef Takibi" subtitle="Program bazlı ilerlemen" />
            {loadingProgress ? (
              <div className="grid md:grid-cols-2 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="rounded-2xl">
                    <CardContent className="py-6 space-y-3">
                      <div className="h-5 w-40 bg-zinc-200 dark:bg-primary/90 rounded" />
                      <div className="h-2 w-full bg-zinc-200 dark:bg-primary/90 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : progress?.goalTracking?.length ? (
              <div className="grid md:grid-cols-2 gap-5">
                {progress.goalTracking.map((goal) => (
                  <Card key={goal.programId} className="rounded-2xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {programs.find((p) => String(p.programId) === String(goal.programId))?.name || "Program"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProgressBar value={goal.progressPercentage} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState title="Hedef bulunamadı">Koçundan hedef belirlemeni isteyebilirsin.</EmptyState>
            )}
          </section>
        </section>
      </main>

      {/* Bottom nav on mobile, with counts */}
      <MobileUserBottomNav unreadNotifications={unreadCount} unreadMessages={unreadMessages} />
    </div>
  );
}

/* ---------------------------- Small UI Helpers ---------------------------- */

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 md:mb-6 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  loading,
}: {
  title: string;
  value: number | string;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-1">
      {loading ? (
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="h-6 w-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" />
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          <div className="text-2xl font-bold tabular-nums leading-none">{value}</div>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </>
      )}
    </div>
  );
}

function ProgramGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-2xl">
          <div className="aspect-[16/9] bg-zinc-200 dark:bg-primary/90" />
          <CardContent className="py-5 space-y-3">
            <div className="h-5 w-48 bg-zinc-200 dark:bg-primary/90 rounded" />
            <div className="h-4 w-64 bg-zinc-200 dark:bg-primary/90 rounded" />
            <div className="h-2 w-full bg-zinc-200 dark:bg-primary/90 rounded" />
            <div className="h-9 w-full bg-zinc-200 dark:bg-primary/90 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CoachGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="rounded-2xl">
          <CardContent className="py-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-primary/90" />
            <div className="h-5 w-40 bg-zinc-200 dark:bg-primary/90 rounded" />
            <div className="h-4 w-24 bg-zinc-200 dark:bg-primary/90 rounded" />
            <div className="h-9 w-28 bg-zinc-200 dark:bg-primary/90 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TodayWorkoutWidget({ events }: { events: { _id: string; title: string; start: string; end: string; status: string }[] }) {
  const today = new Date().toISOString().slice(0, 10);
  if (events.length === 0) return null;

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const next = events.find((e) => e.status !== "completed") ?? events[0];
  const allDone = events.every((e) => e.status === "completed");

  return (
    <Link href={`/takvim?date=${today}`} className="block mb-6">
      <div className={`rounded-2xl border p-4 flex items-center gap-4 transition-all hover:shadow-md ${allDone ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-primary/5 border-primary/20 hover:border-primary/40"}`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${allDone ? "bg-green-500" : "bg-primary"}`}>
          {allDone ? <CheckCircle2 className="h-5 w-5 text-white" /> : <Dumbbell className="h-5 w-5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Bugünkü Antrenman</p>
          {allDone ? (
            <p className="font-semibold text-green-700 dark:text-green-400">Tüm seanslar tamamlandı 🎉</p>
          ) : (
            <>
              <p className="font-semibold truncate">{next.title}</p>
              <p className="text-xs text-muted-foreground">{fmtTime(next.start)} – {fmtTime(next.end)}{events.length > 1 ? ` · ${events.length} seans` : ""}</p>
            </>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}

function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="py-10 text-center space-y-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        {children ? <p className="text-sm text-muted-foreground">{children}</p> : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
