"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
  restTime: number;
  videoUrls: { url: string; description: string }[];
  /** @deprecated kept for backward compat with old saved programs */
  duration?: string;
}

export interface Session {
  name: string;
  exercises: Exercise[];
  /** NEW (optional) */
  timeOfDay?: string;     // "HH:mm"
  /** NEW (optional) */
  durationMin?: number;   // minutes
}

export interface DailyEntry {
  day: string;            // label only (Pazartesi, ...), repeats weekly
  sessions: Session[];
  notes: string;
}

interface Props {
  /** onChange still works with only the first param; meta is optional */
  onChange: (
    dailySchedule: DailyEntry[],
    meta?: { durationWeeks: number; defaultTimeOfDay: string; defaultDurationMin: number }
  ) => void;
  /** Optional initial values if you want to hydrate from existing data */
  initial?: {
    dailySchedule?: DailyEntry[];
    durationWeeks?: number;
    defaultTimeOfDay?: string;
    defaultDurationMin?: number;
  };
}

const dayNamesTR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

// ---------- helpers ----------
const pad = (n: number) => String(n).padStart(2, "0");
const parseHHmm = (hhmm = "18:00") => {
  const [hStr, mStr] = String(hhmm).trim().split(":");
  const h = Math.min(23, Math.max(0, Number(hStr)));
  const m = Math.min(59, Math.max(0, Number(mStr)));
  return { h: Number.isFinite(h) ? h : 18, m: Number.isFinite(m) ? m : 0 };
};

function makeEmptyDay(idx: number): DailyEntry {
  return { day: dayNamesTR[idx % 7], notes: "", sessions: [] };
}

function ensureDaysLength(days: DailyEntry[], weeks: number): DailyEntry[] {
  const target = Math.max(1, weeks) * 7;
  const next = [...days];
  // relabel days and grow as needed
  for (let i = 0; i < target; i++) {
    if (!next[i]) next[i] = makeEmptyDay(i);
    else next[i] = { ...next[i], day: dayNamesTR[i % 7] };
  }
  if (next.length > target) next.length = target;
  return next;
}

function cloneDay(d: DailyEntry): DailyEntry {
  return JSON.parse(JSON.stringify(d)) as DailyEntry;
}

