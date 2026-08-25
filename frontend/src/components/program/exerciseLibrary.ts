export type ExerciseType = "strength" | "cardio" | "isometric";

export interface LibraryExercise {
  name: string;
  type: ExerciseType;
  sets?: number;
  reps?: number;
  restTime?: number;
  holdSeconds?: number;
  cardioMinutes?: number;
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Bacak
  { name: "Squat", type: "strength", sets: 4, reps: 8, restTime: 90 },
  { name: "Leg Press", type: "strength", sets: 4, reps: 10, restTime: 90 },
  { name: "Romanian Deadlift", type: "strength", sets: 4, reps: 10, restTime: 90 },
  { name: "Lunges", type: "strength", sets: 3, reps: 12, restTime: 60 },
  { name: "Bulgarian Split Squat", type: "strength", sets: 3, reps: 10, restTime: 90 },
  { name: "Leg Extension", type: "strength", sets: 3, reps: 12, restTime: 60 },
  { name: "Leg Curl", type: "strength", sets: 3, reps: 12, restTime: 60 },
  { name: "Calf Raise", type: "strength", sets: 4, reps: 15, restTime: 45 },
  { name: "Box Jump", type: "strength", sets: 4, reps: 8, restTime: 60 },
  // İtiş (Push)
  { name: "Bench Press", type: "strength", sets: 4, reps: 8, restTime: 90 },
  { name: "Incline Bench Press", type: "strength", sets: 3, reps: 10, restTime: 90 },
  { name: "Overhead Press", type: "strength", sets: 4, reps: 8, restTime: 90 },
  { name: "Dumbbell Fly", type: "strength", sets: 3, reps: 12, restTime: 60 },
  { name: "Tricep Pushdown", type: "strength", sets: 3, reps: 12, restTime: 60 },
  { name: "Skull Crusher", type: "strength", sets: 3, reps: 10, restTime: 60 },
  { name: "Dips", type: "strength", sets: 3, reps: 10, restTime: 60 },
  { name: "Push-Up", type: "strength", sets: 3, reps: 15, restTime: 45 },
  // Çekiş (Pull)
  { name: "Deadlift", type: "strength", sets: 4, reps: 5, restTime: 120 },
  { name: "Pull-Up", type: "strength", sets: 4, reps: 8, restTime: 90 },
  { name: "Lat Pulldown", type: "strength", sets: 4, reps: 10, restTime: 75 },
  { name: "Barbell Row", type: "strength", sets: 4, reps: 8, restTime: 90 },
  { name: "Seated Cable Row", type: "strength", sets: 3, reps: 12, restTime: 60 },
  { name: "Face Pull", type: "strength", sets: 3, reps: 15, restTime: 45 },
  { name: "Bicep Curl", type: "strength", sets: 3, reps: 12, restTime: 60 },
  { name: "Hammer Curl", type: "strength", sets: 3, reps: 12, restTime: 60 },
  // Core
  { name: "Crunch", type: "strength", sets: 3, reps: 20, restTime: 30 },
  { name: "Russian Twist", type: "strength", sets: 3, reps: 20, restTime: 30 },
  { name: "Leg Raise", type: "strength", sets: 3, reps: 15, restTime: 30 },
  { name: "Plank", type: "isometric", sets: 3, holdSeconds: 60, restTime: 45 },
  { name: "Side Plank", type: "isometric", sets: 3, holdSeconds: 30, restTime: 30 },
  { name: "Dead Bug", type: "isometric", sets: 3, holdSeconds: 30, restTime: 30 },
  // Fonksiyonel / HIIT
  { name: "Burpee", type: "strength", sets: 4, reps: 10, restTime: 60 },
  { name: "Mountain Climber", type: "strength", sets: 3, reps: 20, restTime: 45 },
  { name: "Kettlebell Swing", type: "strength", sets: 4, reps: 15, restTime: 60 },
  { name: "Battle Rope", type: "cardio", cardioMinutes: 5 },
  { name: "Jump Rope", type: "cardio", cardioMinutes: 10 },
  // Kardiyo
  { name: "Koşu Bandı", type: "cardio", cardioMinutes: 20 },
  { name: "Bisiklet", type: "cardio", cardioMinutes: 20 },
  { name: "Eliptik Bisiklet", type: "cardio", cardioMinutes: 20 },
  { name: "Kürek Makinesi", type: "cardio", cardioMinutes: 15 },
  { name: "Yürüyüş", type: "cardio", cardioMinutes: 30 },
];

// ─── Auto-duration estimate ────────────────────────────────────────────────────

