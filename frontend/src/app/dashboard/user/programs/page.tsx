"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid, ChevronRight, Calendar, TrendingUp, Dumbbell, Play, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import UserPageShell from "@/components/user/UserPageShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

interface UserProgram {
  programId: string;
  name: string;
  description: string;
  duration?: string;
  progressPercentage: number;
  coachName?: string;
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  const color =
    pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-indigo-500";
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-muted-foreground">İlerleme</span>
        <span className="text-xs font-semibold tabular-nums">{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function UserProgramsPage() {
  const [programs, setPrograms] = useState<UserProgram[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [started, setStarted] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("startedPrograms");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchPrograms = async () => {
      try {
        const res = await fetch(`${API}/progress/all-program-progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPrograms(data.programProgress || []);
      } catch {
        setPrograms([]);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API}/dashboard/analytics/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTotalSessions(data.totalCompletedSessions || 0);
      } catch {}
    };

    Promise.all([fetchPrograms(), fetchAnalytics()]).finally(() => setLoading(false));
  }, []);

  const avgProgress =
    programs.length > 0
      ? Math.round(programs.reduce((a, b) => a + b.progressPercentage, 0) / programs.length)
      : 0;

  const today = new Date().toISOString().slice(0, 10);

  const handleStart = async (programId: string) => {
    const token = localStorage.getItem("token");
    setStarting(programId);
    try {
      const res = await fetch(`${API}/programs/${programId}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: today }),
      });
      if (!res.ok) throw new Error();
      setStarted((prev) => {
        const next = new Set([...prev, programId]);
        try { localStorage.setItem("startedPrograms", JSON.stringify([...next])); } catch {}
        return next;
      });
      toast.success("Program başlatıldı! Takviminde antrenmanlar oluşturuldu.");
    } catch {
      toast.error("Program başlatılamadı.");
    } finally {
      setStarting(null);
    }
  };

  if (loading) {
    return (
      <UserPageShell>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <div className="h-8 w-48 rounded-xl bg-muted animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
          </div>
          {[1, 2].map((i) => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      </UserPageShell>
    );
  }

  return (
    <UserPageShell>
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programlarım</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Atanmış programların ve ilerleme durumun</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border rounded-2xl p-4 text-center">
            <div className="flex justify-center mb-1.5">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{programs.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Program</p>
          </div>
          <div className="bg-card border rounded-2xl p-4 text-center">
            <div className="flex justify-center mb-1.5">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{totalSessions}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tamamlanan</p>
          </div>
          <div className="bg-card border rounded-2xl p-4 text-center">
            <div className="flex justify-center mb-1.5">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{avgProgress}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ort. İlerleme</p>
          </div>
        </div>

        {/* Program list */}
        {programs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <ClipboardList className="mx-auto text-muted-foreground" size={40} />
            <p className="font-semibold">Henüz program atanmamış</p>
            <p className="text-sm text-muted-foreground">Koçun sana bir program atadığında burada görünecek.</p>
            <Link
              href="/dashboard/user/koclarimiz"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Koç bul <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {programs.map((program) => (
              <li key={program.programId} className="bg-card border rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
                <div className="p-4 space-y-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base leading-tight truncate">{program.name}</h3>
                      {program.coachName && (
                        <p className="text-xs text-muted-foreground mt-0.5">Koç: {program.coachName}</p>
                      )}
                      {program.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{program.description}</p>
                      )}
                    </div>
                    {program.duration && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground shrink-0 whitespace-nowrap">
                        {program.duration}
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  <ProgressBar value={program.progressPercentage} />

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {!started.has(program.programId) ? (
                      <>
                        <button
                          onClick={() => handleStart(program.programId)}
                          disabled={starting === program.programId}
                          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
                        >
                          <Play className="h-4 w-4" />
                          {starting === program.programId ? "Oluşturuluyor..." : "Takvime Aktar"}
                        </button>
                        <Link href={`/dashboard/user/programs/${program.programId}`} className="shrink-0">
                          <button className="flex items-center justify-center gap-1.5 border bg-background hover:bg-muted px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                            Detay
                          </button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href={`/takvim?date=${today}`} className="flex-1">
                          <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-xl text-sm font-medium transition-colors">
                            <Calendar className="h-4 w-4" />
                            Devam Et
                          </button>
                        </Link>
                        <Link href={`/dashboard/user/programs/${program.programId}`} className="shrink-0">
                          <button className="flex items-center justify-center gap-1.5 border bg-background hover:bg-muted px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                            Detay
                          </button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </UserPageShell>
  );
}
