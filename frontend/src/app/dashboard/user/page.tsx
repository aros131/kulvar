"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProgramCard from "@/components/dashboard/ProgramCard";
import WelcomeWidget from "@/components/dashboard/WelcomeWidget";
import Link from "next/link";

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
}

export default function UserDashboardPage() {
  const [programs, setPrograms] = useState<UserProgram[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token being sent:", token);

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

    const fetchNotifications = async () => {
      const res = await fetch("https://kulvar-qb7t.onrender.com/dashboard/notifications/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    };

    fetchPrograms();
    fetchProgress();
    fetchNotifications();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      <Navbar />
      <WelcomeWidget />

      <section className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Hoş Geldin!</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-8">Bugün de hedeflerine ulaşmak için harika bir gün.</p>

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
      <Link href={`/programs/${program.programId}`}>
        <button className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">
          Programa Bak
        </button>
      </Link>
    </div>
  ))
) : (
  <p>Atanmış programın yok.</p>
)}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ✅ Progress Overview */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">İlerleme</h2>
            {progress ? (
              <div>
                <p>Toplam Tamamlanan Seans: <strong>{progress.totalCompletedSessions}</strong></p>
                <p>Atanmış Programlar: <strong>{progress.assignedPrograms}</strong></p>
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Hedef Takibi:</h3>
                  {progress.goalTracking.length > 0 ? (
                    progress.goalTracking.map((g) => (
                      <div key={g.programId} className="mb-2">
                        <p>Program ID: {g.programId}</p>
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${g.progressPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-sm">{g.progressPercentage}% tamamlandı</p>
                      </div>
                    ))
                  ) : (
                    <p>Hedef bulunamadı.</p>
                  )}
                </div>
              </div>
            ) : (
              <p>İlerleme verisi yükleniyor...</p>
            )}
          </div>

          {/* ✅ Notifications */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">Bildirimler</h2>
            {notifications.length > 0 ? (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li key={n._id} className="border-b pb-2">
                    <p className={`${n.isRead ? "text-zinc-500" : "text-zinc-800 dark:text-white font-medium"}`}>
                      {n.message}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Yeni bildirimin yok.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
