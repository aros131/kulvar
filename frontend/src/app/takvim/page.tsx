"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UserPageShell from "@/components/user/UserPageShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalEvent {
  _id: string;
  title: string;
  start: string;
  end: string;
  status: "planned" | "completed" | "missed" | "canceled";
  programId?: string;
  sessionId?: string;
  externalKey?: string;
  description?: string;
}

interface Exercise {
  name: string;
  type?: string;
  sets?: number;
  reps?: number;
  weight?: number | null;
  restTime?: number;
  holdSeconds?: number;
  cardioMinutes?: number;
}

interface SessionInfo {
  name: string;
  exercises: Exercise[];
  timeOfDay?: string;
  notes?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TR_DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function formatDate(ymd: string) {
  const d = new Date(ymd + "T12:00:00");
  return `${TR_DAYS[d.getDay()]}, ${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function shiftDay(ymd: string, delta: number) {
  const d = new Date(ymd + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function isPast(iso: string) {
  return new Date(iso) < new Date();
}

// Parse externalKey → { dayIdx, sessionIdx }
function parseKey(key?: string) {
  if (!key) return null;
  const parts = key.split(":");
  if (parts.length < 3) return null;
  const dayIdx = parseInt(parts[1]);
  const sessionIdx = parseInt(parts[2]);
  if (isNaN(dayIdx) || isNaN(sessionIdx)) return null;
  return { dayIdx, sessionIdx };
}

function exerciseLabel(ex: Exercise) {
  if (ex.type === "cardio") return `${ex.cardioMinutes ?? "?"} dk`;
  if (ex.type === "isometric") return `${ex.sets ?? "?"} × ${ex.holdSeconds ?? "?"}sn`;
  const parts = [`${ex.sets ?? "?"}×${ex.reps ?? "?"}`];
  if (ex.weight) parts.push(`${ex.weight}kg`);
  if (ex.restTime) parts.push(`${ex.restTime}sn`);
  return parts.join("  ");
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, end }: { status: CalEvent["status"]; end: string }) {
  if (status === "completed")
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">✓ Tamamlandı</span>;
  if (status === "missed" || (status === "planned" && isPast(end)))
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Kaçırıldı</span>;
  if (status === "canceled")
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-muted-foreground dark:bg-primary/90">İptal</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">Planlı</span>;
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  session,
  onComplete,
  completing,
}: {
  event: CalEvent;
  session: SessionInfo | null;
  onComplete: (id: string) => void;
  completing: boolean;
}) {
  const canComplete = event.status === "planned";

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Dumbbell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base leading-tight">{event.title}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{fmtTime(event.start)} – {fmtTime(event.end)}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={event.status} end={event.end} />
      </div>

      {/* Exercises */}
      {session && session.exercises.length > 0 && (
        <div className="p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Egzersizler</p>
          <div className="space-y-1.5">
            {session.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-dashed border-border/60 last:border-0">
                <span className="font-medium">{ex.name}</span>
                <span className="text-muted-foreground text-xs tabular-nums">{exerciseLabel(ex)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coach notes */}
      {event.description && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            📝 {event.description}
          </p>
        </div>
      )}

      {/* Action */}
      {canComplete && (
        <div className="px-4 pb-4">
          <Button
            className="w-full gap-2"
            disabled={completing}
            onClick={() => onComplete(event._id)}
          >
            <CheckCircle2 className="h-4 w-4" />
            {completing ? "İşaretleniyor..." : "Tamamlandı Olarak İşaretle"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main inner ───────────────────────────────────────────────────────────────

function TakvimInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);
  const date = searchParams?.get("date") || today;

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [programCache, setProgramCache] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchEvents = useCallback(async (ymd: string) => {
    setLoading(true);
    setEvents([]);
    try {
      const from = `${ymd}T00:00:00.000Z`;
      const to = `${ymd}T23:59:59.999Z`;
      const res = await fetch(`${API}/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list: CalEvent[] = Array.isArray(data.events) ? data.events : [];
      setEvents(list);

      // Fetch unique programs
      const ids = [...new Set(list.map((e) => e.programId).filter(Boolean))] as string[];
      const missing = ids.filter((id) => !programCache[id]);
      if (missing.length > 0) {
        const fetched = await Promise.all(
          missing.map((id) =>
            fetch(`${API}/programs/${id}`, { headers: { Authorization: `Bearer ${token}` } })
              .then((r) => r.json())
              .catch(() => null)
          )
        );
        const next: Record<string, any> = { ...programCache };
        fetched.forEach((d, i) => {
          if (d) next[missing[i]] = d.program ?? d;
        });
        setProgramCache(next);
      }
    } catch {
      toast.error("Etkinlikler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchEvents(date); }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = (delta: number) => {
    router.push(`/takvim?date=${shiftDay(date, delta)}`);
  };

  const handleComplete = async (eventId: string) => {
    setCompleting(eventId);
    try {
      const res = await fetch(`${API}/events/${eventId}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, status: "completed" } : e))
      );
      toast.success("Antrenman tamamlandı! 💪");
    } catch {
      toast.error("İşlem başarısız.");
    } finally {
      setCompleting(null);
    }
  };

  // Resolve session info for an event
  const resolveSession = (event: CalEvent): SessionInfo | null => {
    if (!event.programId) return null;
    const program = programCache[event.programId];
    if (!program?.dailySchedule) return null;

    const key = parseKey(event.externalKey);
    if (key) {
      const day = program.dailySchedule[key.dayIdx];
      const sess = day?.sessions?.[key.sessionIdx];
      if (sess) return { name: sess.name, exercises: sess.exercises ?? [], timeOfDay: sess.timeOfDay, notes: day.notes };
    }

    // Fallback: match by sessionId
    if (event.sessionId) {
      for (const day of program.dailySchedule) {
        const sess = day.sessions?.find((s: any) => s.sessionId === event.sessionId);
        if (sess) return { name: sess.name, exercises: sess.exercises ?? [], timeOfDay: sess.timeOfDay, notes: day.notes };
      }
    }

    return null;
  };

  const isToday = date === today;

  return (
    <UserPageShell>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
        {/* Date nav */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="font-bold text-lg leading-tight">{formatDate(date)}</h1>
            {isToday && <span className="text-xs text-primary font-medium">Bugün</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">🏖️</p>
            <p className="font-semibold text-lg">Bu gün için antrenman yok</p>
            <p className="text-sm text-muted-foreground">Dinlenme günü veya henüz planlanmamış.</p>
            <Button variant="outline" onClick={() => router.push("/dashboard/user")}>
              Anasayfaya Dön
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                session={resolveSession(event)}
                onComplete={handleComplete}
                completing={completing === event._id}
              />
            ))}
          </div>
        )}

        {/* Today shortcut */}
        {!isToday && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/takvim?date=${today}`)}>
              Bugüne Git
            </Button>
          </div>
        )}
      </div>
    </UserPageShell>
  );
}

// ─── Export (Suspense boundary for useSearchParams) ───────────────────────────

export default function TakvimPage() {
  return (
    <Suspense>
      <TakvimInner />
    </Suspense>
  );
}
