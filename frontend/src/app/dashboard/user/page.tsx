// src/app/dashboard/user/page.tsx
"use client";

import { useEffect, useState } from "react";
import UserNavbar from "@/components/nav/UserNavbar";
import Link from "next/link";
import SidebarNavUser from "@/components/ui/SidebarNavUser";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

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
  name: string;
  email: string;
  profilePicture: string;
}

type CoachLite = {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
};

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

function ProgressBar({ value, label = "İlerleme" }: { value: number; label?: string }) {
  const pct = roundPct(value);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div
        className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
      >
        <div className="h-2 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ⭐ Simple 1–5 star picker */
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-1"
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
function ReviewDialog({
  coach,
  onSubmitted,
}: {
  coach: CoachLite;
  onSubmitted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const token = cleanToken();
    if (!token) {
      toast.message("Devam etmek için lütfen kayıt olun.");
      window.location.href = `/signup?redirect=${encodeURIComponent(location.pathname + location.search)}`;
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

export default function UserDashboardPage() {
  const [programs, setPrograms] = useState<UserProgram[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // 🔹 Koçlarım state
  const [myCoaches, setMyCoaches] = useState<CoachLite[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);

  useEffect(() => {
    const token = cleanToken();
    const headers = makeAuthHeaders(token);

    const fetchPrograms = async () => {
      try {
        // 1) Base list
        const res = await fetch(`${API}/progress/all-program-progress`, { headers, cache: "no-store" });
        const data = res.ok ? await res.json().catch(() => ({})) : {};
        const list: UserProgram[] = Array.isArray((data as any).programProgress) ? (data as any).programProgress : [];

        // 2) For each program, pull the SAME number Program page uses
        const enriched = await Promise.all(
          list.map(async (p) => {
            try {
              const r = await fetch(`${API}/progress/user/${p.programId}`, { headers, cache: "no-store" });
              if (r.ok && (r.headers.get("content-type") || "").includes("application/json")) {
                const j = await r.json();
                // override with the canonical percentage
                return { ...p, progressPercentage: roundPct(j.progressPercentage) };
              }
            } catch {}
            // fallback to whatever came from the list
            return { ...p, progressPercentage: roundPct(p.progressPercentage) };
          })
        );

        setPrograms(enriched);
      } catch {
        setPrograms([]);
    }
    };

    const fetchProgress = async () => {
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
      try {
        const res = await fetch(`${API}/profile`, { headers, cache: "no-store" });
        const data: any = res.ok ? await res.json().catch(() => ({})) : {};
        setProfile(data && typeof data === "object" ? data : null);
      } catch {
        setProfile(null);
      }
    };

    // 🔹 Fetch Koçlarım
    const fetchCoaches = async () => {
      setLoadingCoaches(true);
      try {
        const res = await fetch(`${API}/me/coaches?limit=12`, { headers, cache: "no-store" });
        const j: any = res.ok ? await res.json().catch(() => ({})) : {};
        const arr = Array.isArray(j.items)
          ? j.items
          : Array.isArray(j.coaches)
          ? j.coaches
          : Array.isArray(j.data)
          ? j.data
          : [];
        const normalized: CoachLite[] = arr
          .map((c: any) => {
            const obj = c?.coach || c;
            const id = String(obj?.id ?? obj?._id ?? "");
            if (!id) return null;
            return {
              id,
              name: String(obj?.name ?? "Koç"),
              avatarUrl: obj?.avatarUrl || obj?.avatar || obj?.profilePicture || "",
              role: obj?.role || obj?.title || "Coach",
            } as CoachLite;
          })
          .filter(Boolean);
        setMyCoaches(normalized);
      } catch {
        setMyCoaches([]);
      } finally {
        setLoadingCoaches(false);
      }
    };

    fetchPrograms();
    fetchProgress();
    fetchUnreadNotifications();
    fetchProfile();
    fetchCoaches();
  }, []);

  return (
    <div className="flex">
      <SidebarNavUser unreadCount={unreadCount} />

      <main className="ml-16 w-full min-h-screen bg-zinc-100 dark:bg-zinc-900">
        <UserNavbar />

        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center gap-4 mb-6">
            {profile?.profilePicture && (
              <Image
                src={profile.profilePicture}
                alt="Profil Fotoğrafı"
                width={80}
                height={80}
                className="rounded-full object-cover border"
                unoptimized
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">Hoş Geldin, {profile?.name || "Kullanıcı"}!</h1>
              <p className="text-zinc-600 dark:text-zinc-300">Bugün de hedeflerine ulaşmak için harika bir gün.</p>
            </div>
          </div>

          {/* 🔥 Programs Section — linear bar fed by /progress/user/:id */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {programs.length > 0 ? (
              programs.map((program) => (
                <div
                  key={program.programId}
                  className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{program.name}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 line-clamp-2">
                      {program.description}
                    </p>
                  </div>

                  <div className="mt-4">
                    <ProgressBar value={program.progressPercentage} />
                  </div>

                  <Link href={`/dashboard/user/programs/${program.programId}`} className="mt-4">
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">
                      Programa Git
                    </button>
                  </Link>
                </div>
              ))
            ) : (
              <p>Atanmış programın yok.</p>
            )}
          </div>

          {/* 🧑‍🤝‍🧑 Koçlarım */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow mb-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Koçlarım</h2>
              {loadingCoaches ? null : myCoaches.length ? (
                <span className="text-sm text-zinc-500">{myCoaches.length} koç</span>
              ) : null}
            </div>

            {loadingCoaches ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}><CardContent className="py-6 space-y-3">
                    <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="flex gap-2 pt-2">
                      <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            ) : myCoaches.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-3">
                Henüz koç bulunamadı.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {myCoaches.map((c) => (
                  <Card key={c.id} className="hover:shadow-sm transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      <div className="text-xs text-zinc-500">{c.role || "Coach"}</div>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2">
                      <ReviewDialog coach={c} />
                      <Link href={`/coach/${c.id}`} className="ml-auto">
                        <Button variant="ghost">Profili Gör</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 📈 Goal Tracking — reuse same number style */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">Hedef Takibi</h2>
            {progress?.goalTracking.length ? (
              progress.goalTracking.map((goal) => (
                <div key={goal.programId} className="mb-6">
                  <p className="mb-1 text-sm font-medium">Program: {goal.programId}</p>
                  <ProgressBar value={goal.progressPercentage} />
                </div>
              ))
            ) : (
              <p>Hedef bulunamadı.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
