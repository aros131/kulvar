"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProgramCard from "@/components/dashboard/ProgramCard";

import Link from "next/link";
import SidebarNavUser from "@/components/ui/SidebarNavUser";

interface UserProgram {
  programId: string;
  name: string;
  description: string;
  duration?: string;
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

export default function UserDashboardPage() {
  const [programs, setPrograms] = useState<UserProgram[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchPrograms = async () => {
      const res = await fetch("https://kulvar-qb7t.onrender.com/progress/all-program-progress", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPrograms(data.programProgress || []);
    };

    const fetchProgress = async () => {
      const res = await fetch("https://kulvar-qb7t.onrender.com/dashboard/analytics/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProgress({
        totalCompletedSessions: data.totalCompletedSessions || 0,
        assignedPrograms: data.assignedPrograms || 0,
        goalTracking: data.goalTracking || [],
      });
    };

    const fetchUnreadNotifications = async () => {
      const res = await fetch("https://kulvar-qb7t.onrender.com/dashboard/notifications/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const unread = (data.notifications as Notification[]).filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    };

    fetchPrograms();
    fetchProgress();
    fetchUnreadNotifications();
  }, []);

  return (
    <div className="flex">
      <SidebarNavUser unreadCount={unreadCount} />

      <main className="ml-16 w-full min-h-screen bg-zinc-100 dark:bg-zinc-900">
        <Navbar />

        <section className="max-w-6xl mx-auto px-4 py-10 space-y-10">
          {/* 💬 Welcome */}
          <div className="bg-gradient-to-r from-green-100 to-green-200 dark:from-zinc-800 dark:to-zinc-700 p-6 rounded-xl shadow flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">👋 Hoş Geldin!</h1>
              <p className="text-zinc-600 dark:text-zinc-300">
                Bugün de hedeflerine ulaşmak için harika bir gün.
              </p>
            </div>
            <img src="/images/motivation.png" className="w-24 hidden md:block" alt="Motivasyon" />
          </div>

          {/* 🔥 Programs Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">📋 Programların</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.length > 0 ? (
                programs.map((program) => (
                  <div key={program.programId} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow">
                    <ProgramCard
                      name={program.name}
                      description={program.description}
                      duration={program.duration || "Bilinmiyor"}
                      progressPercentage={program.progressPercentage}
                    />
                    <Link href={`/dashboard/user/programs/${program.programId}`}>
                      <button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition">
                        Programa Git
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <p>Atanmış programın yok.</p>
              )}
            </div>
          </div>

          {/* 🎯 Goal Overview Section */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">🎯 Hedef Takibi</h2>

            {progress?.goalTracking.length ? (
              <div className="space-y-6">
                {progress.goalTracking.map((goal) => (
                  <div key={goal.programId}>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span>Program ID: {goal.programId}</span>
                      <span>{goal.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-zinc-300 dark:bg-zinc-600 h-3 rounded-full">
                      <div
                        className="h-3 rounded-full bg-green-500 transition-all duration-500"
                        style={{ width: `${goal.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Hedef bulunamadı.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
