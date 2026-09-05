"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, Dumbbell, Play, Sparkles, Loader2 } from "lucide-react";
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

interface VideoUrl {
  url?: string;
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
  videoUrls?: VideoUrl[];
  gifUrl?: string;
}

interface SessionInfo {
  name: string;
  exercises: Exercise[];
  timeOfDay?: string;
  notes?: string;
}

interface OverloadSuggestion {
  exerciseName: string;
  lastWeight: number | null;
  lastReps: number | null;
  suggestedWeight: number | null;
  suggestedReps: number | null;
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

function parseKey(key?: string) {
  if (!key) return null;
  const parts = key.split(":");
  if (parts.length < 3) return null;
  const dayIdx = parseInt(parts[1]);
  const sessionIdx = parseInt(parts[2]);
  if (isNaN(dayIdx) || isNaN(sessionIdx)) return null;
  return { dayIdx, sessionIdx };
}

function setLabel(ex: Exercise) {
  if (ex.type === "cardio") return `${ex.cardioMinutes ?? "?"} dk`;
  if (ex.type === "isometric") return `${ex.holdSeconds ?? "?"}sn`;
  const parts: string[] = [];
  if (ex.reps) parts.push(`${ex.reps} tekrar`);
  if (ex.weight) parts.push(`${ex.weight} kg`);
  if (ex.restTime) parts.push(`${ex.restTime}sn dinlenme`);
  return parts.length ? parts.join(" · ") : "—";
}

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\s?]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return null;
}

