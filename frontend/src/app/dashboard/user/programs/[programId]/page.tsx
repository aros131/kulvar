"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Program } from "@/types/program";
import ProgressChart from "@/components/program/ProgressChart";
import SessionTimeline from "@/components/program/SessionTimeline";
import StreakTracker from "@/components/program/StreakTracker";
import FeedbackHistory from "@/components/program/FeedbackHistory";
import CalendarHeatmap from "@/components/program/CalendarHeatmap";
import ProgramDetailsView from "@/components/program/ProgramDetailsView";
import { tryCandidatesJSON } from "@/lib/api";

interface UserProgress {
  progressPercentage?: number;
  completedSessions?: { sessionId: string }[];
  totalSessions?: number;
  streakTracking?: { currentStreak: number; longestStreak: number };
}
type UISession = { sessionId?: string; _id?: string; id?: string; name?: string };

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export default function ProgramContentPage() {
  const { programId } = useParams<{ programId: string }>();

  const [program, setProgram] = useState<Program | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) return;
    const token = localStorage.getItem("token") ?? "";
    let cancelled = false;

    (async () => {
      try {
        // Program: try common shapes
        const { data: programData } = await tryCandidatesJSON<{ program: Program } | Program>(
          [`programs/${programId}`, `program/${programId}`],
          {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            cache: "no-store",
          }
        );

        if (cancelled) return;

        const p = (programData && "program" in programData ? (programData as any).program : programData) as Program | null;
        if (!p) throw new Error("Program bulunamadı (404).");
        setProgram(p);
      } catch (e) {
        if (cancelled) return;
        setLoadErr(e instanceof Error ? e.message : String(e));
        setProgram(null);
      }
    })();

    (async () => {
      try {
        const { data } = await tryCandidatesJSON<UserProgress>(
          [
            `progress/user/${programId}`,
            `user/progress/${programId}`,
            `users/me/progress/${programId}`,
            `users/me/programs/${programId}/progress`,
            `progress/${programId}`,
            `programs/${programId}/progress`,
          ],
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        if (!cancelled) setUserProgress(data ?? null);
      } catch {
        if (!cancelled) setUserProgress(null); // fail-soft
      }
    })();

    return () => { cancelled = true; };
  }, [programId]);

  if (!program) {
    return <div className="p-4">{loadErr ? `Yükleme hatası: ${loadErr}` : "Program yükleniyor…"}</div>;
  }

  // Completed IDs from userProgress
  const completedIds = new Set(asArray<{ sessionId: string }>(userProgress?.completedSessions).map(s => s.sessionId));

  // Timeline + totals from Program (stable)
  const daily = asArray<Program["dailySchedule"] extends (infer D)[] ? D : never>(program.dailySchedule);
  const timelineSessions = daily.flatMap((dayEntry, dayIdx) => {
    const sessions = asArray<UISession>((dayEntry as any)?.sessions);
    return sessions.map((s, idx) => ({
      day: dayIdx + 1,
      title: s.name ?? `Session ${idx + 1}`,
      completed: completedIds.has(s.sessionId ?? s._id ?? s.id ?? `day-${dayIdx + 1}-s-${idx + 1}`),
    }));
  });

  const totalSessionsFromProgram = daily.reduce((acc, d: any) => acc + asArray<any>(d?.sessions).length, 0);
  const completedCount = completedIds.size;
  const pct = totalSessionsFromProgram > 0
    ? Math.max(0, Math.min(100, Math.round((completedCount / totalSessionsFromProgram) * 100)))
    : Math.max(0, Math.min(100, Math.round(userProgress?.progressPercentage ?? 0)));

  return (
    <div className="min-h-screen w-full px-4 py-10 bg-zinc-100 dark:bg-zinc-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-6">{program.description}</p>

        {/* Donut chart – consistent with timeline */}
        <div className="mb-8">
          {totalSessionsFromProgram > 0 ? (
            <ProgressChart completedSessions={completedCount} totalSessions={totalSessionsFromProgram} />
          ) : (
            <ProgressChart completionPercentage={pct} />
          )}
        </div>

        <div className="mb-8">
          <StreakTracker programId={program._id} />
        </div>

        <ProgramDetailsView program={program} />

        <div className="mb-8">
          <SessionTimeline sessions={timelineSessions} programId={program._id} />
        </div>

        <div className="mb-8">
          <CalendarHeatmap programId={program._id} />
        </div>

        <div className="mb-8">
          <FeedbackHistory programId={program._id} />
        </div>
      </div>
    </div>
  );
}