export function estimateSessionMinutes(exercises: { type?: ExerciseType; sets?: number; reps?: number; restTime?: number; holdSeconds?: number; cardioMinutes?: number }[]): number {
  if (!exercises.length) return 0;
  let total = 10; // warmup/cooldown
  for (const ex of exercises) {
    if (ex.type === "cardio") {
      total += ex.cardioMinutes ?? 15;
    } else if (ex.type === "isometric") {
      const sets = ex.sets ?? 3;
      const holdSec = ex.holdSeconds ?? 30;
      const rest = ex.restTime ?? 30;
      total += Math.ceil((sets * holdSec + (sets - 1) * rest) / 60);
    } else {
      const sets = ex.sets ?? 3;
      const rest = ex.restTime ?? 60;
      // ~40s per set for strength
      total += Math.ceil((sets * 40 + (sets - 1) * rest) / 60);
    }
  }
  return total;
}

// ─── Program Templates ────────────────────────────────────────────────────────

import type { DailyEntry, Exercise } from "./DailyScheduleForm";

function s(name: string, exercises: Partial<Exercise>[], sessionName = "Antrenman"): import("./DailyScheduleForm").Session {
  return {
    name: sessionName,
    timeOfDay: "18:00",
    durationMin: 60,
    exercises: exercises.map((e) => ({
      name: e.name ?? "",
      type: (e as any).type ?? "strength",
      sets: e.sets ?? 3,
      reps: e.reps ?? 10,
      weight: null,
      restTime: e.restTime ?? 60,
      holdSeconds: (e as any).holdSeconds,
      cardioMinutes: (e as any).cardioMinutes,
      videoUrls: [],
    })) as Exercise[],
  };
}

function rest(): DailyEntry { return { day: "", notes: "", sessions: [] }; }

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
function label(entries: DailyEntry[]): DailyEntry[] {
  return entries.map((e, i) => ({ ...e, day: DAY_NAMES[i % 7] }));
}