function buildLog(exercises: Exercise[], setDone: Set<number>[]) {
  return {
    exercises: exercises.map((ex, i) => {
      const count = ex.sets ?? 1;
      return {
        name: ex.name,
        plannedSets: count,
        plannedReps: ex.reps ?? null,
        plannedWeight: ex.weight ?? null,
        sets: Array.from({ length: count }, (_, si) => ({
          setNumber: si + 1,
          reps: ex.reps ?? null,
          weight: ex.weight ?? null,
          completed: setDone[i]?.has(si) ?? false,
        })),
      };
    }),
  };
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

// ─── Exercise media ───────────────────────────────────────────────────────────

function ExerciseMedia({ url, description }: { url: string; description?: string }) {
  const embedUrl = getEmbedUrl(url);
  return (
    <div className="rounded-xl overflow-hidden bg-muted mt-1.5">
      {embedUrl ? (
        <iframe
          src={embedUrl}
          className="w-full aspect-video"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      ) : (
        <video src={url} controls className="w-full aspect-video" />
      )}
      {description && (
        <p className="text-xs text-muted-foreground px-3 py-2">{description}</p>
      )}
    </div>
  );
}

// ─── Set row ──────────────────────────────────────────────────────────────────

function SetRow({
  setIdx,
  ex,
  done,
  canToggle,
  completing,
  onToggle,
}: {
  setIdx: number;
  ex: Exercise;
  done: boolean;
  canToggle: boolean;
  completing: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-2 pl-8 pr-2 border-t border-dashed border-border/40 ${canToggle ? "cursor-pointer" : ""}`}
      onClick={canToggle ? onToggle : undefined}
    >
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
          done ? "bg-primary border-primary" : "border-muted-foreground/40"
        } ${completing ? "opacity-50" : ""}`}
      >
        {done && (
          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className={`text-xs font-medium shrink-0 text-muted-foreground w-10`}>Set {setIdx + 1}</span>
      <span className={`text-sm flex-1 transition-colors ${done ? "line-through text-muted-foreground" : ""}`}>
        {setLabel(ex)}
      </span>
    </div>
  );
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  session,
  suggestions,
  onComplete,
  completing,
}: {
  event: CalEvent;
  session: SessionInfo | null;
  suggestions: OverloadSuggestion[];
  onComplete: (id: string, log: object) => void;
  completing: boolean;
}) {
  const canComplete = event.status === "planned";
  const exercises = session?.exercises ?? [];
  const hasExercises = exercises.length > 0;

  // Per-exercise set completion: setDone[exIdx] = Set of done set indices
  const [setDone, setSetDone] = useState<Set<number>[]>(() =>
    exercises.map(() => new Set<number>())
  );
  const [expanded, setExpanded] = useState<Set<number>>(new Set<number>());
  const [openMedia, setOpenMedia] = useState<number | null>(null);
  const [altLoading, setAltLoading] = useState<number | null>(null);
  const [altResults, setAltResults] = useState<Record<number, string>>({});
  const [openAlt, setOpenAlt] = useState<number | null>(null);
  const autoTriggered = useRef(false);

  const fetchAlternatives = async (exIdx: number, exName: string) => {
    if (openAlt === exIdx) { setOpenAlt(null); return; }
    if (altResults[exIdx]) { setOpenAlt(exIdx); return; }
    setAltLoading(exIdx);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/ai/exercise-alternatives`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ exerciseName: exName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Hata ${res.status}`);
      const text = data.alternatives || "Şu an öneri üretilemedi.";
      setAltResults(prev => ({ ...prev, [exIdx]: text }));
      setOpenAlt(exIdx);
    } catch (err: any) {
      toast.error("AI öneri: " + (err.message || "Bağlantı hatası"));
    } finally {
      setAltLoading(null);
    }
  };

  useEffect(() => {
    if (event.status === "completed") {
      setSetDone(exercises.map(() => new Set<number>()));
      autoTriggered.current = false;
    }
  }, [event.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets ?? 1), 0);
  const doneSets = setDone.reduce((acc, s) => acc + s.size, 0);
  const progress = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const toggleSet = (exIdx: number, setIdx: number) => {
    if (!canComplete || completing) return;
    const next = setDone.map((s, i) => {
      if (i !== exIdx) return s;
      const ns = new Set(s);
      if (ns.has(setIdx)) ns.delete(setIdx); else ns.add(setIdx);
      return ns;
    });
    setSetDone(next);
    const newDone = next.reduce((acc, s) => acc + s.size, 0);
    if (newDone === totalSets && totalSets > 0 && !autoTriggered.current) {
      autoTriggered.current = true;
      onComplete(event._id, buildLog(exercises, next));
    }
  };

  const toggleExpand = (i: number) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  };

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

      {/* Session progress bar */}
      {canComplete && hasExercises && (
        <div className="px-4 pt-4 pb-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium">Seans İlerlemesi</span>
            <span className="tabular-nums">{doneSets}/{totalSets} set</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Exercise list with per-set rows */}
      {hasExercises && (
        <div className="px-4 pb-2 pt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Egzersizler</p>
          <div>
            {exercises.map((ex, exIdx) => {
              const setCount = ex.sets ?? 1;
              const exDone = setDone[exIdx]?.size ?? 0;
              const allDone = exDone === setCount;
              const isExpanded = expanded.has(exIdx);
              const hasMedia = ex.videoUrls?.some(v => v.url);
              const sugg = suggestions.find(s => s.exerciseName === ex.name);

              return (
                <div key={exIdx}>
                  {/* Exercise header row */}
                  <div
                    className={`flex items-center gap-3 py-2.5 border-b border-dashed border-border/60 last:border-0 ${canComplete ? "cursor-pointer select-none" : ""}`}
                    onClick={() => canComplete && toggleExpand(exIdx)}
                  >
                    {/* Done indicator */}
                    {canComplete && (
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          allDone ? "bg-primary border-primary" : "border-muted-foreground/40"
                        }`}
                      >
                        {allDone && (
                          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    )}


                    <span className={`font-medium text-sm flex-1 min-w-0 truncate transition-colors ${allDone ? "line-through text-muted-foreground" : ""}`}>
                      {ex.name}
                    </span>

                    {/* Set counter */}
                    <span className="text-muted-foreground text-xs tabular-nums shrink-0">
                      {canComplete
                        ? `${exDone}/${setCount} set`
                        : ex.type === "cardio"
                        ? `${ex.cardioMinutes ?? "?"} dk`
                        : ex.type === "isometric"
                        ? `${setCount}×${ex.holdSeconds ?? "?"}sn`
                        : `${setCount}×${ex.reps ?? "?"}`}
                    </span>

                    {/* Koç videosu varsa → oynat, yoksa → YouTube "nasıl yapılır" */}
                    {hasMedia ? (
                      <button
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                          openMedia === exIdx ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={e => { e.stopPropagation(); setOpenMedia(openMedia === exIdx ? null : exIdx); }}
                        title="Koç videosunu izle"
                      >
                        <Play className="w-3.5 h-3.5" fill="currentColor" />
                      </button>
                    ) : (
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' nasıl yapılır')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        title="Nasıl yapılır? (YouTube)"
                        className="p-1.5 rounded-lg transition-colors shrink-0 hover:bg-muted text-muted-foreground hover:text-red-500"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* AI Alternatif butonu */}
                    <button
                      className={`p-1.5 rounded-lg transition-colors shrink-0 ${openAlt === exIdx ? "bg-violet-100 text-violet-600 dark:bg-violet-950/40" : "hover:bg-muted text-muted-foreground hover:text-violet-500"}`}
                      onClick={e => { e.stopPropagation(); fetchAlternatives(exIdx, ex.name); }}
                      title="AI ile alternatif egzersiz öner"
                    >
                      {altLoading === exIdx
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Sparkles className="w-3.5 h-3.5" />}
                    </button>

                    {/* Expand icon */}
                    {canComplete && (
                      <span className="text-muted-foreground shrink-0">
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </span>
                    )}
                  </div>

                  {/* Overload suggestion chip */}
                  {sugg && canComplete && (
                    <div className="ml-8 mb-1 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
                        💡 {sugg.suggestedWeight
                          ? `${sugg.lastWeight}kg → ${sugg.suggestedWeight}kg dene`
                          : sugg.suggestedReps
                          ? `${sugg.lastReps} → ${sugg.suggestedReps} tekrar dene`
                          : null}
                      </span>
                    </div>
                  )}

                  {/* AI Alternatifler paneli */}
                  {openAlt === exIdx && altResults[exIdx] && (
                    <div className="ml-8 mb-2 mt-1 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <p className="text-[10px] font-semibold text-violet-500 mb-1.5 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Alternatif Öneriler</p>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">{altResults[exIdx]}</p>
                    </div>
                  )}

                  {/* Set rows (expanded) */}
                  {isExpanded && canComplete && (
                    <div className="mb-1">
                      {Array.from({ length: setCount }, (_, si) => (
                        <SetRow
                          key={si}
                          setIdx={si}
                          ex={ex}
                          done={setDone[exIdx]?.has(si) ?? false}
                          canToggle={canComplete && !completing}
                          completing={completing}
                          onToggle={() => toggleSet(exIdx, si)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Media panel */}
                  {openMedia === exIdx && ex.videoUrls && (
                    <div className="pb-2">
                      {ex.videoUrls.filter(v => v.url).map((v, vi) => (
                        <ExerciseMedia key={vi} url={v.url!} description={v.description} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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

      {/* Manual complete — only when no exercises to check off */}
      {canComplete && !hasExercises && (
        <div className="px-4 pb-4">
          <Button
            className="w-full gap-2"
            disabled={completing}
            onClick={() => onComplete(event._id, {})}
          >
            {completing ? "İşaretleniyor..." : "Tamamlandı Olarak İşaretle"}
          </Button>
        </div>
      )}

      {completing && hasExercises && (
        <div className="px-4 pb-4">
          <p className="text-xs text-center text-muted-foreground animate-pulse">Seans tamamlanıyor…</p>
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
  const [suggestionCache, setSuggestionCache] = useState<Record<string, OverloadSuggestion[]>>({});
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

      const ids = [...new Set(list.map((e) => e.programId).filter(Boolean))] as string[];
      const missingPrograms = ids.filter((id) => !programCache[id]);
      const missingSugg = ids.filter((id) => !suggestionCache[id]);

      const [programResults, suggResults] = await Promise.all([
        Promise.all(
          missingPrograms.map((id) =>
            fetch(`${API}/programs/${id}`, { headers: { Authorization: `Bearer ${token}` } })
              .then((r) => r.json()).catch(() => null)
          )
        ),
        Promise.all(
          missingSugg.map((id) =>
            fetch(`${API}/progress/overload-suggestions?programId=${id}`, { headers: { Authorization: `Bearer ${token}` } })
              .then((r) => r.json()).catch(() => ({ suggestions: [] }))
          )
        ),
      ]);

      if (missingPrograms.length > 0) {
        const next: Record<string, any> = { ...programCache };
        programResults.forEach((d, i) => { if (d) next[missingPrograms[i]] = d.program ?? d; });
        setProgramCache(next);

      }
      if (missingSugg.length > 0) {
        const next: Record<string, OverloadSuggestion[]> = { ...suggestionCache };
        suggResults.forEach((d, i) => { next[missingSugg[i]] = d.suggestions ?? []; });
        setSuggestionCache(next);
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

  const handleComplete = async (eventId: string, log: object) => {
    setCompleting(eventId);
    try {
      // Save workout log (best effort — don't block completion on failure)
      if (log && Object.keys(log).length > 0) {
        fetch(`${API}/events/${eventId}/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(log),
        }).catch(() => {});
      }

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
                suggestions={event.programId ? (suggestionCache[event.programId] ?? []) : []}
                onComplete={handleComplete}
                completing={completing === event._id}
              />
            ))}
          </div>
        )}

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

// ─── Export ───────────────────────────────────────────────────────────────────

export default function TakvimPage() {
  return (
    <Suspense>
      <TakvimInner />
    </Suspense>
  );
}
