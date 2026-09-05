// src/components/program/ProgramDetailsView.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState, type JSX } from "react";
import type { Program } from "@/types/program";
import { completeSession } from "@/utils/completeSession";
import CalendarHeatmap from "./CalendarHeatmap";

// ---------- small UI bits ----------
const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <div className={`rounded-2xl border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 ${className}`}>{children}</div>
);
const Separator: React.FC = () => <div className="h-px bg-zinc-200 dark:bg-primary/80 my-6" />;

// ---------- helpers ----------
const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/,"");
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const z = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d?: string | Date) => {
  if (!d) return "-";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "-";
  return `${dt.getFullYear()}-${z(dt.getMonth() + 1)}-${z(dt.getDate())} ${z(dt.getHours())}:${z(dt.getMinutes())}`;
};
const norm = (s?: string) => (s ?? "").toString().trim().toLowerCase();

// parse "HH:mm" safely (no regex TDZ surprises after bundling)
const parseHHmm = (hhmm = "18:00") => {
  const [hStr, mStr] = String(hhmm).trim().split(":");
  const hNum = Number(hStr);
  const mNum = Number(mStr);
  if (!Number.isFinite(hNum) || !Number.isFinite(mNum)) return { h: 18, m: 0 };
  const h = Math.min(23, Math.max(0, hNum));
  const m = Math.min(59, Math.max(0, mNum));
  return { h, m };
};

// ---------- schedule types ----------
type DSVideoUrl = { url?: string; description?: string };
type DSExercise = { name?: string; sets?: number; reps?: number; duration?: string; restTime?: number; videoUrls?: DSVideoUrl[] };
type DSSession = { name?: string; completed?: boolean; sessionId?: string; _id?: string; id?: string; timeOfDay?: string; durationMin?: number; exercises?: DSExercise[] };
type DSDay = { day?: string; notes?: string; sessions?: DSSession[] };

// Local mirror of calendar event shape
type CalEvent = {
  _id?: string;
  title?: string;
  start: string;
  end?: string;
  status?: 'planned' | 'completed' | 'missed';
  programId?: string;
  assignmentId?: string;
};

// incoming “completed” shapes you *might* pass from the page
type CompletedRaw =
  | string
  | { sessionId?: string; name?: string; status?: string; completed?: boolean };

type Props = {
  program: Program;
  programId?: string;                  // optional now — will fall back to program._id
  completedSessionIds?: string[] | Set<string>;
  completedSessions?: CompletedRaw[];
};

