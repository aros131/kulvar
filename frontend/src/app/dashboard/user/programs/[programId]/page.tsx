"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Program } from "@/types/program";
import ProgressChart from "@/components/program/ProgressChart";
import SessionTimeline from "@/components/program/SessionTimeline";
import StreakTracker from "@/components/program/StreakTracker";
import FeedbackHistory from "@/components/program/FeedbackHistory";
import CalendarHeatmap from "@/components/program/CalendarHeatmap";

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
  const { programId } = useParams();
  const [program, setProgram] = useState<Program | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchProgram = async () => {
      const res = await fetch(
        `https://kulvar-qb7t.onrender.com/programs/${programId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      setProgram(data.program);
    };

    const fetchUserProgress = async () => {
      const res = await fetch(
        `https://kulvar-qb7t.onrender.com/progress/user/${programId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setUserProgress(data);
    };

    if (programId) {
      fetchProgram();
      fetchUserProgress();
    }
  }, [programId]);

  if (!program) return <div className="p-4">Program yükleniyor...</div>;

  const completedIds = new Set(
    userProgress?.completedSessions?.map((s) => s.sessionId)
  );

  const timelineSessions =
    program.dailySchedule?.flatMap((dayEntry, index) =>
      (dayEntry.sessions || []).map((s) => ({
        day: index + 1,
        title: s.name,
        completed: completedIds.has(`day-${index + 1}`),
      }))
    ) || [];

  return (
    <div className="min-h-screen w-full px-4 py-10 bg-zinc-100 dark:bg-zinc-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-6">
          {program.description}
        </p>

        {/* 🔘 Donut Chart */}
        <div className="mb-8">
          <ProgressChart
            completionPercentage={userProgress?.progressPercentage || 0}
          />
        </div>

        {/* 🔥 Streak */}
        <div className="mb-8">
          <StreakTracker programId={program._id} />
        </div>

        {/* 📆 Session Timeline */}
        <div className="mb-8">
          <SessionTimeline
            sessions={timelineSessions}
            programId={program._id}
          />
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