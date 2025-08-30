// src/app/dashboard/user/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

import UserNavbar from "@/components/nav/UserNavbar";
import SidebarNavUser from "@/components/ui/SidebarNavUser";
import MobileUserBottomNav from "@/components/nav/MobileUserBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Dumbbell } from "lucide-react";
import { toast } from "sonner";

import { storage } from "@/lib/firebase";
import { getDownloadURL, ref as sRef } from "firebase/storage";

/* --------------------------------- Config --------------------------------- */

const avatarStorage = storage;
const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");
const SIGNUP_URL = (process.env.NEXT_PUBLIC_SIGNUP_URL || "/signup").replace(/\/+$/, "");

/* ------------------------------ Helper Utils ------------------------------ */

/** Resolve storage paths & gs:// URLs to downloadable https URLs */
async function resolveAvatarUrl(input?: string): Promise<string> {
  const FALLBACK = "/images/user.png";
  if (!input) return FALLBACK;

  // Already an HTTP(S) url
  if (/^https?:\/\//i.test(input)) return input;

  try {
    // Accept full gs:// URL as-is
    if (/^gs:\/\//i.test(input)) {
      const ref = sRef(avatarStorage, input);
      return await getDownloadURL(ref);
    }

    // Otherwise treat as a storage path ("profile-pictures/uid.jpg")
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
  image?: string; // kept for compatibility (unused)
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
  name: string;
  email: string;
  profilePicture: string; // can be https, gs://, or storage path
}
type CoachLite = {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
};

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
        className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
      >
        <div
          className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ⭐ 1–5 star picker */
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
          <Star
            className="h-5 w-5"
            fill={n <= value ? "currentColor" : "none"}
            stroke="currentColor"
          />
        </button>
      ))}
    </div>
  );
}

/* 🗨️ Review dialog */
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

/* --- Program visual (no images, always clean) --- */
function initialsFrom(name?: string) {
  if (!name) return "PR";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase();
}