export default function ProgramDetailsView({ program, programId, completedSessionIds, completedSessions }: Props) {
  // ✅ derive a safe program id automatically
  const pid = useMemo(
    () => String((programId || (program as any)?._id || (program as any)?.id || "")).trim(),
    [programId, program]
  );

  // 1) If the parent didn’t pass completion info, we’ll fetch it ourselves
  const [fetchedCompleted, setFetchedCompleted] = useState<string[]>([]);
  useEffect(() => {
    let aborted = false;
    (async () => {
      if (completedSessionIds || completedSessions) return; // parent controls it
      if (!pid) return; // nothing to fetch yet
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
        const res = await fetch(`${API}/progress/user/${pid}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (aborted || !data) return;
        const ids = arr<any>(data.completedSessions).map((s) => String(s?.sessionId || "").trim()).filter(Boolean);
        setFetchedCompleted(ids);
      } catch {
        // ignore
      }
    })();
    return () => { aborted = true; };
  }, [pid, completedSessionIds, completedSessions]);

  // 2) Build a set of “completed tokens” (ONLY ids, not names)
  const completedTokens = useMemo(() => {
    const tokens = new Set<string>();

    // a) from ids set/array prop
    if (completedSessionIds) {
      const source = completedSessionIds instanceof Set ? Array.from(completedSessionIds) : completedSessionIds;
      source.forEach((v) => { const n = norm(v); if (n) tokens.add(n); });
    }

    // b) from raw objects prop (prefer sessionId; ignore name to avoid cross-week collisions)
    arr<CompletedRaw>(completedSessions).forEach((r) => {
      if (typeof r === "string") {
        // if someone passed a raw string, accept it but it SHOULD be a unique id
        const n = norm(r);
        if (n) tokens.add(n);
      } else if (r && typeof r === "object") {
        const a = norm((r as any).sessionId);
        if (a) tokens.add(a);
      }
    });

    // c) from our own fetch fallback
    fetchedCompleted.forEach((id) => { const n = norm(id); if (n) tokens.add(n); });

    return tokens;
  }, [completedSessionIds, completedSessions, fetchedCompleted]);

  // 3) optimistic local completions (no full reload)
  const [localDone, setLocalDone] = useState<Set<string>>(new Set());
  useEffect(() => setLocalDone(new Set()), [pid]);

  // 4) normalize schedule
  const days = useMemo(() => arr<DSDay>(program.dailySchedule), [program.dailySchedule]);

  // --- anchor date logic: use program.startDate if present; else Monday of current week ---
  const mondayOfThisWeek = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const js = today.getDay();           // 0..6 (Sun..Sat)
    const monIdx = (js + 6) % 7;         // 0 for Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() - monIdx);
    return monday;
  }, []);

  const startDate = useMemo(() => {
    const raw =
      (program as any)?.startDate ||
      (program as any)?.startedAt ||
      (program as any)?.assignmentStartDate ||
      null;

    if (raw) {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        d.setHours(0,0,0,0);
        return d;
      }
    }
    // fallback: align Day 1 to Monday of the current week (keeps labels matching calendar)
    return mondayOfThisWeek;
  }, [program, mondayOfThisWeek]);

  const defaultTimeOfDay = (program as any)?.defaultTimeOfDay || "18:00";
  const defaultDurationMin = Number((program as any)?.defaultDurationMin) || 60;

  // ---- completion helpers (MUST be defined before calEvents to avoid TDZ) ----
  const isDone = (s: DSSession, fallbackKey: string) => {
    if (s?.completed === true) return true; // baked in
    // Only use stable identifiers (no name!)
    const candidates = [s?.sessionId, s?._id, s?.id, fallbackKey].map(norm).filter(Boolean);
    return candidates.some((c) => completedTokens.has(c) || localDone.has(c));
  };

  const markLocal = (s: DSSession, fallbackKey: string) => {
    const next = new Set(localDone);
    [s?.sessionId, s?._id, s?.id, fallbackKey].map(norm).filter(Boolean).forEach((k) => next.add(k!));
    setLocalDone(next);
  };

  // --- calendar synthesis from the local schedule (uses startDate anchor) ---
  const calEvents = useMemo<CalEvent[]>(() => {
    const evs: CalEvent[] = [];
    const now = new Date();
    const { h: defH, m: defM } = parseHHmm(defaultTimeOfDay);

    days.forEach((day, dIdx) => {
      const base = new Date(startDate);
      base.setDate(base.getDate() + dIdx);

      const sessions = arr<DSSession>(day?.sessions);
      sessions.forEach((s, sIdx) => {
        const t = typeof s?.timeOfDay === "string" ? parseHHmm(s.timeOfDay) : { h: defH, m: defM };
        const dur = Number(s?.durationMin) || defaultDurationMin;

        const st = new Date(base);
        st.setHours(t.h, t.m, 0, 0);
        const en = new Date(st);
        en.setMinutes(en.getMinutes() + dur);

        const fallbackKey = `day-${dIdx + 1}-s-${sIdx + 1}`;
        const done = isDone(s, fallbackKey);

        evs.push({
          title: s?.name || `Seans ${sIdx + 1}`,
          start: st.toISOString(),
          end: en.toISOString(),
          status: done ? "completed" : (en < now ? "missed" : "planned"),
          programId: pid,
        });
      });
    });
    return evs;
  }, [days, pid, startDate, defaultTimeOfDay, defaultDurationMin, completedTokens, localDone]);

  // ---- Week logic: derive week count from program.duration or day count ----
  const weekCount = useMemo(() => {
    const durationWeeks = Number((program as any)?.duration);
    if (Number.isFinite(durationWeeks) && durationWeeks > 0) return durationWeeks;
    return Math.max(1, Math.ceil(days.length / 7));
  }, [days.length, program]);

  const [week, setWeek] = useState<number>(1);

  const renderedDays = useMemo(() => {
    const start = (week - 1) * 7;
    return days.slice(start, start + 7);
  }, [days, week]);

  const wkNames = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  const weekChips = (w: number) => {
    const start = (w - 1) * 7;
    const items: JSX.Element[] = [];
    for (let i = 0; i < 7; i++) {
      const di = start + i;
      const has = !!days[di] && arr<DSSession>(days[di]?.sessions).length > 0;
      items.push(
        <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] border ${has ? 'bg-sky-50 border-sky-300 text-sky-700 dark:bg-sky-900/30 dark:border-sky-700' : 'bg-zinc-50 border-zinc-300 text-muted-foreground dark:bg-zinc-900/30 dark:border-primary/50'}`}>{wkNames[i]}</span>
      );
    }
    return <div className="hidden sm:flex gap-1.5">{items}</div>;
  };

  // ---------- Day Cards Carousel ----------
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current; if (!el) return;
    const delta = Math.round(el.clientWidth * 0.85) * dir;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="space-y-8">
      {/* SUMMARY */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{program.name ?? "Program"}</h2>
            {program.description && <p className="text-sm text-muted-foreground dark:text-zinc-300 mt-1">{program.description}</p>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Süre (hafta)" value={String((program as any).duration ?? "—")} />
              <Info label="Zorluk" value={String((program as any).difficulty ?? "—")} />
              <Info label="Hedef" value={String((program as any).fitnessGoal ?? "—")} />
              <Info label="Durum" value={String((program as any).status ?? "—")} />
            </div>
          </div>
          {days.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => scrollBy(-1)} className="px-3 py-1 rounded-lg border">◀</button>
              <button onClick={() => scrollBy(1)} className="px-3 py-1 rounded-lg border">▶</button>
            </div>
          )}
        </div>
      </Card>

      {/* CALENDAR */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Takvim</h3>
        <CalendarHeatmap programId={pid} events={calEvents} />
      </Card>

      <Separator />

      {/* DAILY SCHEDULE */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Günlük Program</h3>
        {weekCount > 1 && (
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {Array.from({ length: weekCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setWeek(i + 1)}
                className={`px-3 py-1.5 rounded-xl border text-sm flex items-center gap-2 ${week === i + 1 ? 'bg-zinc-900 text-white dark:bg-card dark:text-foreground' : 'bg-card dark:bg-zinc-900'}`}
                aria-pressed={week === i + 1}
              >
                <span className="whitespace-nowrap">{i + 1}. Hafta</span>
                {weekChips(i + 1)}
              </button>
            ))}
          </div>
        )}
        {renderedDays.length === 0 ? (
          <p className="text-sm text-muted-foreground">Plan yok.</p>
        ) : (
          <div
            ref={scrollerRef}
            className="relative flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:thin]"
          >
            {renderedDays.map((day, dIdx) => {
              const globalIdx = (week - 1) * 7 + dIdx;
              const dayLabel = day?.day || `Gün ${dIdx + 1}`;
              const sessions = arr<DSSession>(day?.sessions);
              return (
                <Card key={dIdx} className="snap-start shrink-0 w-[86vw] sm:w-[520px] xl:w-[640px] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">{dayLabel}</div>
                    {day?.notes && <div className="text-xs text-muted-foreground">Not: {day.notes}</div>}
                  </div>

                  {sessions.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Seans yok.</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {sessions.map((s, sIdx) => {
                        const fallbackKey = `day-${globalIdx + 1}-s-${sIdx + 1}`;
                        const sid = s.sessionId ?? s._id ?? s.id ?? fallbackKey;
                        const done = isDone(s, fallbackKey);
                        return (
                          <div key={`${fallbackKey}-${sid}`} className={`rounded-xl border p-3 ${tileClass(done)}`}>
                            <div className="text-sm font-medium truncate" title={s?.name || `Seans ${sIdx + 1}`}>
                              {s?.name || `Seans ${sIdx + 1}`}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {tileMeta(arr<DSExercise>(s?.exercises))}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className={done ? "px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700" : "px-2 py-0.5 rounded-full text-[10px] bg-sky-100 text-sky-700"}>
                                {done ? "Tamamlandı" : "Planlandı"}
                              </span>
                              {!done && (
                                <button
                                  onClick={async () => {
                                    try {
                                      markLocal(s, fallbackKey);        // optimistic UI
                                      await completeSession(pid, String(sid)); // send only id
                                    } catch {}
                                  }}
                                  className="text-xs px-2 py-1 rounded-lg border bg-card hover:bg-zinc-50 dark:bg-zinc-900"
                                >
                                  Tamamla
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Separator />

      {/* ANNOUNCEMENTS (kept) */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Duyurular</h3>
        {arr<any>(program.announcements).length === 0 ? (
          <p className="text-sm text-muted-foreground">Duyuru yok.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {arr<any>(program.announcements).map((a, i) => (
              <li key={i} className="rounded border border-border dark:border-zinc-800 p-3 flex items-center justify-between">
                <span className="text-zinc-700 dark:text-zinc-300">{a?.message || "-"}</span>
                <span className="text-xs text-muted-foreground">{fmtDate(a?.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border dark:border-zinc-800 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function tileClass(done: boolean) {
  return done
    ? "border-green-300 bg-green-50 dark:bg-green-900/30 dark:border-green-700"
    : "border-sky-300 bg-sky-50 dark:bg-sky-900/30 dark:border-sky-700";
}

function tileMeta(exs: DSExercise[]) {
  if (!exs || exs.length === 0) return "";
  const first = exs[0];
  const bits: string[] = [];
  if (first.name) bits.push(first.name);
  if (typeof first.sets === "number") bits.push(`${first.sets} set`);
  if (typeof first.reps === "number") bits.push(`${first.reps} tekrar`);
  if (first.duration) bits.push(first.duration);
  return bits.join(" • ");
}
