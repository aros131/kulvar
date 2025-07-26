"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProgramCard from "@/components/dashboard/ProgramCard";
import WelcomeWidget from "@/components/dashboard/WelcomeWidget";
import Link from "next/link";
import SidebarNavUser from "@/components/ui/SidebarNavUser";
import ProgressChart from "@/components/program/ProgressChart";

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
        <WelcomeWidget />

        <section className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold mb-4">Hoş Geldin!</h1>
          <p className="text-zinc-600 dark:text-zinc-300 mb-8">
            Bugün de hedeflerine ulaşmak için harika bir gün.
          </p>

          {/* 🔥 Programs Section */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {programs.length > 0 ? (
              programs.map((program) => (
                <div key={program.programId} className="program-card">
                  <ProgramCard
                    name={program.name}
                    description={program.description}
                    duration={program.duration || "Bilinmiyor"}
                    progressPercentage={program.progressPercentage}
                  />
                  <Link href={`/dashboard/user/programs/${program.programId}`}>
                    <button className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">
                      Programa Git
                    </button>
                  </Link>
                </div>
              ))
            ) : (
              <p>Atanmış programın yok.</p>
            )}
          </div>

          {/* 📈 Goal Tracking */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">Hedef Takibi</h2>
            {progress?.goalTracking.length ? (
              progress.goalTracking.map((goal) => (
                <div key={goal.programId} className="mb-6">
                  <p className="mb-1 text-sm font-medium">Program: {goal.programId}</p>
                  <div className="w-full bg-gray-300 rounded-full h-2 mb-1">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${goal.progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm mb-2">{goal.progressPercentage}% tamamlandı</p>
                  <ProgressChart completionPercentage={goal.progressPercentage || 0} />
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
