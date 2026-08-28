"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Copy, Clock } from "lucide-react";
import {
  EXERCISE_LIBRARY,
  PROGRAM_TEMPLATES,
  estimateSessionMinutes,
  type ExerciseType,
} from "./exerciseLibrary";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Exercise {
  name: string;
  type: ExerciseType;
  // Strength
  sets: number;
  reps: number;
  weight: number | null;
  restTime: number;
  // Isometric
  holdSeconds?: number;
  // Cardio
  cardioMinutes?: number;
  cardioKm?: number;
  videoUrls: { url: string; description: string }[];
  /** @deprecated kept for backward compat */
  duration?: string;
}

export interface Session {
  name: string;
  exercises: Exercise[];
  timeOfDay?: string;
  durationMin?: number;
}

export interface DailyEntry {
  day: string;
  sessions: Session[];
  notes: string;
}

interface Props {
  onChange: (
    dailySchedule: DailyEntry[],
    meta?: { durationWeeks: number; defaultTimeOfDay: string; defaultDurationMin: number }
  ) => void;
  initial?: {
    dailySchedule?: DailyEntry[];
    durationWeeks?: number;
    defaultTimeOfDay?: string;
    defaultDurationMin?: number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const TYPE_LABELS: Record<ExerciseType, string> = {
  strength: "Güç",
  cardio: "Kardiyo",
  isometric: "İzometrik",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeBlankExercise(): Exercise {
  return { name: "", type: "strength", sets: 3, reps: 10, weight: null, restTime: 60, videoUrls: [] };
}
function makeEmptyDay(idx: number): DailyEntry {
  return { day: DAY_NAMES[idx % 7], notes: "", sessions: [] };
}
function ensureDaysLength(days: DailyEntry[], weeks: number): DailyEntry[] {
  const target = Math.max(1, weeks) * 7;
  const next = [...days];
  for (let i = 0; i < target; i++) {
    if (!next[i]) next[i] = makeEmptyDay(i);
    else next[i] = { ...next[i], day: DAY_NAMES[i % 7] };
  }
  if (next.length > target) next.length = target;
  return next;
}
function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

// ─── ExerciseName combobox ────────────────────────────────────────────────────

function ExerciseNameInput({
  value,
  onChange,
  onSelectLibrary,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelectLibrary: (entry: (typeof EXERCISE_LIBRARY)[number]) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return EXERCISE_LIBRARY.slice(0, 6);
    return EXERCISE_LIBRARY.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 6);
  }, [value]);

  return (
    <div className="relative flex-1">
      <Input
        placeholder="Egzersiz adı veya ara..."
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { closeTimer.current = setTimeout(() => setOpen(false), 150); }}
        className="h-8 text-sm"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-popover border border-border rounded-md shadow-lg py-1 max-h-44 overflow-y-auto">
          {suggestions.map((ex) => (
            <li key={ex.name}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  clearTimeout(closeTimer.current);
                  onSelectLibrary(ex);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center justify-between"
              >
                <span>{ex.name}</span>
                <span className="text-[10px] text-muted-foreground ml-2">{TYPE_LABELS[ex.type]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── ExerciseRow ─────────────────────────────────────────────────────────────

function ExerciseRow({
  ex,
  onUpdate,
  onDelete,
  onCopy,
}: {
  ex: Exercise;
  onUpdate: (patch: Partial<Exercise>) => void;
  onDelete: () => void;
  onCopy: () => void;
}) {
  const type = ex.type ?? "strength";

  return (
    <div className="space-y-1.5 p-2 rounded-lg bg-muted/40 border border-border">
      {/* Row 1: name + type selector + actions */}
      <div className="flex items-center gap-1.5">
        <ExerciseNameInput
          value={ex.name}
          onChange={(name) => onUpdate({ name })}
          onSelectLibrary={(lib) => onUpdate({
            name: lib.name,
            type: lib.type,
            sets: lib.sets ?? 3,
            reps: lib.reps ?? 10,
            restTime: lib.restTime ?? 60,
            holdSeconds: lib.holdSeconds,
            cardioMinutes: lib.cardioMinutes,
          })}
        />
        <div className="flex shrink-0 rounded-md overflow-hidden border border-border text-[11px]">
          {(["strength", "cardio", "isometric"] as ExerciseType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onUpdate({ type: t })}
              className={`px-2 py-1 transition-colors ${type === t ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
            >
              {t === "strength" ? "💪" : t === "cardio" ? "🏃" : "⏱"}
            </button>
          ))}
        </div>
        <button type="button" onClick={onCopy} className="h-8 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-primary hover:bg-muted transition-colors" title="Egzersizi kopyala">
          <Copy size={13} />
        </button>
        <button type="button" onClick={onDelete} className="h-8 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Egzersizi sil">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Row 2: type-specific fields */}
      {type === "strength" && (
        <div className="grid grid-cols-4 gap-1.5">
          <FieldCell label="Set">
            <Input type="number" min={1} placeholder="3" value={ex.sets || ""} onChange={(e) => onUpdate({ sets: Number(e.target.value) })} className="h-7 text-sm text-center px-1" />
          </FieldCell>
          <FieldCell label="Tekrar">
            <Input type="number" min={1} placeholder="10" value={ex.reps || ""} onChange={(e) => onUpdate({ reps: Number(e.target.value) })} className="h-7 text-sm text-center px-1" />
          </FieldCell>
          <FieldCell label="Ağırlık (kg)">
            <Input type="number" min={0} step={2.5} placeholder="—" value={ex.weight ?? ""} onChange={(e) => onUpdate({ weight: e.target.value === "" ? null : Number(e.target.value) })} className="h-7 text-sm text-center px-1" />
          </FieldCell>
          <FieldCell label="Dinlenme (sn)">
            <Input type="number" min={0} step={5} placeholder="60" value={ex.restTime || ""} onChange={(e) => onUpdate({ restTime: Number(e.target.value) })} className="h-7 text-sm text-center px-1" />
          </FieldCell>
        </div>
      )}
      {type === "isometric" && (
        <div className="grid grid-cols-3 gap-1.5">
          <FieldCell label="Set">
            <Input type="number" min={1} placeholder="3" value={ex.sets || ""} onChange={(e) => onUpdate({ sets: Number(e.target.value) })} className="h-7 text-sm text-center px-1" />
          </FieldCell>
          <FieldCell label="Süre (sn)">
            <Input type="number" min={5} step={5} placeholder="60" value={ex.holdSeconds ?? ""} onChange={(e) => onUpdate({ holdSeconds: Number(e.target.value) })} className="h-7 text-sm text-center px-1" />
          </FieldCell>
          <FieldCell label="Dinlenme (sn)">
            <Input type="number" min={0} step={5} placeholder="30" value={ex.restTime || ""} onChange={(e) => onUpdate({ restTime: Number(e.target.value) })} className="h-7 text-sm text-center px-1" />
          </FieldCell>
        </div>
      )}
      {type === "cardio" && (
        <div className="grid grid-cols-2 gap-1.5">
          <FieldCell label="Süre (dk)">
            <Input type="number" min={1} placeholder="20" value={ex.cardioMinutes ?? ""} onChange={(e) => onUpdate({ cardioMinutes: Number(e.target.value) })} className="h-7 text-sm text-center px-1" />
          </FieldCell>
          <FieldCell label="Mesafe (km) — opsiyonel">
            <Input type="number" min={0} step={0.5} placeholder="—" value={ex.cardioKm ?? ""} onChange={(e) => onUpdate({ cardioKm: e.target.value === "" ? undefined : Number(e.target.value) })} className="h-7 text-sm text-center px-1" />
          </FieldCell>
        </div>
      )}
    </div>
  );
}

function FieldCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-zinc-400">{label}</span>
      {children}
    </div>
  );
}

// ─── Template Picker ──────────────────────────────────────────────────────────

function TemplatePicker({ onApply }: { onApply: (t: (typeof PROGRAM_TEMPLATES)[number]) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-primary underline hover:no-underline"
      >
        📋 Hazır şablonla başla
      </button>
    );
  }

  return (
    <div className="border border-border rounded-xl p-4 bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Bir şablon seç</p>
        <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-sm">✕</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {PROGRAM_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (confirm(`"${t.label}" şablonu mevcut programın üzerine yazacak. Devam et?`)) {
                onApply(t);
                setOpen(false);
              }
            }}
            className="text-left p-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
          >
            <p className="font-semibold text-sm">{t.emoji} {t.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DailyScheduleForm({ onChange, initial }: Props) {
  const [durationWeeks, setDurationWeeks] = useState(initial?.durationWeeks ?? 4);
  const [defaultTimeOfDay, setDefaultTimeOfDay] = useState(initial?.defaultTimeOfDay ?? "18:00");
  const [defaultDurationMin, setDefaultDurationMin] = useState(initial?.defaultDurationMin ?? 60);
  const [schedule, setSchedule] = useState<DailyEntry[]>(
    ensureDaysLength(initial?.dailySchedule ?? [], initial?.durationWeeks ?? 4)
  );
  const [week, setWeek] = useState(1);
  const [weekClipboard, setWeekClipboard] = useState<DailyEntry[] | null>(null);
  const [dayClipboard, setDayClipboard] = useState<DailyEntry | null>(null);

  useEffect(() => {
    setSchedule((prev) => ensureDaysLength(prev, durationWeeks));
  }, [durationWeeks]);

  const weeksCount = Math.max(1, durationWeeks);
  const startIdx = (week - 1) * 7;
  const endIdx = startIdx + 7;
  const weekSlice = useMemo(() => schedule.slice(startIdx, endIdx), [schedule, startIdx, endIdx]);

  const push = (next: DailyEntry[]) => {
    setSchedule(next);
    onChange(next, { durationWeeks, defaultTimeOfDay, defaultDurationMin });
  };

  // ── Session mutations ──
  const addSession = (dIdx: number) => {
    const gi = startIdx + dIdx;
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    day.sessions = [...(day.sessions || []), { name: "", timeOfDay: defaultTimeOfDay, durationMin: defaultDurationMin, exercises: [] }];
    next[gi] = day;
    push(next);
  };

  const updateSessionField = (gi: number, si: number, patch: Partial<Session>) => {
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    day.sessions = (day.sessions || []).map((s, i) => i === si ? { ...s, ...patch } : s);
    next[gi] = day;
    push(next);
  };

  const deleteSession = (gi: number, si: number) => {
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    day.sessions = (day.sessions || []).filter((_, i) => i !== si);
    next[gi] = day;
    push(next);
  };

  // ── Exercise mutations ──
  const addExercise = (gi: number, si: number) => {
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    const sessions = [...(day.sessions || [])];
    sessions[si] = { ...(sessions[si] || { name: "", exercises: [] }), exercises: [...(sessions[si]?.exercises || []), makeBlankExercise()] };
    day.sessions = sessions;
    next[gi] = day;
    push(next);
  };

  const updateExercise = (gi: number, si: number, ei: number, patch: Partial<Exercise>) => {
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    const sessions = [...(day.sessions || [])];
    const exs = [...(sessions[si]?.exercises || [])];
    exs[ei] = { ...exs[ei], ...patch };
    sessions[si] = { ...(sessions[si] || { name: "", exercises: [] }), exercises: exs };
    day.sessions = sessions;
    next[gi] = day;
    push(next);
  };

  const deleteExercise = (gi: number, si: number, ei: number) => {
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    const sessions = [...(day.sessions || [])];
    sessions[si] = { ...(sessions[si] || { name: "", exercises: [] }), exercises: sessions[si].exercises.filter((_, i) => i !== ei) };
    day.sessions = sessions;
    next[gi] = day;
    push(next);
  };

  const copyExercise = (gi: number, si: number, ei: number) => {
    const next = [...schedule];
    const day = { ...(next[gi] || makeEmptyDay(gi)) };
    const sessions = [...(day.sessions || [])];
    const exs = [...(sessions[si]?.exercises || [])];
    exs.splice(ei + 1, 0, clone(exs[ei]));
    sessions[si] = { ...(sessions[si] || { name: "", exercises: [] }), exercises: exs };
    day.sessions = sessions;
    next[gi] = day;
    push(next);
  };

  // ── Week copy/paste ──
  const copyWeek = (w: number) => {
    const base = (w - 1) * 7;
    setWeekClipboard(schedule.slice(base, base + 7).map(clone));
  };
  const pasteWeek = (w: number) => {
    if (!weekClipboard) return;
    const base = (w - 1) * 7;
    const next = [...schedule];
    for (let i = 0; i < 7; i++) {
      const inc = clone(weekClipboard[i] || makeEmptyDay(base + i));
      inc.day = DAY_NAMES[(base + i) % 7];
      next[base + i] = inc;
    }
    push(next);
  };
  const duplicateWeek = (w: number) => {
    const base = (w - 1) * 7;
    const src = schedule.slice(base, base + 7).map(clone);
    const next = [...schedule, ...src.map((d, i) => ({ ...d, day: DAY_NAMES[(schedule.length + i) % 7] }))];
    const needed = Math.ceil(next.length / 7);
    setDurationWeeks((p) => Math.max(p, needed));
    push(ensureDaysLength(next, Math.max(durationWeeks, needed)));
    setWeek(Math.min(needed, weeksCount + 1));
  };

  // ── Day copy/paste ──
  const copyDay = (gi: number) => setDayClipboard(clone(schedule[gi] || makeEmptyDay(gi)));
  const pasteDay = (gi: number) => {
    if (!dayClipboard) return;
    const next = [...schedule];
    const inc = clone(dayClipboard);
    inc.day = DAY_NAMES[gi % 7];
    next[gi] = inc;
    push(next);
  };
  const duplicateDay = (gi: number) => {
    const next = [...schedule];
    next.splice(gi + 1, 0, clone(next[gi] || makeEmptyDay(gi)));
    const needed = Math.ceil(next.length / 7);
    setDurationWeeks((p) => Math.max(p, needed));
    push(ensureDaysLength(next, Math.max(durationWeeks, needed)));
  };

  // ── Template ──
  const applyTemplate = (t: (typeof PROGRAM_TEMPLATES)[number]) => {
    const week1 = t.week1.map((d, i) => ({ ...d, day: DAY_NAMES[i % 7] }));
    const newSchedule = ensureDaysLength(week1, t.weeks);
    setDurationWeeks(t.weeks);
    setSchedule(newSchedule);
    onChange(newSchedule, { durationWeeks: t.weeks, defaultTimeOfDay, defaultDurationMin });
    setWeek(1);
  };

  return (
    <div className="space-y-4">
      <TemplatePicker onApply={applyTemplate} />

      {/* Meta */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">Süre (hafta)</span>
          <Input type="number" min={1} value={durationWeeks} onChange={(e) => setDurationWeeks(Math.max(1, Number(e.target.value || 1)))} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">Varsayılan Saat</span>
          <Input value={defaultTimeOfDay} onChange={(e) => setDefaultTimeOfDay(e.target.value)} placeholder="18:00" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">Varsayılan Süre (dk)</span>
          <Input type="number" min={5} step={5} value={defaultDurationMin} onChange={(e) => setDefaultDurationMin(Math.max(5, Number(e.target.value || 60)))} />
        </div>
      </div>

      {/* Week tabs */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: weeksCount }).map((_, i) => (
          <Button key={i} variant={week === i + 1 ? "default" : "secondary"} size="sm" onClick={() => setWeek(i + 1)}>
            {i + 1}. Hafta
          </Button>
        ))}
      </div>

      {/* Week actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => copyWeek(week)}>Haftayı Kopyala</Button>
        <Button variant="secondary" size="sm" onClick={() => pasteWeek(week)} disabled={!weekClipboard}>Yapıştır</Button>
        <Button variant="secondary" size="sm" onClick={() => duplicateWeek(week)}>Haftayı Sona Ekle</Button>
      </div>

      {/* Schedule */}
      <ScrollArea className="h-[560px] pr-2">
        {weekSlice.map((day, dIdx) => {
          const gi = startIdx + dIdx;
          return (
            <div key={`${gi}`} className="mb-5 border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">{day.day} <span className="text-xs text-zinc-400 font-normal">Gün {gi + 1}</span></h3>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => copyDay(gi)}>Kopyala</Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => pasteDay(gi)} disabled={!dayClipboard}>Yapıştır</Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => duplicateDay(gi)}>Çoğalt</Button>
                </div>
              </div>

              {day.sessions.map((session, si) => {
                const est = estimateSessionMinutes(session.exercises);
                return (
                  <div key={`s-${gi}-${si}`} className="mb-3 p-3 border rounded-lg bg-background">
                    {/* Session header */}
                    <div className="flex items-center gap-2 mb-3">
                      <Input
                        placeholder="Oturum adı (ör. Sabah Antrenmanı)"
                        value={session.name}
                        onChange={(e) => updateSessionField(gi, si, { name: e.target.value })}
                        className="flex-1 h-8 text-sm font-medium"
                      />
                      <Input
                        placeholder="18:00"
                        value={session.timeOfDay ?? defaultTimeOfDay}
                        onChange={(e) => updateSessionField(gi, si, { timeOfDay: e.target.value })}
                        className="w-20 h-8 text-sm text-center"
                      />
                      {est > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          <Clock size={12} />~{est} dk
                        </span>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0" onClick={() => deleteSession(gi, si)}>
                        Sil
                      </Button>
                    </div>

                    {/* Exercises */}
                    <div className="space-y-2">
                      {session.exercises.map((ex, ei) => (
                        <ExerciseRow
                          key={`ex-${gi}-${si}-${ei}`}
                          ex={ex}
                          onUpdate={(patch) => updateExercise(gi, si, ei, patch)}
                          onDelete={() => deleteExercise(gi, si, ei)}
                          onCopy={() => copyExercise(gi, si, ei)}
                        />
                      ))}
                    </div>

                    <Button size="sm" variant="secondary" className="mt-2 h-7 text-xs" onClick={() => addExercise(gi, si)}>
                      + Egzersiz Ekle
                    </Button>
                  </div>
                );
              })}

              <Textarea
                placeholder="Günlük not (opsiyonel)..."
                value={day.notes}
                onChange={(e) => {
                  const next = [...schedule];
                  next[gi] = { ...(next[gi] || makeEmptyDay(gi)), notes: e.target.value };
                  push(next);
                }}
                className="mb-2 text-sm"
                rows={2}
              />

              <Button size="sm" onClick={() => addSession(dIdx)} className="h-7 text-xs">
                + Oturum Ekle
              </Button>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}
