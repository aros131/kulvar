// src/app/dashboard/user/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";

import SidebarNavUser from "@/components/ui/SidebarNavUser";
import MobileUserBottomNav from "@/components/nav/MobileUserBottomNav";
import OnboardingModal from "@/components/OnboardingModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Dumbbell, ChevronRight, CheckCircle2, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";

import { storage, db } from "@/lib/firebase";
import { getDownloadURL, ref as sRef } from "firebase/storage";
import { collection, onSnapshot, query, where } from "firebase/firestore";

/* --------------------------------- Config --------------------------------- */

const avatarStorage = storage;
const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const SIGNUP_URL = (process.env.NEXT_PUBLIC_SIGNUP_URL || "/signup").replace(/\/+$/, "");
const LOCALE_TAG: Record<string, string> = { tr: "tr-TR", en: "en-US", fr: "fr-FR" };

/* ------------------------------ Helper Utils ------------------------------ */

async function resolveAvatarUrl(input?: string): Promise<string> {
  // No real photo yet (either unset, or the backend's placeholder default) —
  // return "" so the caller falls back to the initials avatar instead of a
  // generic circular icon that doesn't fill its square frame.
  if (!input || input.includes("default-user")) return "";
  if (/^https?:\/\//i.test(input)) return input;
  // A root-relative path is a local /public asset, not a Firebase Storage
  // key — serve it directly instead of round-tripping through Storage.
  if (/^\//.test(input) && !/^gs:\/\//i.test(input)) return input;

  try {
    const path = /^gs:\/\//i.test(input) ? input : input.replace(/^\/+/, "");
    const ref = sRef(avatarStorage, path);
    return await getDownloadURL(ref);
  } catch (err) {
    console.warn("resolveAvatarUrl failed:", input, err);
    return "";
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
  fitnessGoals?: string;
  bio?: string;
}

function profileCompletion(p: UserProfile | null, labels: { name: string; photo: string; goal: string; bio: string }): { pct: number; missing: string[] } {
  if (!p) return { pct: 0, missing: [] };
  const checks: [boolean, string][] = [
    [!!p.name, labels.name],
    [!!p.profilePicture && !p.profilePicture.includes("default-user"), labels.photo],
    [!!p.fitnessGoals?.trim(), labels.goal],
    [!!p.bio?.trim(), labels.bio],
  ];
  const done = checks.filter(([v]) => v).length;
  const missing = checks.filter(([v]) => !v).map(([, l]) => l);
  return { pct: Math.round((done / checks.length) * 100), missing };
}

type CoachLite = { id: string; name: string; avatarUrl?: string; role?: string };

/* ------------------------------- UI Pieces -------------------------------- */

function ProgressBar({ value, label }: { value: number; label?: string }) {
  const t = useTranslations("dashboardUserHome");
  label = label ?? t("progressLabel");
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
  const t = useTranslations("dashboardUserHome");
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-1 rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={t("starAriaLabel", { n })}
        >
          <Star className="h-5 w-5" fill={n <= value ? "currentColor" : "none"} stroke="currentColor" />
        </button>
      ))}
    </div>
  );
}

