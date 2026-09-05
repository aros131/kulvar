"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Program } from "@/types/program";
import ProgramDetailsView from "@/components/program/ProgramDetailsView";
import { useProgramProgress } from "@/hooks/useProgramProgress";
import UserPageShell from "@/components/user/UserPageShell";
import { ArrowLeft, Flame, CheckCircle2, Clock, ChevronRight, Trophy, Dumbbell } from "lucide-react";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

type UISession = { sessionId?: string; _id?: string; id?: string; name?: string };
type UserProgress = { completedSessions?: { sessionId: string }[] };
type Streak = { currentStreak: number; longestStreak: number };

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function sanitizeToken(raw: string | null) {
  if (!raw) return null;
  return raw.replace(/^"+|"+$/g, "").replace(/^Bearer\s+/i, "");
}
function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return payload.id || payload.userId || payload._id || payload.sub || null;
  } catch { return null; }
}

function difficultyColor(d?: string) {
  if (!d) return "bg-muted text-muted-foreground";
  const l = d.toLowerCase();
  if (l.includes("başlangıç")) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (l.includes("orta")) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

export default function ProgramContentPage() {
  const { programId } = useParams<{ programId: string }>();
  const router = useRouter();
  const detailRef = useRef<HTMLDivElement>(null);

  const [program, setProgram] = useState<Program | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const { loading: progressLoading, completed: hookCompleted, total: hookTotal, percent } = useProgramProgress(programId);

  useEffect(() => {
    if (!programId) return;
    const ac = new AbortController();

    Promise.all([
      // program data
      (async () => {
        const token = localStorage.getItem("token") ?? "";
        const res = await fetch(`${API}/programs/${programId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        setProgram((data as any).program ?? data);
      })(),

      // progress / completed sessions
      (async () => {
        try {
          const token = localStorage.getItem("token") ?? "";
          const res = await fetch(`${API}/progress/user/${programId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: ac.signal,
            cache: "no-store",
          });
          if (res.ok && (res.headers.get("content-type") || "").includes("json"))
            setUserProgress(await res.json());
        } catch {}
      })(),

      // streak
      (async () => {
        try {
          const raw = localStorage.getItem("token");
          const token = sanitizeToken(raw);
          const userId = getUserIdFromToken(token);
          if (!userId || !token) return;
          const res = await fetch(`${API}/progress/streaks/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: ac.signal,
            cache: "no-store",
          });
          if (res.ok && (res.headers.get("content-type") || "").includes("json"))
            setStreak(await res.json());
        } catch {}
      })(),
    ])
      .catch((e: any) => setLoadErr(e?.message || String(e)))
      .finally(() => setDataLoading(false));

    return () => ac.abort();
  }, [programId]);

  if (dataLoading || !program) {
    return (
      <UserPageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="space-y-3 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">{loadErr ? `Hata: ${loadErr}` : "Program yükleniyor…"}</p>
          </div>
        </div>
      </UserPageShell>
    );
  }

  const daily = asArray<any>(program.dailySchedule);
  const allSessions = daily.flatMap((dayEntry: any, dayIdx: number) =>
    asArray<UISession>(dayEntry?.sessions).map((s, idx) => {
      const sid = s.sessionId ?? (s as any)._id ?? (s as any).id ?? `day-${dayIdx + 1}-s-${idx + 1}`;
      return { day: dayIdx + 1, title: (s as any).name ?? `Seans ${idx + 1}`, sessionId: sid };
    })
  );

  const completedIds = new Set(
    asArray<{ sessionId: string }>(userProgress?.completedSessions).map((s) => s.sessionId)
  );

  const totalSessions = allSessions.length || hookTotal;
  const completedCount = completedIds.size || hookCompleted;
  const progressPct = totalSessions > 0
    ? Math.round((completedCount / totalSessions) * 100)
    : Math.round(percent);

  const nextSession = allSessions.find((s) => !completedIds.has(s.sessionId));
  const allDone = totalSessions > 0 && completedCount >= totalSessions;

  const diffWeeks = typeof program.duration === "number" ? program.duration : null;
  const daysLeft = diffWeeks != null ? Math.max(0, diffWeeks * 7 - Math.ceil(completedCount / Math.max(1, totalSessions / (diffWeeks * 7)))) : null;

  return (
    <UserPageShell>
      <div className="w-full px-4 py-6 md:py-10">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ── Back + Header ─────────────────────────────────────────── */}
          <div>
            <Link
              href="/dashboard/user/programs"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft size={14} />
              Programlarım
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                  {program.name}
                </h1>
                {program.description && (
                  <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed max-w-xl line-clamp-2">
                    {program.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {program.difficulty && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${difficultyColor(program.difficulty)}`}>
                      {program.difficulty}
                    </span>
                  )}
                  {program.fitnessGoal && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                      {program.fitnessGoal}
                    </span>
                  )}
                  {diffWeeks && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                      {diffWeeks} hafta
                    </span>
                  )}
                  {(program as any).coachName && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium">
                      Koç: {(program as any).coachName}
                    </span>
                  )}
                </div>
              </div>

              {/* Coach contact */}
              {(program as any).coachId && (
                <Link
                  href={`/dashboard/user/messages/start?to=${(program as any).coachId}&msg=${encodeURIComponent(`"${program.name}" programı hakkında sormak istediğim birkaç şey var.`)}`}
                  className="shrink-0 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border bg-card hover:bg-muted transition-colors"
                >
                  Koça mesaj at
                  <ChevronRight size={14} />
                </Link>
              )}
            </div>
          </div>

          {/* ── Stats Row ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Progress */}
            <div className="col-span-2 sm:col-span-1 rounded-2xl border bg-card p-4 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">İlerleme</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold tabular-nums leading-none">{progressPct}</span>
                <span className="text-muted-foreground text-sm mb-0.5">%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPct}%`,
                    background: progressPct >= 80 ? "#22c55e" : progressPct >= 50 ? "#f59e0b" : "#6366f1",
                  }}
                />
              </div>
            </div>

            {/* Sessions */}
            <div className="rounded-2xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Seanslar</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums">{completedCount}</span>
                <span className="text-muted-foreground text-sm">/ {totalSessions}</span>
              </div>
              <p className="text-xs text-muted-foreground">tamamlandı</p>
            </div>

            {/* Streak */}
            <div className="rounded-2xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Seri</p>
              <div className="flex items-center gap-1.5">
                <Flame size={18} className="text-orange-500 shrink-0" />
                <span className="text-2xl font-bold tabular-nums">{streak?.currentStreak ?? 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                en uzun: {streak?.longestStreak ?? 0} gün
              </p>
            </div>

            {/* Days left or status */}
            <div className="rounded-2xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {allDone ? "Durum" : "Kalan"}
              </p>
              {allDone ? (
                <div className="flex items-center gap-1.5">
                  <Trophy size={18} className="text-amber-500" />
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Tamamlandı</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} className="text-muted-foreground" />
                    <span className="text-2xl font-bold tabular-nums">
                      {totalSessions - completedCount}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">seans kaldı</p>
                </>
              )}
            </div>
          </div>

          {/* ── Today's Workout ───────────────────────────────────────── */}
          {allDone ? (
            <div className="rounded-2xl border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <Trophy size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">Tebrikler! Programı tamamladın.</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {completedCount} seansı başarıyla bitirdin. Koçunla yeni hedefler belirleyebilirsin.
                </p>
              </div>
            </div>
          ) : nextSession ? (
            <div
              className="rounded-2xl border-2 border-primary/20 bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:border-primary/40 transition-colors group"
              onClick={() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Dumbbell size={22} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary uppercase tracking-wide mb-0.5">Sıradaki Antrenman</p>
                <p className="text-base font-semibold truncate">{nextSession.title}</p>
                <p className="text-sm text-muted-foreground">Gün {nextSession.day}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl bg-primary text-primary-foreground group-hover:opacity-90 transition-opacity">
                  Devam Et
                  <ChevronRight size={15} />
                </span>
              </div>
            </div>
          ) : null}

          {/* ── Program Details (calendar, sessions, exercises) ────────── */}
          <div ref={detailRef} className="scroll-mt-4">
            <ProgramDetailsView
              program={program}
              programId={programId}
              completedSessionIds={completedIds}
            />
          </div>

        </div>
      </div>
    </UserPageShell>
  );
}