function ProgramThumb({ name }: { name?: string }) {
  return (
    <div className="aspect-[16/9] relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:via-emerald-800/30 dark:to-emerald-700/20">
      {/* soft texture */}
      <div className="absolute inset-0 opacity-30 [background:radial-gradient(60%_60%_at_20%_0%,white,transparent_60%)] dark:opacity-20" />
      {/* icon */}
      <Dumbbell className="absolute right-3 top-3 h-5 w-5 text-emerald-600/70 dark:text-emerald-300/70" />
      {/* initials */}
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-2xl font-semibold tracking-wide text-emerald-700 dark:text-emerald-200">
          {initialsFrom(name)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------ Main Component ---------------------------- */

export default function UserDashboardPage() {
  const [programs, setPrograms] = useState<UserProgram[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Loading states for polished skeletons
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // 🔹 resolved URL for the profile picture (Firebase-friendly)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  // 🔹 Koçlarım
  const [myCoaches, setMyCoaches] = useState<CoachLite[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);

  // Auth header management
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

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const res = await fetch(`${API}/progress/all-program-progress`, { headers, cache: "no-store" });
        const data = res.ok ? await res.json().catch(() => ({})) : {};
        const list: UserProgram[] = Array.isArray((data as any).programProgress) ? (data as any).programProgress : [];
        // refresh canonical % per program
        const enriched = await Promise.all(
          list.map(async (p) => {
            try {
              const r = await fetch(`${API}/progress/user/${p.programId}`, { headers, cache: "no-store" });
              if (r.ok && (r.headers.get("content-type") || "").includes("application/json")) {
                const j = await r.json();
                return { ...p, progressPercentage: roundPct(j.progressPercentage) };
              }
            } catch {}
            return { ...p, progressPercentage: roundPct(p.progressPercentage) };
          })
        );
        setPrograms(enriched);
      } catch {
        setPrograms([]);
      } finally {
        setLoadingPrograms(false);
      }
    };

    const fetchProgress = async () => {
      setLoadingProgress(true);
      try {
        const res = await fetch(`${API}/dashboard/analytics/user`, { headers, cache: "no-store" });
        const data: any = res.ok ? await res.json().catch(() => ({})) : {};
        setProgress({
          totalCompletedSessions: Number(data.totalCompletedSessions) || 0,
          assignedPrograms: Number(data.assignedPrograms) || 0,
          goalTracking: Array.isArray(data.goalTracking) ? data.goalTracking : [],
        });
      } catch {
        setProgress({ totalCompletedSessions: 0, assignedPrograms: 0, goalTracking: [] });
      } finally {
        setLoadingProgress(false);
      }
    };

    const fetchUnreadNotifications = async () => {
      try {
        const res = await fetch(`${API}/dashboard/notifications/user`, { headers, cache: "no-store" });
        const data: any = res.ok ? await res.json().catch(() => ({})) : {};
        const list: Notification[] = Array.isArray(data.notifications) ? data.notifications : [];
        setUnreadCount(list.filter((n) => !n.isRead).length);
      } catch {
        setUnreadCount(0);
      }
    };

    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch(`${API}/profile`, { headers, cache: "no-store" });
        const data: any = res.ok ? await res.json().catch(() => ({})) : {};
        setProfile(data && typeof data === "object" ? data : null);
      } catch {
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchPrograms();
    fetchProgress();
    fetchUnreadNotifications();
    fetchProfile();
  }, [headers]);

  // ✅ Resolve top profile image from Firebase (gs:// or storage path → https)
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
    return () => {
      alive = false;
    };
  }, [profile?.profilePicture]);

  // 🔎 Koçlarım
  useEffect(() => {
    const run = async () => {
      setLoadingCoaches(true);

      // 1) preferred: single endpoint
      try {
        const r = await fetch(`${API}/dashboard/user/coaches?limit=12`, { headers, cache: "no-store" });
        if (r.ok) {
          const j = await r.json().catch(() => ({}));
          if (Array.isArray(j.items)) {
            const rawItems: CoachLite[] = j.items.map((c: any) => ({
              id: String(c.id || c._id),
              name: String(c.name || "Koç"),
              avatarUrl: c.avatarUrl || c.avatar || c.profilePicture || "",
              role: c.role || "Coach",
            }));

            // resolve Firebase download URLs for each coach avatar
            const items = await Promise.all(
              rawItems.map(async (c) => ({
                ...c,
                avatarUrl: await resolveAvatarUrl(c.avatarUrl),
              }))
            );

            setMyCoaches(items);
            setLoadingCoaches(false);
            return;
          }
        }
      } catch {
        // fall through to client derivation
      }

      // 2) fallback: derive from programs
      try {
        if (!programs.length) {
          setMyCoaches([]);
          setLoadingCoaches(false);
          return;
        }

        const programIds = [...new Set(programs.map((p) => p.programId).filter(Boolean))];

        const programDetails = await Promise.all(
          programIds.map(async (pid) => {
            try {
              const r = await fetch(`${API}/programs/${pid}`, { headers, cache: "no-store" });
              if (!r.ok) return null;
              const j = await r.json().catch(() => ({}));
              return (j && (j.program || j)) || null;
            } catch {
              return null;
            }
          })
        );

        type CoachDraft = { id?: string; name?: string; avatarUrl?: string; role?: string };
        const drafts: CoachDraft[] = [];

        for (const pg of programDetails) {
          if (!pg) continue;
          const c =
            pg.coach ||
            pg.createdBy ||
            pg.author ||
            pg.owner ||
            pg.coachInfo ||
            null;

          const coachId =
            c?.id || c?._id || pg.coachId || pg.createdById || pg.ownerId || null;

          if (c && (c.name || c.fullName)) {
            drafts.push({
              id: String(coachId || c.id || c._id || ""),
              name: String(c.name || c.fullName || "Koç"),
              avatarUrl: c.avatarUrl || c.avatar || c.profilePicture || "",
              role: c.role || c.title || "Coach",
            });
          } else if (coachId) {
            drafts.push({ id: String(coachId) });
          }
        }

        const byId = new Map<string, CoachLite>();
        drafts.forEach((d) => {
          if (!d.id) return;
          if (d.name) {
            byId.set(d.id, {
              id: d.id,
              name: d.name!,
              avatarUrl: d.avatarUrl,
              role: d.role || "Coach",
            });
          } else if (!byId.has(d.id)) {
            byId.set(d.id, { id: d.id, name: "Koç", role: "Coach" });
          }
        });

        const toFill = [...byId.values()].filter((c) => !c.name || c.name === "Koç");
        await Promise.all(
          toFill.map(async (c) => {
            try {
              const r = await fetch(`${API}/coaches/${c.id}`, { headers, cache: "no-store" });
              if (!r.ok) return;
              const j = await r.json().catch(() => ({}));
              const obj = j?.coach || j;
              if (!obj) return;
              byId.set(c.id, {
                id: c.id,
                name: String(obj.name || "Koç"),
                avatarUrl: obj.avatarUrl || obj.avatar || obj.profilePicture || "",
                role: obj.role || obj.title || "Coach",
              });
            } catch {}
          })
        );

        const items = [...byId.values()];
        const withPhotos = await Promise.all(
          items.map(async (c) => ({ ...c, avatarUrl: await resolveAvatarUrl(c.avatarUrl) }))
        );
        setMyCoaches(withPhotos);
      } finally {
        setLoadingCoaches(false);
      }
    };

    run();
  }, [programs, headers]);

  /* ---------------------------- Render: Page Shell --------------------------- */

  return (
  <div className="relative flex min-h-screen">
    {/* Sidebar only on md+ */}
    <div className="hidden md:block">
      <SidebarNavUser unreadCount={typeof unreadCount === "number" ? unreadCount : 0} />
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
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-400/40 to-green-600/40 blur-md" />
                <Image
                  src={profilePhotoUrl || "/images/user.png"}
                  alt="Profil Fotoğrafı"
                  width={84}
                  height={84}
                  className="relative rounded-2xl object-cover border border-zinc-200 dark:border-zinc-800"
                  unoptimized
                />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Hoş Geldin, {profile?.name || "Kullanıcı"}!
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Bugün de hedeflerine ulaşmak için harika bir gün. Hazırsan başlayalım. 💪
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
            <StatCard
              loading={loadingProgress}
              title="Tamamlanan Seans"
              value={progress?.totalCompletedSessions ?? 0}
              hint="Son 30 gün içinde"
            />
            <StatCard
              loading={loadingProgress}
              title="Atanmış Program"
              value={progress?.assignedPrograms ?? 0}
              hint="Aktif"
            />
            <StatCard loading={false} title="Bildirim" value={unreadCount} hint="Okunmamış" />
          </div>

          {/* Programs */}
          <section className="mb-12">
            <SectionHeader title="Programların" subtitle="Takip ettiğin programlar ve ilerlemen" />
            {loadingPrograms ? (
              <ProgramGridSkeleton />
            ) : programs.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {programs.map((program) => (
                  <motion.div
                    key={program.programId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <Card className="group overflow-hidden border-zinc-200/70 dark:border-zinc-800/70 hover:shadow-lg hover:border-emerald-500/40 transition-all rounded-2xl">
                      <ProgramThumb name={program.name} />

                      <CardHeader className="pb-2">
                        <CardTitle className="text-base md:text-lg line-clamp-1">
                          {program.name}
                        </CardTitle>
                        {program.description ? (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {program.description}
                          </p>
                        ) : null}
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
              right={!loadingCoaches && myCoaches.length ? (
                <span className="text-sm text-muted-foreground">{myCoaches.length} koç</span>
              ) : null}
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
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
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
                      <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : progress?.goalTracking?.length ? (
              <div className="grid md:grid-cols-2 gap-5">
                {progress.goalTracking.map((goal) => (
                  <Card key={goal.programId} className="rounded-2xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Program: {goal.programId}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProgressBar value={goal.progressPercentage} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState title="Hedef bulunamadı">
                Koçundan hedef belirlemeni isteyebilirsin.
              </EmptyState>
            )}
          </section>
        </section>
      </main>
      <MobileUserBottomNav unreadCount={unreadCount} />
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
    <Card className="rounded-2xl border-zinc-200/70 dark:border-zinc-800/70">
      <CardContent className="py-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-7 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {hint ? <div className="text-xs text-muted-foreground mt-1">{hint}</div> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ProgramGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-2xl">
          <div className="aspect-[16/9] bg-zinc-200 dark:bg-zinc-800" />
          <CardContent className="py-5 space-y-3">
            <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-9 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
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
            <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
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