export interface ProgramTemplate {
  id: string;
  label: string;
  emoji: string;
  description: string;
  weeks: number;
  week1: DailyEntry[];
}

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: "fat_loss_beginner",
    label: "Kilo Verme — Başlangıç",
    emoji: "🔥",
    description: "Haftada 3 gün tam vücut + kardiyo. 4 hafta.",
    weeks: 4,
    week1: label([
      { day: "", notes: "", sessions: [s("Tam Vücut A", [
        { name: "Squat", sets: 3, reps: 12, restTime: 60 },
        { name: "Push-Up", sets: 3, reps: 12, restTime: 45 },
        { name: "Lat Pulldown", sets: 3, reps: 12, restTime: 60 },
        { name: "Plank", ...{ type: "isometric", holdSeconds: 45, restTime: 30 } } as any,
      ], "Tam Vücut A")] },
      rest(),
      { day: "", notes: "", sessions: [s("Kardiyo + Core", [
        { name: "Koşu Bandı", ...{ type: "cardio", cardioMinutes: 20 } } as any,
        { name: "Crunch", sets: 3, reps: 20, restTime: 30 },
        { name: "Leg Raise", sets: 3, reps: 15, restTime: 30 },
        { name: "Russian Twist", sets: 3, reps: 20, restTime: 30 },
      ], "Kardiyo + Core")] },
      rest(),
      { day: "", notes: "", sessions: [s("Tam Vücut B", [
        { name: "Romanian Deadlift", sets: 3, reps: 10, restTime: 75 },
        { name: "Dumbbell Fly", sets: 3, reps: 12, restTime: 60 },
        { name: "Barbell Row", sets: 3, reps: 10, restTime: 75 },
        { name: "Lunges", sets: 3, reps: 12, restTime: 60 },
      ], "Tam Vücut B")] },
      rest(),
      rest(),
    ]),
  },
  {
    id: "muscle_gain",
    label: "Kas Kazanımı — Üst/Alt",
    emoji: "💪",
    description: "Haftada 4 gün üst/alt bölünmüş program. 8 hafta.",
    weeks: 8,
    week1: label([
      { day: "", notes: "", sessions: [s("Üst Vücut A", [
        { name: "Bench Press", sets: 4, reps: 8, restTime: 90 },
        { name: "Barbell Row", sets: 4, reps: 8, restTime: 90 },
        { name: "Overhead Press", sets: 3, reps: 10, restTime: 75 },
        { name: "Bicep Curl", sets: 3, reps: 12, restTime: 60 },
        { name: "Tricep Pushdown", sets: 3, reps: 12, restTime: 60 },
      ], "Üst Vücut A")] },
      { day: "", notes: "", sessions: [s("Alt Vücut A", [
        { name: "Squat", sets: 4, reps: 8, restTime: 90 },
        { name: "Romanian Deadlift", sets: 4, reps: 10, restTime: 90 },
        { name: "Leg Press", sets: 3, reps: 12, restTime: 75 },
        { name: "Leg Curl", sets: 3, reps: 12, restTime: 60 },
        { name: "Calf Raise", sets: 4, reps: 15, restTime: 45 },
      ], "Alt Vücut A")] },
      rest(),
      { day: "", notes: "", sessions: [s("Üst Vücut B", [
        { name: "Incline Bench Press", sets: 4, reps: 8, restTime: 90 },
        { name: "Pull-Up", sets: 4, reps: 8, restTime: 90 },
        { name: "Dumbbell Fly", sets: 3, reps: 12, restTime: 60 },
        { name: "Face Pull", sets: 3, reps: 15, restTime: 45 },
        { name: "Hammer Curl", sets: 3, reps: 12, restTime: 60 },
      ], "Üst Vücut B")] },
      { day: "", notes: "", sessions: [s("Alt Vücut B", [
        { name: "Deadlift", sets: 4, reps: 5, restTime: 120 },
        { name: "Bulgarian Split Squat", sets: 3, reps: 10, restTime: 90 },
        { name: "Leg Extension", sets: 3, reps: 12, restTime: 60 },
        { name: "Plank", ...{ type: "isometric", holdSeconds: 60, restTime: 45 } } as any,
      ], "Alt Vücut B")] },
      rest(),
      rest(),
    ]),
  },
  {
    id: "full_body_fitness",
    label: "Tam Vücut Kondisyon",
    emoji: "⚡",
    description: "Haftada 3 gün bileşik hareketler + core. 6 hafta.",
    weeks: 6,
    week1: label([
      { day: "", notes: "", sessions: [s("Gün A", [
        { name: "Squat", sets: 3, reps: 10, restTime: 75 },
        { name: "Bench Press", sets: 3, reps: 10, restTime: 75 },
        { name: "Barbell Row", sets: 3, reps: 10, restTime: 75 },
        { name: "Overhead Press", sets: 3, reps: 10, restTime: 60 },
        { name: "Plank", ...{ type: "isometric", holdSeconds: 60, restTime: 30 } } as any,
      ], "Gün A")] },
      rest(),
      { day: "", notes: "", sessions: [s("Gün B", [
        { name: "Deadlift", sets: 3, reps: 6, restTime: 120 },
        { name: "Pull-Up", sets: 3, reps: 8, restTime: 90 },
        { name: "Dips", sets: 3, reps: 10, restTime: 75 },
        { name: "Lunges", sets: 3, reps: 12, restTime: 60 },
        { name: "Russian Twist", sets: 3, reps: 20, restTime: 30 },
      ], "Gün B")] },
      rest(),
      { day: "", notes: "", sessions: [s("Gün C", [
        { name: "Bulgarian Split Squat", sets: 3, reps: 10, restTime: 75 },
        { name: "Incline Bench Press", sets: 3, reps: 10, restTime: 75 },
        { name: "Lat Pulldown", sets: 3, reps: 10, restTime: 75 },
        { name: "Kettlebell Swing", sets: 4, reps: 15, restTime: 60 },
        { name: "Leg Raise", sets: 3, reps: 15, restTime: 30 },
      ], "Gün C")] },
      rest(),
      rest(),
    ]),
  },
  {
    id: "running_base",
    label: "Koşu Temeli",
    emoji: "🏃",
    description: "Haftada 3 gün koşu odaklı kardiyo programı. 4 hafta.",
    weeks: 4,
    week1: label([
      { day: "", notes: "", sessions: [s("Kolay Koşu", [
        { name: "Koşu Bandı", ...{ type: "cardio", cardioMinutes: 20 } } as any,
        { name: "Crunch", sets: 2, reps: 20, restTime: 30 },
        { name: "Plank", ...{ type: "isometric", holdSeconds: 45, restTime: 30 } } as any,
      ], "Kolay Koşu")] },
      rest(),
      { day: "", notes: "", sessions: [s("İnterval Antrenman", [
        { name: "Koşu Bandı", ...{ type: "cardio", cardioMinutes: 25 } } as any,
        { name: "Jump Rope", ...{ type: "cardio", cardioMinutes: 5 } } as any,
        { name: "Burpee", sets: 3, reps: 10, restTime: 60 },
      ], "İnterval")] },
      rest(),
      { day: "", notes: "", sessions: [s("Uzun Koşu", [
        { name: "Yürüyüş", ...{ type: "cardio", cardioMinutes: 10 } } as any,
        { name: "Koşu Bandı", ...{ type: "cardio", cardioMinutes: 30 } } as any,
        { name: "Bisiklet", ...{ type: "cardio", cardioMinutes: 10 } } as any,
      ], "Uzun Koşu")] },
      rest(),
      rest(),
    ]),
  },
];
