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

type UISession = {
  sessionId?: string;
  _id?: string;
  id?: string;
  name?: string;
};

// Helper: always return an array
function asArray<T>(val: unknown): T[] {
  return Array.isArray(val) ? (val as T[]) : [];
}

export default function ProgramContentPage() {
  const { programId } = useParams<{ programId: string }>();

  const [program, setProgram] = useState<Program | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

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
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Program ${res.status} – ${body.slice(0,120)}…`);
        }
        const data = await res.json();
        setProgram(data.program);
      } catch (e) {
        console.error("Program fetch failed:", e);
        setProgram(null);
      }
    };

    const fetchUserProgress = async () => {
      try {
        const res = await fetch(`${API_URL}/progress/user/${programId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        });
        if (!res.ok) {
          const body = await res.text(); // avoid JSON parse of HTML 404
          throw new Error(`Progress ${res.status} – ${body.slice(0,120)}…`);
        }
        const data = await res.json();
        setUserProgress(data);
      } catch (e) {
        console.error("User progress fetch failed:", e);
        setUserProgress(null);
      }
    };

    fetchProgram();
    fetchUserProgress();

    return () => ac.abort();
  }, [programId]);

  if (!program) return <div className="p-4">Program yükleniyor…</div>;

  // ✅ Safe completed IDs (never map on non-array)
  const completedSessionsArr = asArray<{ sessionId: string }>(userProgress?.completedSessions);
  const completedIds = new Set(completedSessionsArr.map((s) => s.sessionId));

  // ✅ Safe timeline build (guard both dailySchedule and sessions)
  const daily = asArray<Program["dailySchedule"] extends (infer D)[] ? D : any>(program.dailySchedule);
  const timelineSessions =
    daily.flatMap((dayEntry, dayIdx) => {
      const sessions = asArray<UISession>((dayEntry as any)?.sessions);
      return sessions.map((s, idx) => {
        const candidateId = s.sessionId ?? s._id ?? s.id ?? `day-${dayIdx + 1}-s-${idx + 1}`;
        return {
          day: dayIdx + 1,
          title: s.name ?? `Session ${idx + 1}`,
          completed: completedIds.has(candidateId),
        };
      });
    });

  return (
    <div className="min-h-screen w-full px-4 py-10 bg-zinc-100 dark:bg-zinc-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-6">{program.description}</p>

        {/* 🔘 Donut Chart */}
        <div className="mb-8">
          {loading && <div className="text-sm text-zinc-500">İlerleme yükleniyor…</div>}
          {error && <div className="text-sm text-red-600">Hata: {error}</div>}
          {!loading && !error && (
            (Number(total) > 0) ? (
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
