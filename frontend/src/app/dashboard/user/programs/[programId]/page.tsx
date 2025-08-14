"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Program } from "@/types/program";
import ProgressChart from "@/components/program/ProgressChart";
import SessionTimeline from "@/components/program/SessionTimeline";
import StreakTracker from "@/components/program/StreakTracker";
import FeedbackHistory from "@/components/program/FeedbackHistory";
import CalendarHeatmap from "@/components/program/CalendarHeatmap";
import ProgramDetailsView from "@/components/program/ProgramDetailsView";
import { useProgramProgress } from "@/hooks/useProgramProgress";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com";

interface UserProgress {
  progressPercentage: number;
  completedSessions: { sessionId: string }[];
  totalSessions: number;
  streakTracking?: {
    currentStreak: number;
    longestStreak: number;
  };
}

export default function ProgramContentPage() {
  // ✅ Ensure programId is a string
  const { programId } = useParams<{ programId: string }>();

  const [program, setProgram] = useState<Program | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  // ✅ Progress hook (server provides completed/total; hook also returns percent)
  const { loading, error, completed, total, percent } = useProgramProgress(programId);

  useEffect(() => {
    if (!programId) return;

    const token = localStorage.getItem("token") ?? "";
    const ac = new AbortController();

    const fetchProgram = async () => {
      try {
        const res = await fetch(`${API_URL}/programs/${programId}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProgram(data.program);
      } catch {
        // optional: toast or soft error UI
      }
    };

    const fetchUserProgress = async () => {
      try {
        const res = await fetch(`${API_URL}/progress/user/${programId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setUserProgress(data);
      } catch {
        // optional: toast or soft error UI
      }
    };

    fetchProgram();
    fetchUserProgress();

    return () => ac.abort();
  }, [programId]);

  if (!program) return <div className="p-4">Program yükleniyor…</div>;

  // ✅ Completed session ids (defensive, no non-null assertion)
  const completedIds = new Set(
    Array.isArray(userProgress?.completedSessions)
      ? userProgress!.completedSessions.map((s) => s.sessionId)
      : []
  );

  // ✅ Build timeline view model (use real session IDs when available)
  const timelineSessions =
    program.dailySchedule?.flatMap((dayEntry, dayIdx) =>
      (dayEntry.sessions || []).map((s: any, si: number) => {
        const candidateId =
          s.sessionId ?? s._id ?? s.id ?? `day-${dayIdx + 1}`; // fallback keeps your current logic
        return {
          day: dayIdx + 1,
          title: s.name,
          completed: completedIds.has(candidateId),
        };
      })
    ) || [];

  return (
    <div className="min-h-screen w-full px-4 py-10 bg-zinc-100 dark:bg-zinc-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-6">{program.description}</p>

        {/* 🔘 Donut Chart — single source, rendered in-place */}
        <div className="mb-8">
          {loading && <div className="text-sm text-zinc-500">İlerleme yükleniyor…</div>}
          {error && <div className="text-sm text-red-600">Hata: {error}</div>}
          {!loading && !error && (
            total > 0 ? (
              <ProgressChart completedSessions={completed} totalSessions={total} />
            ) : (
              <ProgressChart
                completionPercentage={Math.round(userProgress?.progressPercentage ?? percent ?? 0)}
              />
            )
          )}
        </div>

        {/* 🔥 Streak */}
        <div className="mb-8">
          <StreakTracker programId={program._id} />
        </div>

        {/* 📄 Program details */}
        <ProgramDetailsView program={program} />

        {/* 📆 Session Timeline */}
        <div className="mb-8">
          <SessionTimeline sessions={timelineSessions} programId={program._id} />
        </div>

        {/* 🗓 Calendar Heatmap */}
        <div className="mb-8">
          <CalendarHeatmap programId={program._id} />
        </div>

        {/* 💬 Feedback History */}
        <div className="mb-8">
          <FeedbackHistory programId={program._id} />
        </div>
      </div>
    </div>
  );
}