function ReviewDialog({ coach, onSubmitted }: { coach: CoachLite; onSubmitted?: () => void }) {
  const t = useTranslations("dashboardUserHome");
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const token = cleanToken();
    if (!token) {
      toast.message(t("signupPrompt"));
      const back = encodeURIComponent(location.pathname + location.search);
      window.location.href = `${SIGNUP_URL}?redirect=${back}`;
      return;
    }
    if (!rating) {
      toast.message(t("ratingRequired"));
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
        toast.success(t("reviewSubmitted"));
        setOpen(false);
        setComment("");
        setRating(5);
        onSubmitted?.();
      } else {
        const j = await res.json().catch(() => ({}));
        toast.error(j?.message || t("reviewSubmitError"));
      }
    } catch {
      toast.error(t("serverError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t("reviewBtn")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("reviewTitle", { name: coach.name })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="text-sm mb-1">{t("ratingLabel")}</div>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
              <div className="text-sm mb-1">{t("commentLabel")}</div>
              <Textarea
                placeholder={t("commentPlaceholder")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              {t("cancel")}
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? t("sending") : t("send")}
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
  const t = useTranslations("dashboardUserHome");
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
  const [streak, setStreak] = useState<{ currentStreak: number; longestStreak: number } | null>(null);

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

    const fetchStreak = async () => {
      try {
        // userId comes from profile; fetch after profile resolves
        const profileRes = await fetch(`${API}/profile`, { headers, cache: "no-store", signal: ac.signal });
        const profileData: any = profileRes.ok ? await profileRes.json().catch(() => ({})) : {};
        const uid = profileData?._id || profileData?.id;
        if (!uid) return;
        const res = await fetch(`${API}/progress/streaks/${uid}`, { headers, cache: "no-store", signal: ac.signal });
        if (res.ok) {
          const d = await res.json().catch(() => ({}));
          if (alive) setStreak({ currentStreak: Number(d.currentStreak) || 0, longestStreak: Number(d.longestStreak) || 0 });
        }
      } catch { /* ignore */ }
    };

    fetchProfile();
    fetchProgress();
    fetchPrograms();
    fetchUnreadNotifications();
    fetchTodayEvents();
    fetchStreak();

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
              name: String(c.name || t("coachRoleFallback")),
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
          {/* Profile completion banner */}
          {(() => {
            const { pct, missing } = profileCompletion(profile, {
              name: t("profileFieldName"),
              photo: t("profileFieldPhoto"),
              goal: t("profileFieldGoal"),
              bio: t("profileFieldBio"),
            });
            if (pct >= 100) return null;
            return (
              <Link href="/dashboard/user/profile" className="block mb-6">
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{t("profileCompletion", { pct })}</p>
                    <span className="text-xs text-amber-600 dark:text-amber-400 underline">{t("completeCta")}</span>
                  </div>
                  <div className="h-1.5 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  {missing.length > 0 && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1.5">
                      {t("missingLabel", { list: missing.join(" · ") })}
                    </p>
                  )}
                </div>
              </Link>
            );
          })()}

          {/* Hero / Greeting */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="mb-8">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-400/40 to-green-600/40 blur-md" />
                <div className="relative w-[84px] h-[84px] rounded-2xl overflow-hidden border border-border dark:border-zinc-800">
                  {profilePhotoUrl ? (
                    <Image
                      src={profilePhotoUrl}
                      alt={t("profileFieldPhoto")}
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
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("greeting", { name: profile?.name || t("userFallback") })}</h1>
                <p className="text-sm md:text-base text-muted-foreground">{t("greetingSubtitle")}</p>
              </div>
            </div>
          </motion.div>

          {/* Today's Workout */}
          <TodayWorkoutWidget events={todayEvents} />

          {/* Streak Banner */}
          <StreakWidget streak={streak} />

          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard loading={loadingProgress} title={t("statCompletedSessions")} value={progress?.totalCompletedSessions ?? 0} hint={t("statTotal")} />
            <StatCard loading={loadingProgress} title={t("statAssignedPrograms")} value={progress?.assignedPrograms ?? 0} hint={t("statActive")} />
            <StatCard loading={false} title={t("statNotifications")} value={unreadCount} hint={t("statUnread")} />
          </div>

          {/* Achievement Badges */}
          <AchievementBadges
            completedSessions={progress?.totalCompletedSessions ?? 0}
            currentStreak={streak?.currentStreak ?? 0}
            longestStreak={streak?.longestStreak ?? 0}
            programs={programs}
          />


          {/* Programs */}
          <section className="mb-12">
            <SectionHeader title={t("programsTitle")} subtitle={t("programsSubtitle")} />
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
                          <Link href={`/dashboard/user/programs/${program.programId}`}>{t("goToProgram")}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("noPrograms")}
                action={
                  <Button asChild>
                    <Link href="/koc">{t("findCoach")}</Link>
                  </Button>
                }
              >
                {t("noProgramsDesc")}
              </EmptyState>
            )}
          </section>

          {/* Coaches */}
          <section className="mb-12">
            <SectionHeader
              title={t("coachesTitle")}
              subtitle={t("coachesSubtitle")}
              right={!loadingCoaches && myCoaches.length ? <span className="text-sm text-muted-foreground">{t("coachCount", { count: myCoaches.length })}</span> : null}
            />
            {loadingCoaches ? (
              <CoachGridSkeleton />
            ) : myCoaches.length === 0 ? (
              <EmptyState
                title={t("noCoaches")}
                action={
                  <Button asChild variant="secondary">
                    <Link href="/koc">{t("discoverCoaches")}</Link>
                  </Button>
                }
              >
                {t("noCoachesDesc")}
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
                          <div className="text-xs text-muted-foreground">{c.role || t("coachRoleFallback")}</div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex items-center gap-2">
                        <ReviewDialog coach={c} />
                        <div className="ml-auto">
                          <Button variant="ghost" asChild>
                            <Link href={`/dashboard/user/koclarimiz/${c.id}`}>{t("viewProfile")}</Link>
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
            <SectionHeader title={t("goalTrackingTitle")} subtitle={t("goalTrackingSubtitle")} />
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
                        {programs.find((p) => String(p.programId) === String(goal.programId))?.name || t("programFallback")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProgressBar value={goal.progressPercentage} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState title={t("noGoal")}>{t("noGoalDesc")}</EmptyState>
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
  const t = useTranslations("dashboardUserHome");
  const locale = useLocale();
  const today = new Date().toISOString().slice(0, 10);
  if (events.length === 0) return null;

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(LOCALE_TAG[locale] || "tr-TR", { hour: "2-digit", minute: "2-digit" });
  const next = events.find((e) => e.status !== "completed") ?? events[0];
  const allDone = events.every((e) => e.status === "completed");

  return (
    <Link href={`/takvim?date=${today}`} className="block mb-6">
      <div className={`rounded-2xl border p-4 flex items-center gap-4 transition-all hover:shadow-md ${allDone ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-primary/5 border-primary/20 hover:border-primary/40"}`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${allDone ? "bg-green-500" : "bg-primary"}`}>
          {allDone ? <CheckCircle2 className="h-5 w-5 text-white" /> : <Dumbbell className="h-5 w-5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">{t("todayWorkoutTitle")}</p>
          {allDone ? (
            <p className="font-semibold text-green-700 dark:text-green-400">{t("allSessionsDone")}</p>
          ) : (
            <>
              <p className="font-semibold truncate">{next.title}</p>
              <p className="text-xs text-muted-foreground">{fmtTime(next.start)} – {fmtTime(next.end)}{events.length > 1 ? t("sessionsCountSuffix", { count: events.length }) : ""}</p>
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

/* ── StreakWidget ─────────────────────────────────────────────────────────── */

function StreakWidget({ streak }: { streak: { currentStreak: number; longestStreak: number } | null }) {
  const t = useTranslations("dashboardUserHome");
  if (streak === null) return null;
  const { currentStreak, longestStreak } = streak;

  if (currentStreak === 0) {
    return (
      <div className="mb-6 rounded-2xl border border-dashed bg-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Flame className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium">{t("streakStartPrompt")}</p>
          <p className="text-xs text-muted-foreground">{t("longestStreakLong", { days: longestStreak })}</p>
        </div>
      </div>
    );
  }

  const isHot = currentStreak >= 7;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`mb-6 rounded-2xl border p-4 flex items-center gap-4 ${
        isHot
          ? "bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-300/40 dark:border-orange-700/40"
          : "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-300/40 dark:border-emerald-700/40"
      }`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isHot ? "bg-orange-500/15" : "bg-emerald-500/15"}`}>
        <Flame className={`h-7 w-7 ${isHot ? "text-orange-500" : "text-emerald-500"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-black tabular-nums leading-none">
          {currentStreak} <span className="text-base font-semibold">{t("dailyStreakLabel")}</span> {isHot ? "🔥" : "✅"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{t("longestStreakShort", { days: longestStreak })}</p>
      </div>
      {currentStreak >= 3 && (
        <div className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${isHot ? "bg-orange-500/20 text-orange-600 dark:text-orange-400" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"}`}>
          {currentStreak >= 30 ? t("legendary") : currentStreak >= 14 ? t("onFire") : currentStreak >= 7 ? t("super") : t("keepGoing")}
        </div>
      )}
    </motion.div>
  );
}

