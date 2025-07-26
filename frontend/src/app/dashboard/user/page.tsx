"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import ProgramCard from "@/components/dashboard/ProgramCard";
import WelcomeWidget from "@/components/dashboard/WelcomeWidget";
import Link from "next/link";
import SidebarNavUser from "@/components/ui/SidebarNavUser";

// Dynamically import charts for SSR safety
const Doughnut = dynamic(() => import("react-chartjs-2").then(mod => mod.Doughnut), { ssr: false });
const Bar = dynamic(() => import("react-chartjs-2").then(mod => mod.Bar), { ssr: false });

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

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
                      <div key={g.programId} className="mb-4">
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

                {/* 📊 Charts */}
                {programs.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow">
                      <h2 className="text-lg font-semibold mb-4">Program Tamamlanma Dağılımı</h2>
                      <Doughnut
                        data={{
                          labels: programs.map((p, i) => `${p.name} (${i + 1})`),
                          datasets: [
                            {
                              data: programs.map((p) => Number(p.progressPercentage || 0)),
                              backgroundColor: [
                                "#4ade80", "#facc15", "#60a5fa", "#f87171", "#a78bfa",
                                "#f472b6", "#34d399", "#f97316", "#818cf8", "#e879f9"
                              ],
                              borderWidth: 1,
                            },
                          ],
                        }}
                      />
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow">
                      <h2 className="text-lg font-semibold mb-4">Tamamlanma Oranları</h2>
                      <Bar
                        data={{
                          labels: programs.map((p, i) => `${p.name} (${i + 1})`),
                          datasets: [
                            {
                              label: "Tamamlanma %",
                              data: programs.map((p) => Number(p.progressPercentage || 0)),
                              backgroundColor: "#4ade80",
                            },
                          ],
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>İlerleme verisi yükleniyor...</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
