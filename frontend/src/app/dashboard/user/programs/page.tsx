"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserPageShell from "@/components/user/UserPageShell";
import { Dumbbell, ChevronRight, ArrowRight } from "lucide-react";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

interface UserProgram {
  programId: string;
  name: string;
  description: string;
  duration?: number | string;
  progressPercentage: number;
  coachName?: string;
}

interface UserProgress {
  totalCompletedSessions: number;
  assignedPrograms: number;
  goalTracking: { programId: string; progressPercentage: number }[];
}

const PROGRAM_PHOTOS: { keywords: string[]; url: string }[] = [
  { keywords: ["koşu", "run", "kardiyo", "cardio", "kondisyon"], url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["yoga", "meditasyon", "nefes", "pilates", "esneklik", "stretching"], url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["kilo verme", "yağ yakma", "zayıflama", "fat", "weight loss"], url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["kas", "güç", "strength", "bulk", "hacim", "hypertrophy"], url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["hiit", "interval", "circuit", "tabata"], url: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["bisiklet", "cycling", "spin"], url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["yüzme", "swim", "pool"], url: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["boks", "box", "dövüş", "muay", "kick"], url: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&h=338&fit=crop&auto=format" },
  { keywords: ["fonksiyonel", "functional", "crossfit", "kettlebell"], url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=338&fit=crop&auto=format" },
];

const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=338&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=338&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=338&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=338&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=338&fit=crop&auto=format",
];

function getProgramPhoto(name: string, goal?: string, index = 0): string {
  const haystack = `${name} ${goal ?? ""}`.toLowerCase();
  for (const entry of PROGRAM_PHOTOS) {
    if (entry.keywords.some((kw) => haystack.includes(kw))) return entry.url;
  }
  return FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length];
}

function progressColor(pct: number) {
  if (pct >= 80) return "#22c55e";
  if (pct >= 50) return "#f59e0b";
  return "#6366f1";
}

function ProgramCard({ program, index }: { program: UserProgram; index: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(program.progressPercentage)));
  const photoUrl = getProgramPhoto(program.name, (program as any).fitnessGoal, index);
  return (
    <div className="rounded-2xl border bg-card overflow-hidden flex flex-col hover:shadow-md hover:border-primary/30 transition-all">
      {/* Thumb */}
      <div className="aspect-[16/9] relative overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={program.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2">
          <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: progressColor(pct) }}
            />
          </div>
          <span className="text-white text-xs font-semibold tabular-nums drop-shadow">{pct}%</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-base leading-snug line-clamp-1">{program.name}</h3>
          {program.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {program.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {program.coachName && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium">
                Koç: {program.coachName}
              </span>
            )}
            {program.duration != null && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {program.duration} hafta
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/dashboard/user/programs/${program.programId}`}
          className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground text-sm font-medium py-2.5 hover:opacity-90 transition-opacity"
        >
          {pct === 0 ? "Başla" : pct >= 100 ? "Tekrar İncele" : "Devam Et"}
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <div className="text-2xl font-bold tabular-nums leading-none">{value}</div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-zinc-200 dark:bg-zinc-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        <div className="h-9 w-full bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
      </div>
    </div>
  );
}

export default function UserProgramsPage() {
  const [programs, setPrograms] = useState<UserProgram[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/progress/all-program-progress`, { headers }).then((r) => r.json()).catch(() => ({})),
      fetch(`${API}/dashboard/analytics/user`, { headers }).then((r) => r.json()).catch(() => ({})),
    ]).then(([prog, analytics]) => {
      setPrograms(prog.programProgress || []);
      setProgress({
        totalCompletedSessions: analytics.totalCompletedSessions || 0,
        assignedPrograms: analytics.assignedPrograms || 0,
        goalTracking: analytics.goalTracking || [],
      });
    }).finally(() => setLoading(false));
  }, []);

  const avgPct =
    programs.length > 0
      ? Math.round(programs.reduce((a, b) => a + b.progressPercentage, 0) / programs.length)
      : 0;

  return (
    <UserPageShell>
      <div className="w-full px-4 py-8 md:py-10">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Programların</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sana atanmış programlar ve ilerlemen
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatPill label="Tamamlanan Seans" value={progress?.totalCompletedSessions ?? "—"} />
            <StatPill label="Aktif Program" value={progress?.assignedPrograms ?? "—"} />
            <StatPill label="Ort. İlerleme" value={`${avgPct}%`} />
          </div>

          {/* Program Cards */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : programs.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {programs.map((p, i) => <ProgramCard key={p.programId} program={p} index={i} />)}
            </div>
          ) : (
            <div className="rounded-2xl border bg-card py-16 text-center space-y-3">
              <Dumbbell className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="font-semibold text-lg">Henüz program atanmadı</p>
              <p className="text-sm text-muted-foreground">Bir koçla eşleşerek program almaya başlayabilirsin.</p>
              <Link
                href="/koc"
                className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-primary hover:underline"
              >
                Koç Bul <ArrowRight size={14} />
              </Link>
            </div>
          )}

        </div>
      </div>
    </UserPageShell>
  );
}
