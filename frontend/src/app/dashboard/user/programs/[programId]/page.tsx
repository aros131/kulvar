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
import { useProgramProgress } from "@/hooks/useProgramProgress";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://kulvar-qb7t.onrender.com").replace(/\/+$/,"");

type UISession = { sessionId?: string; _id?: string; id?: string; name?: string };
type UserProgress = { completedSessions?: { sessionId: string }[] };

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export default function ProgramContentPage() {
  const { programId } = useParams<{ programId: string }>();

  const [program, setProgram] = useState<Program | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // still available if backend /progress/user/:id returns total & pct
  const { loading, error, completed, total, percent } = useProgramProgress(programId);

  useEffect(() => {
    if (!programId) return;
    const ac = new AbortController();
    (async () => {
      try {
        const token = localStorage.getItem("token") ?? "";
        const res = await fetch(`${API}/programs/${programId}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          signal: ac.signal,
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Program ${res.status}: ${body.slice(0,160)}…`);
        }
        const data = await res.json();
        const p: Program = (data && (data as any).program) ? (data as any).program : data;
        setProgram(p);
      } catch (e: any) {
        setLoadErr(e?.message || String(e));
        setProgram(null);
      }
    })();

    (async () => {
      try {
        const token = localStorage.getItem("token") ?? "";
        const res = await fetch(`${API}/progress/user/${programId}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          signal: ac.signal,
          cache: "no-store",
        });
        if (res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
          setUserProgress(await res.json());
        } else {
          setUserProgress(null);
        }
      } catch {
        setUserProgress(null);
      }
    })();

    return () => ac.abort();
  }, [programId]);

  if (!program) return <div className="p-4">{loadErr ? `Yükleme hatası: ${loadErr}` : "Program yükleniyor…"}</div>;

  const completedIds = new Set(asArray<{ sessionId: string }>(userProgress?.completedSessions).map(s => s.sessionId));

  const daily = asArray<Program["dailySchedule"] extends (infer D)[] ? D : never>(program.dailySchedule);
  const timelineSessions = daily.flatMap((dayEntry, dayIdx) => {
  const sessions = asArray<UISession>((dayEntry as any)?.sessions);
  return sessions.map((s, idx) => {
    const sid = s.sessionId ?? s._id ?? s.id ?? `day-${dayIdx + 1}-s-${idx + 1}`;
    return {
      day: dayIdx + 1,
      title: s.name ?? `Session ${idx + 1}`,
      sessionId: sid,                     // ✅ pass down to SessionTimeline
      completed: completedIds.has(sid),   // ✅ use the same id here
    };
  });
});


  const totalSessionsFromProgram = daily.reduce((acc, d: any) => acc + asArray<any>(d?.sessions).length, 0);
  const completedCount = completedIds.size;

  return (
    <div className="min-h-screen w-full px-4 py-10 bg-zinc-100 dark:bg-zinc-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-6">{program.description}</p>

        <div className="mb-8">
          {loading && <div className="text-sm text-zinc-500">İlerleme yükleniyor…</div>}
          {error && <div className="text-sm text-red-600">Hata: {error}</div>}
          {!loading && !error && (
            totalSessionsFromProgram > 0
              ? <ProgressChart completedSessions={completedCount} totalSessions={totalSessionsFromProgram} />
              : <ProgressChart completionPercentage={Math.round(percent)} />
          )}
        </div>

        <div className="mb-8">
          <StreakTracker programId={program._id} />
        </div>

        <ProgramDetailsView program={program} programId={""} />

       

       
        
      </div>
    </div>
  );
}
