// src/app/dashboard/coach/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

import SidebarNav from "@/components/ui/SidebarNavCoach";
import OnboardingModal from "@/components/OnboardingModal";
import PendingBookings from "@/components/coach/PendingBookings";
import CoachAvailability from "@/components/coach/CoachAvailability";
import MobileCoachBottomNav from "@/components/nav/MobileCoachBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, TrendingUp, CalendarCheck,
  AlertTriangle, CheckCircle2, Clock, ArrowRight,
  Dumbbell, ChevronRight,
} from "lucide-react";

import { storage } from "@/lib/firebase";
import { getDownloadURL, ref as sRef } from "firebase/storage";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

const cleanToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  const t = raw.replace(/^"+|"+$/g, "").trim();
  return t.startsWith("Bearer ") ? t.slice(7) : t;
};

async function resolveAvatarUrl(input?: string): Promise<string> {
  const F = "/images/user.png";
  if (!input) return F;
  if (/^https?:\/\//i.test(input)) return input;
  try {
    const ref = /^gs:\/\//i.test(input) ? sRef(storage, input) : sRef(storage, input.replace(/^\/+/, ""));
    return await getDownloadURL(ref);
  } catch { return F; }
}

interface CoachProfile { name: string; email: string; profilePicture?: string; specialization?: string; role: "coach"; onboardingCompleted?: boolean; }
interface Analytics { totalClients: number; totalRevenue: number; completedSessions: number; upcomingSessions: number; avgRating: number; reviewCount: number; }
interface Booking { _id: string; userId?: { name?: string; profilePicture?: string } | string; startUtc?: string; endUtc?: string; status: string; notes?: string; meetingMode?: string; }
interface Client { _id: string; name: string; email: string; }

function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }
function fmtMoney(n: number) { return `₺${n >= 1000 ? (n / 1000).toFixed(1) + "k" : n}`; }
function today() { return new Date().toISOString().slice(0, 10); }
function weekStart(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1 + offset * 7);
  return d.toISOString().slice(0, 10);
}
function capitalizeName(name?: string) {
  if (!name) return "";
  return name.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export default function DashboardCoachPage() {
  const [profile,       setProfile]       = useState<CoachProfile | null>(null);
  const [profileUrl,    setProfileUrl]    = useState("/images/user.png");
  const [analytics,     setAnalytics]     = useState<Analytics | null>(null);
  const [allConfirmed, setAllConfirmed]   = useState<Booking[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [clients,       setClients]       = useState<Client[]>([]);
  const [loadingProfile,setLoadingProfile]= useState(true);
  const [loadingStats,  setLoadingStats]  = useState(true);

  useEffect(() => {
    const token = cleanToken();
    const h = token ? { Authorization: `Bearer ${token}` } : {};

    // profile
    (async () => {
      if (!token) { setLoadingProfile(false); return; }
      try {
        const res = await fetch(`${API}/profile`, { headers: h, cache: "no-store" });
        const data: CoachProfile = await res.json();
        if (data?.role !== "coach") throw new Error();
        setProfile(data);
        setProfileUrl(await resolveAvatarUrl(data?.profilePicture));
      } catch { /* ignore */ } finally { setLoadingProfile(false); }
    })();

    // analytics + bookings + invoices + clients + unread — all parallel
    (async () => {
      if (!token) { setLoadingStats(false); return; }
      try {
        const [aRes, bRes, iRes, cRes, nRes] = await Promise.allSettled([
          fetch(`${API}/analytics`,            { headers: h, cache: "no-store" }),
          fetch(`${API}/bookings/confirmed`,   { headers: h, cache: "no-store" }),
          Promise.resolve(null),
          fetch(`${API}/users/clients`,        { headers: h, cache: "no-store" }),
          fetch(`${API}/notifications/user`,   { headers: h, cache: "no-store" }),
        ]);

        if (aRes.status === "fulfilled" && aRes.value.ok) {
          setAnalytics(await aRes.value.json());
        }
        if (bRes.status === "fulfilled" && bRes.value.ok) {
          const bData = await bRes.value.json();
          const all: Booking[] = Array.isArray(bData) ? bData : bData?.bookings ?? [];
          setAllConfirmed(all);
        }
        if (cRes.status === "fulfilled" && cRes.value.ok) {
          const cData = await cRes.value.json();
          setClients(Array.isArray(cData) ? cData : cData?.users ?? []);
        }
        if (nRes.status === "fulfilled" && nRes.value.ok) {
          const nData = await nRes.value.json();
          const unread = (Array.isArray(nData?.notifications) ? nData.notifications : []).filter((n: {isRead:boolean}) => !n.isRead);
          setUnreadCount(unread.length);
        }
      } catch { /* ignore */ } finally { setLoadingStats(false); }
    })();
  }, []);



  return (
    <div className="relative flex min-h-screen">
      <OnboardingModal role="coach" name={profile?.name} onboardingCompleted={profile?.onboardingCompleted} />
      <div className="hidden md:block"><SidebarNav unreadCount={unreadCount} /></div>

      <main className="ml-0 md:ml-16 w-full min-h-screen bg-background pb-20 md:pb-0">
        <section className="max-w-6xl mx-auto px-4 py-8 md:py-10 space-y-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              {loadingProfile
                ? <Skeleton className="h-8 w-48 mb-1" />
                : <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                    Merhaba, {capitalizeName(profile?.name?.split(" ")[0])} 👋
                  </h1>
              }
              <p className="text-sm text-muted-foreground mt-0.5">
                {new Date().toLocaleDateString("tr-TR", { weekday:"long", day:"numeric", month:"long" })}
              </p>
            </div>
            {profile && (
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-border shrink-0">
                {profileUrl && profileUrl !== "/images/user.png" ? (
                  <Image src={profileUrl} alt="Profil" width={44} height={44}
                    className="w-full h-full object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-bold select-none">
                      {profile.name?.trim().split(/\s+/).map(w => w[0]).join("").slice(0,2).toUpperCase() || "K"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Analytics Stat Row ── */}
          {!loadingStats && analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Danışan", value: fmt(analytics.totalClients) },
                { label: "Tamamlanan Seans", value: fmt(analytics.completedSessions) },
                { label: "Yaklaşan Seans", value: fmt(analytics.upcomingSessions) },
                { label: "Ort. Puan", value: analytics.avgRating ? analytics.avgRating.toFixed(1) : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl border bg-card p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
                </div>
              ))}
            </div>
          )}
          {loadingStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}
            </div>
          )}


          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left col (2/3) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Bekleyen istekler */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-base">Bekleyen Randevu İstekleri</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <PendingBookings />
                </CardContent>
              </Card>
            </div>

            {/* Right col (1/3) */}
            <div className="space-y-6">

              {/* Randevu Takvimi */}
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <BookingCalendar bookings={allConfirmed} loading={loadingStats} />
                </CardContent>
              </Card>

              {/* Dikkat Gerektiriyor */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    <CardTitle className="text-base">Dikkat Gerektiriyor</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {loadingStats ? (
                    <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10 rounded-lg" />)}</div>
                  ) : clients.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      <CheckCircle2 className="h-7 w-7 mx-auto mb-2 text-green-500 opacity-60" />
                      Tüm danışanlar aktif görünüyor.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clients.slice(0, 5).map(c => (
                        <Link key={c._id} href={`/dashboard/coach/clients/${c._id}`}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-colors group">
                          <div className="h-8 w-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-xs font-bold text-rose-600">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{capitalizeName(c.name)}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                      {clients.length > 5 && (
                        <Link href="/dashboard/coach/clients" className="block text-center text-xs text-primary hover:underline pt-1">
                          +{clients.length - 5} danışan daha
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Uygunluk */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Uygunluk</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CoachAvailability embedded />
                </CardContent>
              </Card>

              {/* Hızlı istatistik */}
              {!loadingStats && analytics && (
                <Card className="rounded-2xl bg-primary text-primary-foreground">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">Yaklaşan</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Onaylı seans</span>
                      <span className="text-xl font-black">{analytics.upcomingSessions}</span>
                    </div>
                    <div className="h-px bg-primary-foreground/20" />
                    <Link href="/dashboard/coach/analytics"
                      className="flex items-center justify-between text-sm opacity-80 hover:opacity-100 transition-opacity">
                      <span>Tüm analitiği gör</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>
      <MobileCoachBottomNav unreadNotifications={unreadCount} />
    </div>
  );
}

/* ── Booking Calendar ─────────────────────────────── */
const TR_DAYS   = ["Pt","Sa","Ca","Pe","Cu","Ct","Pz"];
const TR_MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function BookingCalendar({ bookings, loading }: { bookings: Booking[]; loading: boolean }) {
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected,  setSelected]  = useState<string>(now.toISOString().slice(0, 10));

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11){ setViewYear(y => y+1); setViewMonth(0);  } else setViewMonth(m => m+1); };

  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();         // 0=Sun
  const startPad  = firstDay === 0 ? 6 : firstDay - 1;                 // Mon-based
  const daysInMo  = new Date(viewYear, viewMonth + 1, 0).getDate();

  const bookedDays = new Set(
    bookings.map(b => b.startUtc?.slice(0, 10)).filter(Boolean) as string[]
  );

  const dayBookings = bookings.filter(b => b.startUtc?.slice(0, 10) === selected);
  const todayStr    = now.toISOString().slice(0, 10);

  if (loading) return <Skeleton className="h-56 rounded-xl" />;

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
        <span className="text-sm font-semibold">{TR_MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {TR_DAYS.map(d => (
          <div key={d} className="text-[10px] text-center text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: daysInMo }).map((_, i) => {
          const day  = i + 1;
          const iso  = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const hasBooking = bookedDays.has(iso);
          const isToday    = iso === todayStr;
          const isSelected = iso === selected;

          return (
            <button
              key={iso}
              onClick={() => setSelected(iso)}
              className={`relative flex flex-col items-center py-1 rounded-lg text-xs font-medium transition-colors
                ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"}
              `}
            >
              {day}
              {hasBooking && (
                <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day bookings */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">
          {new Date(selected + "T12:00:00").toLocaleDateString("tr-TR", { day:"numeric", month:"long" })}
        </p>
        {dayBookings.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">Bu gün için randevu yok.</p>
        ) : (
          <div className="space-y-1.5">
            {dayBookings.map(b => {
              const name = typeof b.userId === "object" ? b.userId?.name : "Danışan";
              const startTime = b.startUtc ? new Date(b.startUtc).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "";
              const endTime   = b.endUtc   ? new Date(b.endUtc).toLocaleTimeString("tr-TR",   { hour: "2-digit", minute: "2-digit" }) : "";
              const mode = b.meetingMode === "online" ? "Online" : b.meetingMode === "in_person" ? "Yüz Yüze" : "";
              return (
                <div key={b._id} className="p-2.5 rounded-xl bg-muted/50 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-xs font-semibold truncate">{capitalizeName(name)}</p>
                  </div>
                  <div className="flex items-center gap-2 pl-9">
                    {startTime && <span className="text-[10px] text-muted-foreground font-medium">{startTime}{endTime ? ` – ${endTime}` : ""}</span>}
                    {mode && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${b.meetingMode === "online" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{mode}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
