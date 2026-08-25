"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import ProgressChart from "@/components/program/ProgressChart";
import UserPageShell from "@/components/user/UserPageShell";


const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), { ssr: false });
const Doughnut = dynamic(() => import("react-chartjs-2").then((mod) => mod.Doughnut), { ssr: false });

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
  coachName?: string; // ✅ Add this line
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
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/progress/all-program-progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPrograms(data.programProgress || []);
      } catch {
        setPrograms([]);
      }
    };

    const fetchProgress = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/analytics/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProgress({
          totalCompletedSessions: data.totalCompletedSessions || 0,
          assignedPrograms: data.assignedPrograms || 0,
          goalTracking: data.goalTracking || [],
        });
      } catch {
        setProgress(null);
      }
    };

    fetchPrograms();
    fetchProgress();
  }, []);

  return (
    <UserPageShell>
    <div className="w-full px-4 py-8 md:py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Programların</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-8">
          Sana atanmış programları ve hedef ilerlemeni burada takip edebilirsin.
        </p>

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
                  ? `${Math.round(programs.reduce((a, b) => a + b.progressPercentage, 0) / programs.length)}%`
                  : "0%"}
              </p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
  {programs.length > 0 ? (
    programs.map((program) => (
      <div key={program.programId} className="bg-white dark:bg-zinc-800 rounded-xl shadow p-4 flex flex-col justify-between transition-transform hover:scale-[1.01]">
        
        {/* 🏷️ Header + Info */}
        <div>
          <h3 className="text-xl font-semibold mb-1">{program.name}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{program.description}</p>

          {/* 🧑‍🏫 Coach + Tag */}
          <div className="flex justify-between items-center mb-4 text-xs text-zinc-400">
           
            {program.coachName && <span>Koç: {program.coachName}</span>}
          </div>
        </div>

        {/* 📊 Progress Chart */}
        <div className="mb-4">
          <ProgressChart completionPercentage={program.progressPercentage || 0} />
        </div>

        {/* ⏱ Duration */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Süre: {program.duration || "Bilinmiyor"}
        </p>

        {/* 🚀 CTA Button */}
        <Link href={`/dashboard/user/programs/${program.programId}`}>
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

        {programs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow">
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

            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow">
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
    </div>
    </UserPageShell>
  );
}
