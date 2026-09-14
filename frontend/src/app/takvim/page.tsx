"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, Dumbbell, Play, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UserPageShell from "@/components/user/UserPageShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const LOCALE_TAG: Record<string, string> = { tr: "tr-TR", en: "en-US", fr: "fr-FR" };

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
  avgRir?: number | null;
  note?: string | null;
}

interface SetEntry {
  done: boolean;
  weight: number | null;
  reps: number | null;
  rir: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ymd: string, localeTag: string) {
  const d = new Date(ymd + "T12:00:00");
  return new Intl.DateTimeFormat(localeTag, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
}

function shiftDay(ymd: string, delta: number) {
  const d = new Date(ymd + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function fmtTime(iso: string, localeTag: string) {
  return new Date(iso).toLocaleTimeString(localeTag, { hour: "2-digit", minute: "2-digit" });
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

function setLabel(ex: Exercise, t: (key: string, vals?: Record<string, any>) => string) {
  if (ex.type === "cardio") return t("cardioMinUnit", { count: ex.cardioMinutes ?? "?" });
  if (ex.type === "isometric") return t("isometricSecUnit", { count: ex.holdSeconds ?? "?" });
  const parts: string[] = [];
  if (ex.reps) parts.push(t("repsUnit", { count: ex.reps }));
  if (ex.weight) parts.push(`${ex.weight} kg`);
  if (ex.restTime) parts.push(t("restUnit", { count: ex.restTime }));
  return parts.length ? parts.join(" · ") : "—";
}

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\s?]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return null;
}

function makeInitialSetData(exercises: Exercise[]): SetEntry[][] {
  return exercises.map((ex) =>
    Array.from({ length: ex.sets ?? 1 }, () => ({
      done: false,
      weight: ex.weight ?? null,
      reps: ex.reps ?? null,
      rir: null,
    }))
  );
}

function buildLog(exercises: Exercise[], setData: SetEntry[][]) {
  return {
    exercises: exercises.map((ex, i) => {
      const count = ex.sets ?? 1;
      const entries = setData[i] ?? [];
      return {
        name: ex.name,
        plannedSets: count,
        plannedReps: ex.reps ?? null,
        plannedWeight: ex.weight ?? null,
        sets: entries.map((s, si) => ({
          setNumber: si + 1,
          reps: s.reps,
          weight: s.weight,
          rir: s.rir,
          completed: s.done,
        })),
      };
    }),
  };
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, end, t }: { status: CalEvent["status"]; end: string; t: (key: string) => string }) {
  if (status === "completed")
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{t("statusCompleted")}</span>;
  if (status === "missed" || (status === "planned" && isPast(end)))
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{t("statusMissed")}</span>;
  if (status === "canceled")
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-muted-foreground dark:bg-primary/90">{t("statusCanceled")}</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">{t("statusPlanned")}</span>;
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
        // playsInline keeps iOS Safari from bouncing to its native fullscreen
        // player on tap, which can stall and look like the video "won't open".
        <video src={url} controls playsInline preload="metadata" className="w-full aspect-video" />
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
  entry,
  canToggle,
  completing,
  onToggleDone,
  onChange,
  t,
}: {
  setIdx: number;
  ex: Exercise;
  entry: SetEntry;
  canToggle: boolean;
  completing: boolean;
  onToggleDone: () => void;
  onChange: (patch: Partial<SetEntry>) => void;
  t: (key: string, vals?: Record<string, any>) => string;
}) {
  const isTimed = ex.type === "cardio" || ex.type === "isometric";

  return (
    <div className="flex items-center gap-2 py-2 pl-8 pr-2 border-t border-dashed border-border/40">
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${canToggle ? "cursor-pointer" : ""} ${
          entry.done ? "bg-primary border-primary" : "border-muted-foreground/40"
        } ${completing ? "opacity-50" : ""}`}
        onClick={canToggle ? onToggleDone : undefined}
      >
        {entry.done && (
          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-xs font-medium shrink-0 text-muted-foreground w-10">{t("setLabel", { n: setIdx + 1 })}</span>

      {isTimed ? (
        <span className={`text-sm flex-1 transition-colors ${entry.done ? "line-through text-muted-foreground" : ""}`}>
          {setLabel(ex, t)}
        </span>
      ) : (
        <div className="flex items-center gap-1.5 flex-1">
          <input
            type="number"
            inputMode="decimal"
            placeholder="kg"
            disabled={!canToggle}
            value={entry.weight ?? ""}
            onChange={(e) => onChange({ weight: e.target.value === "" ? null : Number(e.target.value) })}
            onClick={(e) => e.stopPropagation()}
            className="w-14 h-7 rounded-md border border-border bg-background text-xs text-center tabular-nums disabled:opacity-60"
          />
          <span className="text-[10px] text-muted-foreground shrink-0">kg ×</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder={t("repsPlaceholder")}
            disabled={!canToggle}
            value={entry.reps ?? ""}
            onChange={(e) => onChange({ reps: e.target.value === "" ? null : Number(e.target.value) })}
            onClick={(e) => e.stopPropagation()}
            className="w-14 h-7 rounded-md border border-border bg-background text-xs text-center tabular-nums disabled:opacity-60"
          />
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={5}
            placeholder="RIR"
            disabled={!canToggle}
            value={entry.rir ?? ""}
            onChange={(e) => onChange({ rir: e.target.value === "" ? null : Number(e.target.value) })}
            onClick={(e) => e.stopPropagation()}
            title={t("rirTitle")}
            className="w-12 h-7 rounded-md border border-border bg-background text-xs text-center tabular-nums disabled:opacity-60"
          />
        </div>
      )}
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
  t,
  localeTag,
}: {
  event: CalEvent;
  session: SessionInfo | null;
  suggestions: OverloadSuggestion[];
  onComplete: (id: string, log: object) => void;
  completing: boolean;
  t: (key: string, vals?: Record<string, any>) => string;
  localeTag: string;
}) {
  const canComplete = event.status === "planned";
  const exercises = session?.exercises ?? [];
  const hasExercises = exercises.length > 0;

  // Per-exercise, per-set logged data (weight/reps/rir/done)
  const [setData, setSetData] = useState<SetEntry[][]>(() => makeInitialSetData(exercises));
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
      if (!res.ok) throw new Error(data.message || t("altErrorStatus", { status: res.status }));
      const text = data.alternatives || t("altNoSuggestion");
      setAltResults(prev => ({ ...prev, [exIdx]: text }));
      setOpenAlt(exIdx);
    } catch (err: any) {
      toast.error(t("altToastError", { error: err.message || t("connectionError") }));
    } finally {
      setAltLoading(null);
    }
  };

  useEffect(() => {
    if (event.status === "completed") {
      setSetData(makeInitialSetData(exercises));
      autoTriggered.current = false;
    }
  }, [event.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets ?? 1), 0);
  const doneSets = setData.reduce((acc, entries) => acc + entries.filter((s) => s.done).length, 0);
  const progress = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const updateSet = (exIdx: number, setIdx: number, patch: Partial<SetEntry>) => {
    if (!canComplete || completing) return;
    setSetData((prev) =>
      prev.map((entries, i) => (i !== exIdx ? entries : entries.map((s, si) => (si !== setIdx ? s : { ...s, ...patch }))))
    );
  };

  const toggleSetDone = (exIdx: number, setIdx: number) => {
    if (!canComplete || completing) return;
    const next = setData.map((entries, i) =>
      i !== exIdx ? entries : entries.map((s, si) => (si !== setIdx ? s : { ...s, done: !s.done }))
    );
    setSetData(next);
    const newDone = next.reduce((acc, entries) => acc + entries.filter((s) => s.done).length, 0);
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
              <span>{fmtTime(event.start, localeTag)} – {fmtTime(event.end, localeTag)}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={event.status} end={event.end} t={t} />
      </div>

      {/* Session progress bar */}
      {canComplete && hasExercises && (
        <div className="px-4 pt-4 pb-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium">{t("sessionProgress")}</span>
            <span className="tabular-nums">{t("setsProgress", { done: doneSets, total: totalSets })}</span>
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
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("exercisesHeading")}</p>
          <div>
            {exercises.map((ex, exIdx) => {
              const setCount = ex.sets ?? 1;
              const exDone = setData[exIdx]?.filter((s) => s.done).length ?? 0;
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
                        ? t("setsProgress", { done: exDone, total: setCount })
                        : ex.type === "cardio"
                        ? t("cardioMinUnit", { count: ex.cardioMinutes ?? "?" })
                        : ex.type === "isometric"
                        ? t("isometricSetsUnit", { sets: setCount, sec: ex.holdSeconds ?? "?" })
                        : `${setCount}×${ex.reps ?? "?"}`}
                    </span>

                    {/* Coach video if available → play, otherwise → YouTube "how to do it" */}
                    {hasMedia ? (
                      <button
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                          openMedia === exIdx ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={e => { e.stopPropagation(); setOpenMedia(openMedia === exIdx ? null : exIdx); }}
                        title={t("watchCoachVideo")}
                      >
                        <Play className="w-3.5 h-3.5" fill="currentColor" />
                      </button>
                    ) : (
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' ' + t("howToSearchSuffix"))}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        title={t("howToDoIt")}
                        className="p-1.5 rounded-lg transition-colors shrink-0 hover:bg-muted text-muted-foreground hover:text-red-500"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* AI Alternative button */}
                    <button
                      className={`p-1.5 rounded-lg transition-colors shrink-0 ${openAlt === exIdx ? "bg-violet-100 text-violet-600 dark:bg-violet-950/40" : "hover:bg-muted text-muted-foreground hover:text-violet-500"}`}
                      onClick={e => { e.stopPropagation(); fetchAlternatives(exIdx, ex.name); }}
                      title={t("aiAltSuggest")}
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
                          ? t("suggestWeight", { last: sugg.lastWeight, suggested: sugg.suggestedWeight })
                          : sugg.suggestedReps
                          ? t("suggestReps", { last: sugg.lastReps, suggested: sugg.suggestedReps })
                          : sugg.note ?? null}
                      </span>
                    </div>
                  )}

                  {/* AI Alternatives panel */}
                  {openAlt === exIdx && altResults[exIdx] && (
                    <div className="ml-8 mb-2 mt-1 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <p className="text-[10px] font-semibold text-violet-500 mb-1.5 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t("aiAltHeading")}</p>
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
                          entry={setData[exIdx]?.[si] ?? { done: false, weight: ex.weight ?? null, reps: ex.reps ?? null, rir: null }}
                          canToggle={canComplete && !completing}
                          completing={completing}
                          onToggleDone={() => toggleSetDone(exIdx, si)}
                          onChange={(patch) => updateSet(exIdx, si, patch)}
                          t={t}
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
            {completing ? t("marking") : t("markComplete")}
          </Button>
        </div>
      )}

      {completing && hasExercises && (
        <div className="px-4 pb-4">
          <p className="text-xs text-center text-muted-foreground animate-pulse">{t("completingSession")}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main inner ───────────────────────────────────────────────────────────────

function TakvimInner() {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const localeTag = LOCALE_TAG[locale] || "tr-TR";
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
      toast.error(t("loadEventsError"));
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
      toast.success(t("workoutCompleted"));
    } catch {
      toast.error(t("actionFailed"));
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
            <h1 className="font-bold text-lg leading-tight">{formatDate(date, localeTag)}</h1>
            {isToday && <span className="text-xs text-primary font-medium">{t("today")}</span>}
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
            <p className="font-semibold text-lg">{t("noWorkoutHeading")}</p>
            <p className="text-sm text-muted-foreground">{t("noWorkoutSubtitle")}</p>
            <Button variant="outline" onClick={() => router.push("/dashboard/user")}>
              {t("backToHome")}
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
                t={t}
                localeTag={localeTag}
              />
            ))}
          </div>
        )}

        {!isToday && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/takvim?date=${today}`)}>
              {t("goToToday")}
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