/* ── AchievementBadges ───────────────────────────────────────────────────── */

const ACHIEVEMENTS = [
  { id: "first", icon: "🎯", labelKey: "achFirstLabel", descKey: "achFirstDesc", cond: (s: number) => s >= 1 },
  { id: "week", icon: "📅", labelKey: "achWeekLabel", descKey: "achWeekDesc", cond: (s: number) => s >= 7 },
  { id: "month", icon: "💪", labelKey: "achMonthLabel", descKey: "achMonthDesc", cond: (s: number) => s >= 30 },
  { id: "streak3", icon: "🔥", labelKey: "achStreak3Label", descKey: "achStreak3Desc", cond: (_s: number, cur: number) => cur >= 3 },
  { id: "streak7", icon: "⚡", labelKey: "achStreak7Label", descKey: "achStreak7Desc", cond: (_s: number, cur: number) => cur >= 7 },
  { id: "streak30", icon: "🏆", labelKey: "achStreak30Label", descKey: "achStreak30Desc", cond: (_s: number, cur: number) => cur >= 30 },
  { id: "half", icon: "🎉", labelKey: "achHalfLabel", descKey: "achHalfDesc", cond: (_s: number, _c: number, programs: UserProgram[]) => programs.some((p) => p.progressPercentage >= 50) },
  { id: "done", icon: "🏅", labelKey: "achDoneLabel", descKey: "achDoneDesc", cond: (_s: number, _c: number, programs: UserProgram[]) => programs.some((p) => p.progressPercentage >= 100) },
];

function AchievementBadges({
  completedSessions,
  currentStreak,
  longestStreak: _longest,
  programs,
}: {
  completedSessions: number;
  currentStreak: number;
  longestStreak: number;
  programs: UserProgram[];
}) {
  const t = useTranslations("dashboardUserHome");
  const unlocked = ACHIEVEMENTS.filter((a) => a.cond(completedSessions, currentStreak, programs));
  const locked = ACHIEVEMENTS.filter((a) => !a.cond(completedSessions, currentStreak, programs));

  if (unlocked.length === 0 && completedSessions === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("achievementsTitle")}</h2>
        {unlocked.length > 0 && (
          <span className="text-xs bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {unlocked.map((a) => (
          <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-300/30 dark:border-amber-700/30">
            <span className="text-base">{a.icon}</span>
            <div>
              <p className="text-xs font-semibold leading-none">{t(a.labelKey)}</p>
              <p className="text-[10px] text-muted-foreground">{t(a.descKey)}</p>
            </div>
          </div>
        ))}
        {locked.slice(0, 3).map((a) => (
          <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border opacity-50">
            <span className="text-base grayscale">{a.icon}</span>
            <div>
              <p className="text-xs font-semibold leading-none text-muted-foreground">{t(a.labelKey)}</p>
              <p className="text-[10px] text-muted-foreground">{t(a.descKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