export default function DailyScheduleForm({ onChange, initial }: Props) {
  // meta
  const [durationWeeks, setDurationWeeks] = useState<number>(initial?.durationWeeks ?? 4);
  const [defaultTimeOfDay, setDefaultTimeOfDay] = useState<string>(initial?.defaultTimeOfDay ?? "18:00");
  const [defaultDurationMin, setDefaultDurationMin] = useState<number>(initial?.defaultDurationMin ?? 60);

  // schedule
  const [schedule, setSchedule] = useState<DailyEntry[]>(
    ensureDaysLength(initial?.dailySchedule ?? [], durationWeeks)
  );

  // keep length in sync with weeks
  useEffect(() => {
    setSchedule((prev) => ensureDaysLength(prev, durationWeeks));
  }, [durationWeeks]);

  const updateSchedule = (newSchedule: DailyEntry[]) => {
    setSchedule(newSchedule);
    onChange(newSchedule, { durationWeeks, defaultTimeOfDay, defaultDurationMin });
  };

  // ------- Week UI state -------
  const [week, setWeek] = useState(1);
  const weeksCount = Math.max(1, durationWeeks);
  const startIdx = (week - 1) * 7;
  const endIdx = startIdx + 7;
  const weekSlice = useMemo(() => schedule.slice(startIdx, endIdx), [schedule, startIdx, endIdx]);

  // ------- Day / Session actions -------
  const addSession = (dayIndexInWeek: number) => {
    const gi = startIdx + dayIndexInWeek;
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    day.sessions = [
      ...(day.sessions || []),
      { name: "", timeOfDay: defaultTimeOfDay, durationMin: defaultDurationMin, exercises: [] },
    ];
    next[gi] = day;
    updateSchedule(next);
  };

  const updateSessionField = (
    gi: number,
    si: number,
    patch: Partial<Session>
  ) => {
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    day.sessions = (day.sessions || []).map((s, i) => (i === si ? { ...s, ...patch } : s));
    next[gi] = day;
    updateSchedule(next);
  };

  const deleteSession = (gi: number, si: number) => {
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    day.sessions = (day.sessions || []).filter((_, i) => i !== si);
    next[gi] = day;
    updateSchedule(next);
  };

  const addExercise = (gi: number, si: number) => {
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    const sessions = [...(day.sessions || [])];
    const exs = [...(sessions[si]?.exercises || [])];
    exs.push({
      name: "",
      sets: 3,
      reps: 10,
      weight: null,
      restTime: 60,
      videoUrls: [],
    });
    sessions[si] = { ...(sessions[si] || { name: "", exercises: [] }), exercises: exs };
    day.sessions = sessions;
    next[gi] = day;
    updateSchedule(next);
  };

  const updateExerciseField = <K extends keyof Exercise>(
    gi: number, si: number, ei: number, field: K, value: Exercise[K]
  ) => {
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    const sessions = [...(day.sessions || [])];
    const exs = [...(sessions[si]?.exercises || [])];
    exs[ei] = { ...exs[ei], [field]: value };
    sessions[si] = { ...(sessions[si] || { name: "", exercises: [] }), exercises: exs };
    day.sessions = sessions;
    next[gi] = day;
    updateSchedule(next);
  };

  const deleteExercise = (gi: number, si: number, ei: number) => {
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    const sessions = [...(day.sessions || [])];
    const exs = [...(sessions[si]?.exercises || [])].filter((_, i) => i !== ei);
    sessions[si] = { ...(sessions[si] || { name: "", exercises: [] }), exercises: exs };
    day.sessions = sessions;
    next[gi] = day;
    updateSchedule(next);
  };

  // ------- Kolaylaştırıcılar: copy/paste/duplicate -------
  const [weekClipboard, setWeekClipboard] = useState<DailyEntry[] | null>(null);
  const [dayClipboard, setDayClipboard] = useState<DailyEntry | null>(null);

  const copyWeek = (w: number) => {
    const base = (w - 1) * 7;
    setWeekClipboard(schedule.slice(base, base + 7).map(cloneDay));
  };
  const pasteWeekReplace = (w: number) => {
    if (!weekClipboard) return;
    const base = (w - 1) * 7;
    const next = [...schedule];
    for (let i = 0; i < 7; i++) {
      const incoming = cloneDay(weekClipboard[i] || makeEmptyDay(base + i));
      // keep label consistent
      incoming.day = dayNamesTR[(base + i) % 7];
      // ensure session defaults if missing
      incoming.sessions = (incoming.sessions || []).map((s) => ({
        timeOfDay: s.timeOfDay ?? defaultTimeOfDay,
        durationMin: s.durationMin ?? defaultDurationMin,
        name: s.name ?? "",
        exercises: s.exercises ?? [],
      }));
      next[base + i] = incoming;
    }
    updateSchedule(next);
  };
  const duplicateWeekAppend = (w: number) => {
    const base = (w - 1) * 7;
    const src = schedule.slice(base, base + 7).map(cloneDay);
    // append and relabel
    const appended = src.map((d, i) => ({
      ...d,
      day: dayNamesTR[(schedule.length + i) % 7],
      sessions: (d.sessions || []).map((s) => ({
        name: s.name ?? "",
        timeOfDay: s.timeOfDay ?? defaultTimeOfDay,
        durationMin: s.durationMin ?? defaultDurationMin,
        exercises: s.exercises ?? [],
      })),
    }));
    const next = [...schedule, ...appended];
    // bump weeks if needed
    const neededWeeks = Math.ceil(next.length / 7);
    setDurationWeeks((prev) => Math.max(prev, neededWeeks));
    updateSchedule(ensureDaysLength(next, Math.max(durationWeeks, neededWeeks)));
    setWeek(Math.min(neededWeeks, weeksCount + 1));
  };

  const copyDay = (gi: number) => setDayClipboard(cloneDay(schedule[gi] || makeEmptyDay(gi)));
  const pasteDayReplace = (gi: number) => {
    if (!dayClipboard) return;
    const next = [...schedule];
    const incoming = cloneDay(dayClipboard);
    incoming.day = dayNamesTR[gi % 7]; // keep label
    incoming.sessions = (incoming.sessions || []).map((s) => ({
      name: s.name ?? "",
      timeOfDay: s.timeOfDay ?? defaultTimeOfDay,
      durationMin: s.durationMin ?? defaultDurationMin,
      exercises: s.exercises ?? [],
    }));
    next[gi] = incoming;
    updateSchedule(next);
  };
  const duplicateDayInsertAfter = (gi: number) => {
    const next = [...schedule];
    const copy = cloneDay(next[gi] || makeEmptyDay(gi));
    next.splice(gi + 1, 0, copy);
    // bump weeks if length overflow
    const neededWeeks = Math.ceil(next.length / 7);
    setDurationWeeks((prev) => Math.max(prev, neededWeeks));
    updateSchedule(ensureDaysLength(next, Math.max(durationWeeks, neededWeeks)));
  };

  const bulkSetTimesThisWeek = (time: string) => {
    const next = [...schedule];
    for (let gi = startIdx; gi < endIdx; gi++) {
      const day = { ...(next[gi] || makeEmptyDay(gi)) };
      day.sessions = (day.sessions || []).map((s) => ({
        ...s,
        timeOfDay: time,
        durationMin: s.durationMin ?? defaultDurationMin,
      }));
      next[gi] = day;
    }
    setDefaultTimeOfDay(time);
    updateSchedule(next);
  };

  return (
    <div className="space-y-4">
      {/* Meta controls */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">Süre (hafta)</span>
          <Input
            type="number"
            min={1}
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(Math.max(1, Number(e.target.value || 1)))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">Varsayılan Saat (HH:mm)</span>
          <Input
            value={defaultTimeOfDay}
            onChange={(e) => setDefaultTimeOfDay(e.target.value)}
            placeholder="18:00"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">Varsayılan Süre (dk)</span>
          <Input
            type="number"
            min={5}
            step={5}
            value={defaultDurationMin}
            onChange={(e) => setDefaultDurationMin(Math.max(5, Number(e.target.value || 60)))}
          />
        </div>

        {/* Week selector + actions */}
        <div className="flex items-end gap-2">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: weeksCount }).map((_, i) => (
              <Button
                key={i}
                variant={week === i + 1 ? "default" : "secondary"}
                onClick={() => setWeek(i + 1)}
              >
                {i + 1}. Hafta
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => copyWeek(week)}>Haftayı Kopyala</Button>
        <Button variant="secondary" onClick={() => pasteWeekReplace(week)} disabled={!weekClipboard}>Haftayı Yapıştır</Button>
        <Button variant="secondary" onClick={() => duplicateWeekAppend(week)}>Haftayı Sona Kopyala</Button>
        <Button variant="secondary" onClick={() => bulkSetTimesThisWeek(defaultTimeOfDay)}>
          Bu Haftada Saatleri Varsayılan Yap ({defaultTimeOfDay})
        </Button>
      </div>

      {/* Schedule editor */}
      <ScrollArea className="h-[520px] pr-2">
        {weekSlice.map((day, dIdx) => {
          const gi = startIdx + dIdx;
          return (
            <div key={`${day.day}-${gi}`} className="mb-6 border p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">{day.day} <span className="text-xs text-zinc-500">(Gün {gi + 1})</span></h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => copyDay(gi)}>Günü Kopyala</Button>
                  <Button size="sm" variant="secondary" onClick={() => pasteDayReplace(gi)} disabled={!dayClipboard}>Yapıştır</Button>
                  <Button size="sm" variant="secondary" onClick={() => duplicateDayInsertAfter(gi)}>Günü Çoğalt</Button>
                </div>
              </div>

              {day.sessions.map((session, sessionIndex) => (
                <div key={`s-${gi}-${sessionIndex}`} className="mb-4 p-3 border rounded">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      placeholder="Oturum Adı"
                      value={session.name}
                      onChange={(e) => updateSessionField(gi, sessionIndex, { name: e.target.value })}
                    />
                    <Input
                      placeholder="Saat (HH:mm)"
                      value={session.timeOfDay ?? defaultTimeOfDay}
                      onChange={(e) => updateSessionField(gi, sessionIndex, { timeOfDay: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Süre (dk)"
                      value={session.durationMin ?? defaultDurationMin}
                      onChange={(e) => updateSessionField(gi, sessionIndex, { durationMin: Math.max(5, Number(e.target.value || defaultDurationMin)) })}
                    />
                  </div>

                  {session.exercises.length > 0 && (
                    <div className="mt-3 mb-2 grid grid-cols-[1fr_60px_60px_70px_70px_36px] gap-1.5 px-1">
                      <span className="text-[11px] text-zinc-400 font-medium">Egzersiz</span>
                      <span className="text-[11px] text-zinc-400 font-medium text-center">Set</span>
                      <span className="text-[11px] text-zinc-400 font-medium text-center">Tekrar</span>
                      <span className="text-[11px] text-zinc-400 font-medium text-center">Ağırlık</span>
                      <span className="text-[11px] text-zinc-400 font-medium text-center">Dinlenme</span>
                      <span />
                    </div>
                  )}
                  {session.exercises.map((exercise, exerciseIndex) => (
                    <div key={`ex-${gi}-${sessionIndex}-${exerciseIndex}`} className="grid grid-cols-[1fr_60px_60px_70px_70px_36px] gap-1.5 mt-1.5 items-center">
                      <Input
                        placeholder="Egzersiz adı"
                        value={exercise.name}
                        onChange={(e) => updateExerciseField(gi, sessionIndex, exerciseIndex, "name", e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        type="number"
                        min={1}
                        placeholder="3"
                        value={exercise.sets || ""}
                        onChange={(e) => updateExerciseField(gi, sessionIndex, exerciseIndex, "sets", Number(e.target.value))}
                        className="h-8 text-sm text-center px-1"
                      />
                      <Input
                        type="number"
                        min={1}
                        placeholder="10"
                        value={exercise.reps || ""}
                        onChange={(e) => updateExerciseField(gi, sessionIndex, exerciseIndex, "reps", Number(e.target.value))}
                        className="h-8 text-sm text-center px-1"
                      />
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          step={2.5}
                          placeholder="—"
                          value={exercise.weight ?? ""}
                          onChange={(e) => updateExerciseField(gi, sessionIndex, exerciseIndex, "weight", e.target.value === "" ? null : Number(e.target.value))}
                          className="h-8 text-sm text-center pr-6 pl-1"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">kg</span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          step={5}
                          placeholder="60"
                          value={exercise.restTime || ""}
                          onChange={(e) => updateExerciseField(gi, sessionIndex, exerciseIndex, "restTime", Number(e.target.value))}
                          className="h-8 text-sm text-center pr-5 pl-1"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">sn</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteExercise(gi, sessionIndex, exerciseIndex)}
                        className="h-8 w-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Egzersizi sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <div className="mt-3 flex items-center justify-between">
                    <Button size="sm" variant="secondary" onClick={() => addExercise(gi, sessionIndex)}>
                      + Egzersiz Ekle
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => deleteSession(gi, sessionIndex)}>
                      Oturumu Sil
                    </Button>
                  </div>
                </div>
              ))}

              <Textarea
                placeholder="Günlük not..."
                value={day.notes}
                onChange={(e) => {
                  const next = [...schedule];
                  next[gi] = { ...(next[gi] || makeEmptyDay(gi)), notes: e.target.value };
                  updateSchedule(next);
                }}
                className="mb-2"
              />

              <Button size="sm" onClick={() => addSession(dIdx)}>
                + Oturum Ekle
              </Button>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}
