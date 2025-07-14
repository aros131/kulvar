// src/types/program.ts

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  duration: string;
  restTime?: number;
  videoUrls?: { url: string; description?: string }[];
}

export interface Session {
  name: string;
  exercises: Exercise[];
}

export interface Day {
  day: string;
  sessions: Session[];
  notes?: string;
}

export interface Video {
  name: string;
  url: string;
  description?: string;
}

export interface PDF {
  name: string;
  url: string;
  description?: string;
}

export interface Program {
  _id: string;
  name: string;
  description: string;
  duration?: number;
  difficulty?: string; // ✅ eklendi
  fitnessGoal?: string; // ✅ eklendi
  coachId?: string;
  coachName?: string;
  assignedClients?: string[];
  completionPercentage?: number;
  dailySchedule: Day[];
  exercises?: Exercise[];
  videos: Video[];
  pdfs: PDF[];
}

