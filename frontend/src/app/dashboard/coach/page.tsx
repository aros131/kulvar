// src/app/dashboard/coach/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

import SidebarNav from "@/components/ui/SidebarNavCoach";
import OnboardingModal from "@/components/OnboardingModal";
import ProgramList from "@/components/coach/ProgramList";
import PendingBookings from "@/components/coach/PendingBookings";
import ConfirmedBookings from "@/components/coach/ConfirmedBookings";
import CoachAvailability from "@/components/coach/CoachAvailability";
import MobileCoachBottomNav from "@/components/nav/MobileCoachBottomNav"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarClock, Inbox } from "lucide-react";

import { storage } from "@/lib/firebase";
import { getDownloadURL, ref as sRef } from "firebase/storage";

/* --------------------------------- Config --------------------------------- */
const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/, "");

/* ------------------------------ Helper Utils ------------------------------ */
const cleanToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  const trimmed = raw.replace(/^"+|"+$/g, "").trim();
  return trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
};

/** Resolve storage paths & gs:// URLs to downloadable https URLs */
async function resolveAvatarUrl(input?: string): Promise<string> {
  const FALLBACK = "/images/user.png";
  if (!input) return FALLBACK;

  // Already an HTTP(S) url
  if (/^https?:\/\//i.test(input)) return input;

  try {
    if (/^gs:\/\//i.test(input)) {
      const ref = sRef(storage, input);
      return await getDownloadURL(ref);
    }
    const path = input.replace(/^\/+/, "");
    const ref = sRef(storage, path);
    return await getDownloadURL(ref);
  } catch (err) {
    console.warn("resolveAvatarUrl failed:", input, err);
    return FALLBACK;
  }
}

/* --------------------------------- Types ---------------------------------- */
interface CoachProfile {
  name: string;
  email: string;
  profilePicture?: string;
  specialization?: string;
  role: "coach";
  onboardingCompleted?: boolean;
}
interface Notification {
  isRead: boolean;
}

/* -------------------------------- Component ------------------------------- */
export default function DashboardCoachPage() {
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [profileUrl, setProfileUrl] = useState<string>("/images/user.png");
  const [unreadCount, setUnreadCount] = useState(0);

  const [, setLoadingNotifications] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const token = cleanToken();

    const fetchProfile = async () => {
      if (!token) { setLoadingProfile(false); return; }
      setLoadingProfile(true);
      try {
        const res = await fetch(`${API}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data: CoachProfile = await res.json();
        if (data?.role !== "coach") throw new Error("Not a coach profile");
        setProfile(data || null);
        const url = await resolveAvatarUrl(data?.profilePicture);
        setProfileUrl(url || "/images/user.png");
      } catch (e) {
        console.error("Profil verisi alınamadı.", e);
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchUnreadCount = async () => {
      if (!token) return;
      setLoadingNotifications(true);
      try {
        const res = await fetch(`${API}/dashboard/notifications/user`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        const unread = (Array.isArray(data?.notifications) ? data.notifications : []).filter(
          (n: Notification) => !n.isRead
        );
        setUnreadCount(unread.length);
      } catch {
        // ignore silently
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchProfile();
    fetchUnreadCount();
  }, []);

  return (
  <div className="relative flex min-h-screen">
    <OnboardingModal role="coach" name={profile?.name} onboardingCompleted={profile?.onboardingCompleted} />

    {/* Sidebar only on md+ */}
    <div className="hidden md:block">
      <SidebarNav unreadCount={unreadCount} />
    </div>

    <main className="ml-0 md:ml-16 w-full min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 pb-20 md:pb-0">
      {/* Decorative gradient blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[260px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.22),rgba(16,185,129,0)_60%)]"
      />

        <section className="max-w-6xl mx-auto px-4 py-8 md:py-10 space-y-8">
          {/* Page Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Koç Paneli</h1>
              <p className="text-sm text-muted-foreground">
                Randevularını, uygunluğunu ve programlarını tek yerden yönet.
              </p>
            </div>

            <Button asChild size="sm" className="gap-2">
              <Link href="/dashboard/coach/programs/create">
                <Plus className="h-4 w-4" />
                Yeni Program
              </Link>
            </Button>
          </div>

          {/* Profile card */}
          <Card className="rounded-2xl">
            <CardContent className="py-5">
              {loadingProfile ? (
                <ProfileSkeleton />
              ) : profile ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex items-center gap-4"
                >
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-400/40 to-green-600/40 blur-md" />
                    <Image
                      src={profileUrl || "/images/user.png"}
                      alt="Profil Fotoğrafı"
                      width={84}
                      height={84}
                      className="relative rounded-2xl object-cover border border-zinc-200 dark:border-zinc-800"
                      unoptimized
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold leading-none">{profile.name}</h2>
                      {profile.specialization ? (
                        <Badge variant="secondary" className="rounded-lg">
                          {profile.specialization}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-lg">Uzmanlık yok</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>

                  <Card className="hidden sm:block rounded-xl">
                    <CardContent className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                      <Inbox className="h-4 w-4" /> Okunmamış bildirim:{" "}
                      <span className="font-semibold text-foreground">{unreadCount}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="text-sm text-muted-foreground">Profil yüklenemedi.</div>
              )}
            </CardContent>
          </Card>

          {/* Two-column: Pending Bookings & Availability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  <CardTitle className="text-base md:text-lg">Bekleyen Randevu İstekleri</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <PendingBookings />
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  <CardTitle className="text-base md:text-lg">Uygunluk</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* ⬇️ Use embedded to avoid card-inside-card & fit layout */}
                <CoachAvailability embedded />
              </CardContent>
            </Card>
          </div>

          {/* Confirmed sessions awaiting completion */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                <CardTitle className="text-base md:text-lg">Onaylanmış Randevular</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ConfirmedBookings />
            </CardContent>
          </Card>

          {/* Programs */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base md:text-lg">Programlar</CardTitle>
              <Button asChild variant="secondary" size="sm" className="gap-2">
                <Link href="/dashboard/coach/programs/create">
                  <Plus className="h-4 w-4" />
                  Yeni Program
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {/* ⬇️ Hide internal header to avoid duplicate titles */}
              <ProgramList showHeader={false} />
            </CardContent>
          </Card>
        </section>
      </main>
      <MobileCoachBottomNav unreadNotifications={unreadCount} />
    </div>
  );
}

/* --------------------------------- UI Bits -------------------------------- */
function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <div className="h-[84px] w-[84px] rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-2">
        <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-4 w-56 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </div>
    </div>
  );
}
