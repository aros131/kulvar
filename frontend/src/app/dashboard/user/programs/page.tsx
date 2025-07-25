"use client";

import { useEffect, useState } from "react";
import ProgramCard from "@/components/dashboard/ProgramCard";
import Link from "next/link";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

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

export default function UserProgramsPage() {
  const [programs, setPrograms] = useState<UserProgram[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);

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

    fetchPrograms();
    fetchProgress();
  }, []);

  const donutData = {
    labels: programs.map((p) => p.name),
    datasets: [
      {
        data: programs.map((p) => p.progressPercentage),
        backgroundColor: ["#4ade80", "#facc15", "#60a5fa", "#f87171", "#a78bfa"],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: programs.map((p) => p.name),
    datasets: [
      {
        label: "Tamamlanma %",
        data: programs.map((p) => p.progressPercentage),
        backgroundColor: "#4ade80",
      },
    ],
  };

  return (
    <div className="min-h-screen w-full px-4 py-10 bg-zinc-100 dark:bg-zinc-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Programların</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-8">
          Sana atanmış programları ve hedef ilerlemeni burada takip edebilirsin.
        </p>

        {/* 📦 Summary Cards */}
        {progress && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow text-center">
              <h3 className="text-lg font-medium">Toplam Seans</h3>
              <p className="text-2xl font-bold">{progress.totalCompletedSessions}</p>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow text-center">
              <h3 className="text-lg font-medium">Aktif Programlar</h3>
              <p className="text-2xl font-bold">{progress.assignedPrograms}</p>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow text-center">
              <h3 className="text-lg font-medium">Güncel Ortalama</h3>
              <p className="text-2xl font-bold">
                {programs.length > 0
                  ? `${Math.round(
                      programs.reduce((a, b) => a + b.progressPercentage, 0) /
                        programs.length
                    )}%`
                  : "0%"}
              </p>
            </div>
          </div>
        )}

        {/* 🔥 Programs List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {programs.length > 0 ? (
            programs.map((program) => (
              <div key={program.programId} className="program-card">
                <ProgramCard
                  name={program.name}
                  description={program.description}
                  duration={program.duration || "Bilinmiyor"}
                  progressPercentage={program.progressPercentage}
                  image={program.image}
                  goalTag="Fitness"
                  coachName="Ali Hoca"
                />
                <Link href={`/programs/${program.programId}`}>
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

        {/* 📊 Charts */}
        {programs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow">
              <h2 className="text-lg font-semibold mb-4">Program Tamamlanma Dağılımı</h2>
              <Doughnut data={donutData} />
            </div>
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow">
              <h2 className="text-lg font-semibold mb-4">Tamamlanma Oranları</h2>
              <Bar data={barData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
