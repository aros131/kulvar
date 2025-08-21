// src/app/dashboard/user/page.tsx
"use client";

import { useEffect, useState } from "react";
import UserNavbar from "@/components/nav/UserNavbar";
import Link from "next/link";
import SidebarNavUser from "@/components/ui/SidebarNavUser";
import Image from "next/image";

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

export default function UserDashboardPage() {
  const [programs, setPrograms] = useState<UserProgram[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);

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

    fetchPrograms();
    fetchProgress();
    fetchUnreadNotifications();
    fetchProfile();
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
